"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDeviceTier } from "@/features/device-tier/useDeviceTier";
import { powerOn, usePower } from "@/features/power/power";
import { play, setSoundEnabled } from "@/features/sound/sound";

const LivingRoom = dynamic(() => import("./intro3d/LivingRoom"), { ssr: false });

const AUTO_ON_MS = 6000;
const ROOM_LINGER_MS = 1600;
const CRT_MS = 1900;
const FLY_MAX_MS = 4500;
const FADE_MS = 450;

/** @typedef {"standby" | "crt" | "flying" | "leaving"} Phase */

/** @param {{ initials: string, allow3d: boolean }} props */
export default function BootScreen(props) {
  const power = usePower();
  // Remounts on every power-off so each boot starts from a fresh standby.
  return power === "on" ? null : <Boot {...props} />;
}

/** @param {{ initials: string, allow3d: boolean }} props */
function Boot({ initials, allow3d }) {
  const tier = useDeviceTier();
  const use3d = allow3d && tier === "full";
  const [phase, setPhase] = useState(/** @type {Phase} */ ("standby"));
  const [ready3d, setReady3d] = useState(false);
  // One click can arrive as pointerdown + click (+ a 3D remote hit); only the first should power on.
  const started = useRef(false);

  const start = useCallback(
    (withSound = false) => {
      if (phase !== "standby" || started.current) return;
      started.current = true;
      if (withSound) setSoundEnabled(true);
      play("power");
      setPhase(use3d && ready3d ? "flying" : "crt");
    },
    [phase, use3d, ready3d],
  );

  const finish = useCallback(() => setPhase("leaving"), []);

  // Plain timers drive the sequence; CSS animations are purely visual.
  useEffect(() => {
    if (phase === "standby") {
      const id = setTimeout(start, use3d && ready3d ? ROOM_LINGER_MS : AUTO_ON_MS);
      return () => clearTimeout(id);
    }
    if (phase === "crt") {
      const id = setTimeout(finish, CRT_MS);
      return () => clearTimeout(id);
    }
    if (phase === "flying") {
      // Safety net in case the render loop is paused (e.g. background tab) and onArrive never fires.
      const id = setTimeout(finish, FLY_MAX_MS);
      return () => clearTimeout(id);
    }
    if (phase === "leaving") {
      const id = setTimeout(powerOn, FADE_MS);
      return () => clearTimeout(id);
    }
  }, [phase, use3d, ready3d, start, finish]);

  useEffect(() => {
    /** @param {KeyboardEvent} e */
    const onKey = (e) => {
      if (phase === "standby" && (e.key === "Enter" || e.key === " " || e.code === "NumpadEnter")) {
        e.preventDefault();
        start();
      } else if (phase === "crt" || phase === "flying") {
        finish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, start, finish]);

  /** @param {import("react").PointerEvent<HTMLDivElement>} e */
  const onPointerDown = (e) => {
    if (phase === "crt" || phase === "flying") finish();
    // Anywhere on the standby screen powers on, except the explicit "with sound" button.
    else if (phase === "standby" && !(/** @type {HTMLElement} */ (e.target).closest(".boot__sound"))) start();
  };

  const show3d = use3d && phase !== "crt";

  return (
    <div className="boot" data-phase={phase} data-3d={show3d && ready3d ? "" : undefined} onPointerDown={onPointerDown}>
      {show3d && (
        <LivingRoom
          powered={phase === "flying" || phase === "leaving"}
          onReady={() => setReady3d(true)}
          onArrive={finish}
          onRemoteClick={() => start()}
        />
      )}
      <div className="boot__flash" aria-hidden="true" />

      <div className="boot__standby" hidden={phase !== "standby"}>
        <span className="boot__led" aria-hidden="true" />
        <p className="boot__brand">
          {initials} · Bhawuk <span>OS</span>
        </p>
        <div className="boot__power-wrap">
          <svg className="boot__ring" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="46" />
          </svg>
          <button type="button" className="boot__power" onClick={() => start()} aria-label="Power on now">
            ⏻
          </button>
        </div>
        <p className="boot__prompt">
          {ready3d ? "Tuning in… press " : "Turning on… press "}
          <kbd>Enter</kbd> to skip
        </p>
        <button type="button" className="boot__sound" onClick={() => start(true)}>
          ♪ Turn on with sound
        </button>
      </div>

      <div className="boot__content" aria-hidden="true">
        <div className="boot__logo">{initials}</div>
        <p className="boot__name">
          Bhawuk <span>OS</span>
        </p>
        <div className="boot__bar">
          <span />
        </div>
        <p className="boot__hint">Press any key to skip</p>
      </div>
      <div className="boot__scanlines" aria-hidden="true" />
    </div>
  );
}
