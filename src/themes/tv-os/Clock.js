"use client";

import { useSyncExternalStore } from "react";

/** @param {() => void} notify */
const subscribe = (notify) => {
  const id = setInterval(notify, 15_000);
  return () => clearInterval(id);
};
const getTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function Clock() {
  const time = useSyncExternalStore(subscribe, getTime, () => "");
  return (
    <time className="topbar__clock" suppressHydrationWarning>
      {time}
    </time>
  );
}
