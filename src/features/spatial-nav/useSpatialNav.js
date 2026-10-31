"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** @typedef {{ row: number, col: number }} FocusPos */

const KEY_DIRS = /** @type {const} */ ({ ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" });

/** @param {EventTarget | null} target */
const isTyping = (target) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** @param {HTMLElement} el */
const centerX = (el) => {
  const r = el.getBoundingClientRect();
  return r.left + r.width / 2;
};

/**
 * Geometry-based focus engine for TV-style grids of rows.
 * @param {{ enabled?: boolean, onBack?: () => void, onMove?: (pos: FocusPos) => void }} [options]
 */
export function useSpatialNav({ enabled = true, onBack, onMove } = {}) {
  const [focus, setFocus] = useState(/** @type {FocusPos} */ ({ row: 0, col: 0 }));
  /** @type {import("react").RefObject<Map<number, Map<number, HTMLElement>>>} */
  const grid = useRef(new Map());
  const focusRef = useRef(focus);
  const onBackRef = useRef(onBack);
  const onMoveRef = useRef(onMove);

  useEffect(() => {
    focusRef.current = focus;
    onBackRef.current = onBack;
    onMoveRef.current = onMove;
  });

  const getEl = useCallback((/** @type {number} */ row, /** @type {number} */ col) => grid.current.get(row)?.get(col), []);

  const focusAt = useCallback(
    (/** @type {number} */ row, /** @type {number} */ col, scroll = true) => {
      const el = getEl(row, col);
      if (!el) return;
      setFocus({ row, col });
      el.focus({ preventScroll: true });
      if (!scroll) return;
      onMoveRef.current?.({ row, col });
      const behavior = prefersReducedMotion() ? "auto" : "smooth";
      if (row === 0) window.scrollTo({ top: 0, behavior });
      else el.scrollIntoView({ behavior, block: "center", inline: "nearest" });
    },
    [getEl],
  );

  const move = useCallback(
    (/** @type {"up" | "down" | "left" | "right"} */ dir, force = false) => {
      const { row, col } = focusRef.current;
      const current = getEl(row, col);

      if (current && !force && document.activeElement !== current) return focusAt(row, col);

      if (dir === "left" || dir === "right") {
        const next = col + (dir === "right" ? 1 : -1);
        if (getEl(row, next)) focusAt(row, next);
        return;
      }

      const rows = [...grid.current.keys()].sort((a, b) => a - b);
      const targetRow = dir === "down" ? rows.find((r) => r > row) : rows.findLast((r) => r < row);
      if (targetRow === undefined) return;

      const items = grid.current.get(targetRow);
      if (!items?.size) return;
      const x = current ? centerX(current) : 0;
      let best = 0;
      let bestDist = Infinity;
      for (const [c, el] of items) {
        const d = Math.abs(centerX(el) - x);
        if (d < bestDist) [best, bestDist] = [c, d];
      }
      focusAt(targetRow, best);
    },
    [focusAt, getEl],
  );

  useEffect(() => {
    if (!enabled) return;
    /** @param {KeyboardEvent} e */
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || isTyping(e.target)) return;
      const dir = KEY_DIRS[/** @type {keyof typeof KEY_DIRS} */ (e.key)];
      if (dir) {
        e.preventDefault();
        // The first real keypress just "wakes" focus; synthetic presses from the on-screen remote always move.
        move(dir, !e.isTrusted);
      } else if (e.key === "Escape" || e.key === "Backspace") {
        onBackRef.current?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, move]);

  const getItemProps = useCallback(
    (/** @type {number} */ row, /** @type {number} */ col) => {
      const isFocused = focus.row === row && focus.col === col;
      return {
        ref: (/** @type {HTMLElement | null} */ el) => {
          if (!el) return;
          if (!grid.current.has(row)) grid.current.set(row, new Map());
          grid.current.get(row)?.set(col, el);
          return () => {
            grid.current.get(row)?.delete(col);
            if (!grid.current.get(row)?.size) grid.current.delete(row);
          };
        },
        tabIndex: isFocused ? 0 : -1,
        "data-focused": isFocused || undefined,
        "data-pos": `${row}:${col}`,
        onFocus: () => setFocus({ row, col }),
        onPointerEnter: (/** @type {import("react").PointerEvent<HTMLElement>} */ e) => {
          if (e.pointerType === "mouse") focusAt(row, col, false);
        },
      };
    },
    [focus, focusAt],
  );

  const refocus = useCallback(() => focusAt(focusRef.current.row, focusRef.current.col, false), [focusAt]);

  const activate = useCallback(() => getEl(focusRef.current.row, focusRef.current.col)?.click(), [getEl]);

  return { focus, focusAt, refocus, move, activate, getItemProps };
}
