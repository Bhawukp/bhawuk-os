/** Shared by the contact form (client) and the contact API (server). */

export const CONTACT_LIMITS = { name: 80, email: 254, messageMin: 10, messageMax: 2000 };

/** @param {unknown} value */
const text = (value) => (typeof value === "string" ? value : "").trim();

/**
 * @param {{ name?: unknown, email?: unknown, message?: unknown }} input
 * @returns {{ ok: boolean, data: { name: string, email: string, message: string }, errors: Record<string, string> }}
 */
export function validateContact(input) {
  const name = text(input?.name).replace(/[\r\n\t]+/g, " ");
  const email = text(input?.email);
  const message = text(input?.message);
  /** @type {Record<string, string>} */
  const errors = {};

  if (!name || name.length > CONTACT_LIMITS.name) errors.name = `Please enter your name (up to ${CONTACT_LIMITS.name} characters).`;
  // Length is checked before the regex so the pattern only ever sees short input.
  if (!email || email.length > CONTACT_LIMITS.email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.email = "Please enter a valid email address.";
  }
  if (message.length < CONTACT_LIMITS.messageMin || message.length > CONTACT_LIMITS.messageMax) {
    errors.message = `Message should be ${CONTACT_LIMITS.messageMin}–${CONTACT_LIMITS.messageMax} characters.`;
  }

  return { ok: Object.keys(errors).length === 0, data: { name, email, message }, errors };
}

/** @param {{ name: string, email: string, message: string }} data @param {string} to */
export function mailtoFallback(data, to) {
  const subject = encodeURIComponent(`Hello from ${data.name || "your portfolio"}`);
  const body = encodeURIComponent(`${data.message}\n\n— ${data.name} (${data.email})`);
  return `mailto:${to}?subject=${subject}&body=${body}`;
}
