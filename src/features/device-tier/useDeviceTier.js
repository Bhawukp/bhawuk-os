"use client";

import { useSyncExternalStore } from "react";
import { DESKTOP_QUERY, getDeviceTier } from "./getDeviceTier";

/** @type {import("./getDeviceTier").DeviceTier | null} */
let tier = null;
const getTier = () => (tier ??= getDeviceTier());

/** Recomputes when the screen crosses the desktop threshold (rotation, resize, DevTools device mode). @param {() => void} notify */
const subscribe = (notify) => {
  const mq = matchMedia(DESKTOP_QUERY);
  const onChange = () => {
    tier = null;
    notify();
  };
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

/** The server always assumes "lite". */
export function useDeviceTier() {
  return useSyncExternalStore(subscribe, getTier, () => "lite");
}
