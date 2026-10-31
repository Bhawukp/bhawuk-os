import { profile } from "@/content/profile";
import { validateContact } from "@/lib/contact";
import { clientIp, rateLimit, readJson } from "@/lib/server/http";

const json = (/** @type {unknown} */ data, status = 200) => Response.json(data, { status });

/** @param {string} token @param {string} ip */
async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(5000),
    });
    return (await res.json()).success === true;
  } catch {
    return false;
  }
}

/** @param {Request} request */
export async function POST(request) {
  const { body, error, status } = await readJson(request);
  if (!body) return json({ error }, status);

  // Honeypot: bots fill every field; humans never see this one. Pretend success.
  if (body.company) return json({ ok: true });

  const { ok, data, errors } = validateContact(body);
  if (!ok) return json({ error: "Please fix the highlighted fields.", errors }, 400);

  const ip = clientIp(request);
  const limit = await rateLimit(`contact:${ip}`, 3, 600);
  if (!limit.ok) return json({ error: "Too many messages — please try again later." }, 429);

  if (!(await verifyTurnstile(typeof body.turnstileToken === "string" ? body.turnstileToken : "", ip))) {
    return json({ error: "Spam check failed — please try again." }, 400);
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return json({ error: "Messaging isn't configured yet.", fallback: "mailto" }, 501);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM || "Portfolio <onboarding@resend.dev>",
        to: [process.env.CONTACT_TO || profile.email],
        reply_to: data.email,
        subject: `Portfolio message from ${data.name}`,
        // Plain text only — user input is never rendered as HTML.
        text: `${data.message}\n\n— ${data.name} <${data.email}>`,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return json({ error: "Couldn't send right now.", fallback: "mailto" }, 502);
    return json({ ok: true });
  } catch {
    return json({ error: "Couldn't send right now.", fallback: "mailto" }, 502);
  }
}
