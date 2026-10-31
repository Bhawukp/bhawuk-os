import "server-only";

/** @type {Map<string, { count: number, reset: number }>} */
const memory = new Map();

/** Real client IP on Vercel; the platform overwrites x-forwarded-for so it can't be spoofed by clients. @param {Request} request */
export function clientIp(request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "anon";
}

/**
 * Fixed-window rate limit. Uses Upstash Redis when configured (shared across serverless instances),
 * otherwise an in-memory window per instance.
 * @param {string} key @param {number} limit @param {number} windowSec
 */
export async function rateLimit(key, limit, windowSec) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    try {
      const res = await fetch(`${url}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify([
          ["INCR", `rl:${key}`],
          ["EXPIRE", `rl:${key}`, String(windowSec), "NX"],
        ]),
        cache: "no-store",
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const [{ result: count }] = await res.json();
        return { ok: count <= limit, retryAfter: windowSec };
      }
    } catch {}
  }

  const now = Date.now();
  if (memory.size > 5000) for (const [k, v] of memory) if (v.reset < now) memory.delete(k);
  const entry = memory.get(key);
  if (!entry || entry.reset < now) {
    memory.set(key, { count: 1, reset: now + windowSec * 1000 });
    return { ok: true, retryAfter: windowSec };
  }
  entry.count++;
  return { ok: entry.count <= limit, retryAfter: Math.ceil((entry.reset - now) / 1000) };
}

/** Parses a small JSON body, rejecting oversized or malformed payloads. @param {Request} request @param {number} maxBytes */
export async function readJson(request, maxBytes = 10_000) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > maxBytes) return { error: "Payload too large", status: 413 };
  try {
    const text = await request.text();
    if (text.length > maxBytes) return { error: "Payload too large", status: 413 };
    const body = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "Invalid JSON body", status: 400 };
    return { body };
  } catch {
    return { error: "Invalid JSON body", status: 400 };
  }
}
