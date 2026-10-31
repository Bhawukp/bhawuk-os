"use client";

import { useSyncExternalStore } from "react";

/** @typedef {"off" | "on"} PowerState */

/** @type {PowerState | null} */
let state = null;
const listeners = new Set();

/** @returns {PowerState} */
function getState() {
  // The inline head script marks repeat visits as already booted before hydration.
  state ??= document.documentElement.hasAttribute("data-booted") ? "on" : "off";
  return state;
}

/** @param {PowerState} next */
function setState(next) {
  if (getState() === next) return;
  state = next;
  const root = document.documentElement;
  if (next === "on") {
    root.setAttribute("data-booted", "1");
    root.setAttribute("data-intro", "1");
  } else {
    root.removeAttribute("data-booted");
    root.removeAttribute("data-intro");
  }
  listeners.forEach((l) => l());
}

export const powerOn = () => setState("on");
export const powerOff = () => setState("off");

/** @param {() => void} l */
const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** @returns {PowerState} */
export function usePower() {
  return useSyncExternalStore(subscribe, getState, () => "off");
}
