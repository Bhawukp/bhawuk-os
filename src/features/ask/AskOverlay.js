"use client";

import { useEffect, useRef, useState } from "react";
import { play } from "@/features/sound/sound";

/** @typedef {{ role: "user" | "assistant", text: string, source?: "ai" | "local" }} Message */

const SUGGESTIONS = [
  "What does Bhawuk work on at TiVo?",
  "Which streaming tech has he used?",
  "What's his biggest performance win?",
  "How can I contact him?",
];

/** @param {{ onClose: () => void }} props */
export default function AskOverlay({ onClose }) {
  const [messages, setMessages] = useState(
    /** @type {Message[]} */ ([
      { role: "assistant", text: "Hi! I'm the Bhawuk OS assistant. Ask me anything about Bhawuk's streaming-player work, projects or skills." },
    ]),
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const listRef = useRef(/** @type {HTMLOListElement | null} */ (null));

  useEffect(() => {
    inputRef.current?.focus();
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
    listRef.current?.lastElementChild?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, loading]);

  /** @param {string} question */
  const ask = async (question) => {
    const q = question.trim();
    if (!q || loading) return;
    play("open");
    const history = messages.slice(1).slice(-6).map(({ role, text }) => ({ role, text }));
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, history }),
      });
      const data = await res.json().catch(() => ({}));
      setMessages((m) => [
        ...m,
        res.ok
          ? { role: "assistant", text: data.answer, source: data.source }
          : { role: "assistant", text: data.error ?? "Something went wrong — try again in a moment." },
      ]);
      play("select");
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "I couldn't reach the server. Check your connection and try again." }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const listen = () => {
    const w = /** @type {any} */ (window);
    const Recognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Recognition) return;
    const rec = new Recognition();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (/** @type {any} */ e) => ask(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  };

  return (
    <div className="ask" role="dialog" aria-modal="true" aria-labelledby="ask-title">
      <div className="ask__scrim" onClick={onClose} />
      <div className="ask__panel">
        <header className="ask__head">
          <span className="ask__orb" data-busy={loading || listening || undefined} aria-hidden="true" />
          <h2 id="ask-title">Ask Bhawuk</h2>
          <button type="button" className="ask__close" onClick={onClose}>
            Close <kbd>Esc</kbd>
          </button>
        </header>

        <ol className="ask__log" ref={listRef} aria-live="polite">
          {messages.map((m, i) => (
            <li key={i} className={`ask__msg ask__msg--${m.role}`}>
              <p>{m.text}</p>
              {m.source === "local" && <small>From the site&apos;s content</small>}
            </li>
          ))}
          {loading && (
            <li className="ask__msg ask__msg--assistant ask__typing" aria-label="Thinking">
              <i />
              <i />
              <i />
            </li>
          )}
        </ol>

        {messages.length === 1 && (
          <div className="ask__chips">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" onClick={() => ask(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          className="ask__form"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <button type="button" className="ask__mic" onClick={listen} aria-label="Ask with your voice" data-on={listening || undefined}>
            ●
          </button>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={500}
            placeholder="Ask about his work, skills, projects…"
            aria-label="Your question"
          />
          <button type="submit" className="btn btn--primary" disabled={loading || !input.trim()}>
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
