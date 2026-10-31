"use client";

import { useEffect, useState } from "react";

const kb = (/** @type {number} */ bytes) => `${(bytes / 1024).toFixed(1)} KB`;

function readStats() {
  const scripts = /** @type {PerformanceResourceTiming[]} */ (performance.getEntriesByType("resource")).filter(
    (e) => e.initiatorType === "script" || /\.js(\?|$)/.test(e.name),
  );
  const js = scripts.reduce((sum, e) => sum + (e.transferSize || e.encodedBodySize), 0);
  const memory = /** @type {any} */ (performance).memory;
  const nav = /** @type {any} */ (navigator);
  return {
    js: kb(js),
    scripts: scripts.length,
    dom: document.getElementsByTagName("*").length,
    heap: memory ? `${(memory.usedJSHeapSize / 1048576).toFixed(1)} MB` : "n/a",
    device: `${nav.deviceMemory ?? "?"} GB · ${navigator.hardwareConcurrency ?? "?"} cores`,
  };
}

/** @param {{ focus: { row: number, col: number }, onClose: () => void }} props */
export default function DevOverlay({ focus, onClose }) {
  const [fps, setFps] = useState(0);
  const [longTasks, setLongTasks] = useState(0);
  const [stats, setStats] = useState(/** @type {ReturnType<typeof readStats> | null} */ (null));

  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = requestAnimationFrame(function tick(now) {
      frames++;
      if (now - last >= 500) {
        setFps(Math.round((frames * 1000) / (now - last)));
        setStats(readStats());
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(tick);
    });

    let observer;
    if (PerformanceObserver.supportedEntryTypes?.includes("longtask")) {
      observer = new PerformanceObserver((list) => setLongTasks((n) => n + list.getEntries().length));
      observer.observe({ type: "longtask", buffered: true });
    }
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, []);

  const fpsClass = fps >= 55 ? "ok" : fps >= 30 ? "warn" : "bad";

  return (
    <aside className="dev" aria-label="Developer overlay">
      <header className="dev__head">
        <span>Under the hood</span>
        <button type="button" onClick={onClose} aria-label="Close developer overlay">
          ×
        </button>
      </header>
      <dl className="dev__grid">
        <dt>FPS</dt>
        <dd className={`dev__${fpsClass}`}>{fps || "…"}</dd>
        <dt>Long tasks</dt>
        <dd className={longTasks ? "dev__warn" : "dev__ok"}>{longTasks}</dd>
        <dt>JS loaded</dt>
        <dd>{stats ? `${stats.js} · ${stats.scripts} files` : "…"}</dd>
        <dt>DOM nodes</dt>
        <dd>{stats?.dom ?? "…"}</dd>
        <dt>JS heap</dt>
        <dd>{stats?.heap ?? "…"}</dd>
        <dt>Device</dt>
        <dd>{stats?.device ?? "…"}</dd>
        <dt>Focus</dt>
        <dd>
          row {focus.row} · col {focus.col}
        </dd>
      </dl>
      <p className="dev__note">This panel was lazy-loaded just now — it isn&apos;t in the initial bundle.</p>
    </aside>
  );
}
