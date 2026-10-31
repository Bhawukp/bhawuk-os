"use client";

import { useEffect, useState } from "react";

/** Maps keyboard keys to remote buttons so physical presses light up the on-screen remote. */
const KEY_TO_BUTTON = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  Enter: "ok",
  Escape: "back",
  Backspace: "back",
  PageUp: "ch-up",
  PageDown: "ch-down",
  m: "mute",
  M: "mute",
};

/** @param {string} key */
const sendKey = (key) => window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));

/** Keeps DOM focus on the focused card instead of moving it to the remote button. */
const keepFocus = (/** @type {import("react").PointerEvent} */ e) => e.preventDefault();

/**
 * The remote speaks "keyboard": every button dispatches the same key events a TV remote or keyboard would.
 * @param {{ onOk: () => void, onPower: () => void, onMute: () => void, soundOn: boolean, soundEnabled: boolean }} props
 */
export default function Remote({ onOk, onPower, onMute, soundOn, soundEnabled }) {
  const [open, setOpen] = useState(false);
  const [pressed, setPressed] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    /** @param {KeyboardEvent} e */
    const down = (e) => setPressed(KEY_TO_BUTTON[/** @type {keyof typeof KEY_TO_BUTTON} */ (e.key)] ?? (/^\d$/.test(e.key) ? `n${e.key}` : null));
    const up = () => setPressed(null);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    if (!pressed) return;
    // Synthetic presses from the remote have no keyup, so release them on a timer.
    const id = setTimeout(() => setPressed(null), 180);
    return () => clearTimeout(id);
  }, [pressed]);

  /** @param {string} id @param {string} label @param {() => void} action @param {import("react").ReactNode} [children] */
  const btn = (id, label, action, children) => (
    <button
      type="button"
      className={`remote__btn remote__btn--${id}`}
      data-pressed={pressed === id || undefined}
      aria-label={label}
      onPointerDown={keepFocus}
      onClick={action}
    >
      {children}
    </button>
  );

  if (!open) {
    return (
      <div className="legend">
        <span>
          <kbd>←</kbd>
          <kbd>↑</kbd>
          <kbd>↓</kbd>
          <kbd>→</kbd> Navigate
        </span>
        <span>
          <kbd>0-9</kbd> Channels
        </span>
        <span>
          <kbd>G</kbd> Guide
        </span>
        <span>
          <kbd>Esc</kbd> Back
        </span>
        <button type="button" className="legend__remote" onClick={() => setOpen(true)}>
          Show remote
        </button>
      </div>
    );
  }

  return (
    <div className="remote" role="group" aria-label="On-screen remote">
      <div className="remote__top">
        {btn("power", "Power off", onPower, "⏻")}
        {soundEnabled && btn("mute", soundOn ? "Mute" : "Unmute", onMute, soundOn ? "♪" : "×")}
        <button type="button" className="remote__hide" onClick={() => setOpen(false)} aria-label="Hide remote">
          –
        </button>
      </div>
      <div className="remote__dpad">
        {btn("up", "Up", () => sendKey("ArrowUp"), "▲")}
        {btn("left", "Left", () => sendKey("ArrowLeft"), "◀")}
        {btn("ok", "OK", onOk, "OK")}
        {btn("right", "Right", () => sendKey("ArrowRight"), "▶")}
        {btn("down", "Down", () => sendKey("ArrowDown"), "▼")}
      </div>
      <div className="remote__row">
        {btn("back", "Back", () => sendKey("Escape"), "↩")}
        {btn("n0", "Home", () => sendKey("0"), "⌂")}
      </div>
      <div className="remote__rocker">
        {btn("ch-up", "Channel up", () => sendKey("PageUp"), "CH +")}
        {btn("ch-down", "Channel down", () => sendKey("PageDown"), "CH −")}
      </div>
      <p className="remote__brand">Bhawuk OS</p>
    </div>
  );
}
