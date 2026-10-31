"use client";

import { useEffect, useRef, useState } from "react";
import { play } from "@/features/sound/sound";
import { CONTACT_LIMITS, mailtoFallback, validateContact } from "@/lib/contact";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/** @returns {Promise<any>} */
function loadTurnstile() {
  const w = /** @type {any} */ (window);
  if (w.turnstile) return Promise.resolve(w.turnstile);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => resolve(w.turnstile);
    document.head.appendChild(s);
  });
}

/**
 * @param {{ to: string, initial?: { name?: string, email?: string, message?: string }, onClose: () => void }} props
 */
export default function ContactOverlay({ to, initial, onClose }) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    message: initial?.message ?? "",
    company: "",
  });
  const [errors, setErrors] = useState(/** @type {Record<string, string>} */ ({}));
  const [status, setStatus] = useState(/** @type {"idle" | "sending" | "sent" | "fallback" | "error"} */ ("idle"));
  const [notice, setNotice] = useState("");
  const [token, setToken] = useState("");
  const firstField = useRef(/** @type {HTMLInputElement | null} */ (null));
  const widget = useRef(/** @type {HTMLDivElement | null} */ (null));

  useEffect(() => {
    firstField.current?.focus();
    /** @param {KeyboardEvent} e */
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!SITE_KEY) return;
    let id;
    loadTurnstile().then((t) => {
      if (widget.current) id = t.render(widget.current, { sitekey: SITE_KEY, theme: "dark", callback: setToken });
    });
    return () => {
      if (id !== undefined) /** @type {any} */ (window).turnstile?.remove(id);
    };
  }, []);

  /** @param {"name" | "email" | "message" | "company"} field */
  const bind = (field) => ({
    value: form[field],
    onChange: (/** @type {import("react").ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} */ e) =>
      setForm((f) => ({ ...f, [field]: e.target.value })),
  });

  /** @param {import("react").FormEvent} e */
  const submit = async (e) => {
    e.preventDefault();
    const v = validateContact(form);
    if (!v.ok) {
      setErrors(v.errors);
      return;
    }
    setErrors({});
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v.data, company: form.company, turnstileToken: token }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        play("select");
        setStatus("sent");
      } else if (data.fallback === "mailto") {
        setStatus("fallback");
      } else {
        if (data.errors) setErrors(data.errors);
        setNotice(data.error ?? "Something went wrong — please try again.");
        setStatus("error");
      }
    } catch {
      setStatus("fallback");
    }
  };

  const valid = validateContact(form).data;

  return (
    <div className="detail contact" role="dialog" aria-modal="true" aria-labelledby="contact-title">
      <div className="detail__scrim" onClick={onClose} />
      <div className="detail__panel contact__panel">
        <div className="contact__head">
          <p className="detail__kicker">Cast to Bhawuk</p>
          <h2 id="contact-title" className="detail__title">
            Send a message
          </h2>
          <p className="detail__meta">Recruiter, collaborator or just saying hi — it lands straight in Bhawuk&apos;s inbox.</p>
        </div>

        {status === "sent" ? (
          <div className="contact__done" role="status">
            <p className="contact__big">Message sent ✓</p>
            <p>Thanks, {valid.name}. Bhawuk will reply to {valid.email}.</p>
            <button type="button" className="btn btn--primary" onClick={onClose}>
              Back to TV
            </button>
          </div>
        ) : status === "fallback" ? (
          <div className="contact__done" role="status">
            <p className="contact__big">Almost there</p>
            <p>Direct messaging isn&apos;t switched on yet, so your note has been turned into an email you can send in one click.</p>
            <div className="detail__actions">
              <a className="btn btn--primary" href={mailtoFallback(valid, to)}>
                Open email draft
              </a>
              <button type="button" className="btn" onClick={onClose}>
                Back
              </button>
            </div>
          </div>
        ) : (
          <form className="contact__form" onSubmit={submit} noValidate>
            <label className="contact__field">
              <span>Name</span>
              <input ref={firstField} name="name" autoComplete="name" maxLength={CONTACT_LIMITS.name} {...bind("name")} aria-invalid={!!errors.name} />
              {errors.name && <small role="alert">{errors.name}</small>}
            </label>
            <label className="contact__field">
              <span>Email</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                maxLength={CONTACT_LIMITS.email}
                {...bind("email")}
                aria-invalid={!!errors.email}
              />
              {errors.email && <small role="alert">{errors.email}</small>}
            </label>
            <label className="contact__field contact__field--wide">
              <span>
                Message <em>{form.message.trim().length}/{CONTACT_LIMITS.messageMax}</em>
              </span>
              <textarea name="message" rows={5} maxLength={CONTACT_LIMITS.messageMax} {...bind("message")} aria-invalid={!!errors.message} />
              {errors.message && <small role="alert">{errors.message}</small>}
            </label>
            {/* Honeypot: hidden from people and assistive tech, irresistible to bots. */}
            <label className="contact__hp" aria-hidden="true">
              Company
              <input name="company" tabIndex={-1} autoComplete="off" {...bind("company")} />
            </label>
            {SITE_KEY && <div ref={widget} className="contact__turnstile" />}
            {status === "error" && (
              <p className="contact__error" role="alert">
                {notice}
              </p>
            )}
            <div className="detail__actions">
              <button type="submit" className="btn btn--primary" disabled={status === "sending"}>
                {status === "sending" ? "Sending…" : "Send message"}
              </button>
              <button type="button" className="btn" onClick={onClose}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
