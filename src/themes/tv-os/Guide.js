"use client";

import { useEffect, useState } from "react";
import { play } from "@/features/sound/sound";
import { useSpatialNav } from "@/features/spatial-nav/useSpatialNav";

/** @typedef {import("@/content/catalog").GuideChannel} GuideChannel */
/** @typedef {import("@/content/catalog").Program} Program */

const FROM = 2017;
const TO = 2028;
const YEAR_PX = 150;
const CHANNEL_PX = 120;

const nowYear = () => {
  const d = new Date();
  return d.getFullYear() + d.getMonth() / 12;
};

const slot = (/** @type {Program} */ p) =>
  p.period ?? (p.ongoing ? `${p.start} — Now` : p.end - p.start > 1 ? `${p.start} — ${p.end}` : `${p.start}`);

/** Programs sharing the same slot split it evenly, like short shows in a real EPG. @param {Program[]} programs */
function layout(programs) {
  const sorted = [...programs].sort((a, b) => a.start - b.start);
  return sorted.map((p) => {
    const siblings = sorted.filter((s) => s.start === p.start && s.end === p.end);
    const width = ((p.end - p.start) * YEAR_PX) / siblings.length;
    return { program: p, left: (p.start - FROM) * YEAR_PX + siblings.indexOf(p) * width, width };
  });
}

/**
 * @param {{ channels: GuideChannel[], enabled: boolean, onOpen: (p: Program) => void, onClose: () => void }} props
 */
export default function Guide({ channels, enabled, onOpen, onClose }) {
  const [now] = useState(nowYear);
  const nav = useSpatialNav({ enabled, onBack: onClose, onMove: () => play("tick") });
  const { focusAt } = nav;
  const rows = channels.map((c) => layout(c.programs));

  const careerRow = channels.findIndex((c) => c.id === "career");
  const live = rows[careerRow]?.findIndex(({ program }) => program.start <= now && now < program.end) ?? -1;

  useEffect(() => {
    // Open on the programme airing "now", like a real TV guide.
    const id = requestAnimationFrame(() => focusAt(careerRow + 1, Math.max(live, 0)));
    return () => cancelAnimationFrame(id);
  }, [focusAt, careerRow, live]);

  const focused = rows[nav.focus.row - 1]?.[nav.focus.col]?.program;
  const width = (TO - FROM) * YEAR_PX;
  const years = Array.from({ length: TO - FROM }, (_, i) => FROM + i);
  const nowTitle = live >= 0 ? rows[careerRow][live].program.title : "";

  return (
    <div className="guide" role="dialog" aria-modal="true" aria-label="TV Guide" inert={!enabled}>
      <header className="guide__head">
        <span className="guide__logo">▦ TV Guide</span>
        {nowTitle && (
          <span className="guide__airing">
            <span className="guide__live">● Live</span> {nowTitle}
          </span>
        )}
        <button type="button" className="guide__close" onClick={onClose}>
          Close <kbd>Esc</kbd>
        </button>
      </header>

      {focused && (
        <section
          key={focused.id}
          className="guide__info"
          style={/** @type {import("react").CSSProperties} */ ({ "--a1": focused.accent[0], "--a2": focused.accent[1] })}
        >
          <div className="guide__art" aria-hidden="true">
            {focused.glyph ?? focused.title.slice(0, 2)}
          </div>
          <div>
            <p className="guide__slot">
              {slot(focused)} · {focused.kicker}
            </p>
            <h2 className="guide__title">{focused.title}</h2>
            <p className="guide__synopsis">{focused.synopsis}</p>
            <p className="guide__hint">
              <kbd>Enter</kbd> Open · <kbd>←</kbd>
              <kbd>→</kbd> Time · <kbd>↑</kbd>
              <kbd>↓</kbd> Channel
            </p>
          </div>
        </section>
      )}

      <div className="guide__scroller" style={/** @type {import("react").CSSProperties} */ ({ "--channel": `${CHANNEL_PX}px` })}>
        <div className="guide__canvas" style={{ width: width + CHANNEL_PX }}>
          <div className="guide__ruler">
            <span className="guide__corner" />
            {years.map((y) => (
              <span key={y} style={{ width: YEAR_PX }} data-past={y + 1 <= now || undefined}>
                {y}
              </span>
            ))}
          </div>
          {channels.map((channel, r) => (
            <div key={channel.id} className="guide__row">
              <span className="guide__channel">
                <small>{String(r + 1).padStart(2, "0")}</small> {channel.title}
              </span>
              <div className="guide__track" style={{ width }}>
                {rows[r].map(({ program, left, width: w }, c) => {
                  const state = program.start > now ? "upcoming" : program.end <= now ? "past" : "live";
                  const style = /** @type {import("react").CSSProperties} */ ({
                    left,
                    width: w - 4,
                    "--a1": program.accent[0],
                  });
                  return (
                    <button
                      key={program.id}
                      type="button"
                      className="guide__program"
                      data-state={state}
                      style={style}
                      onClick={() => onOpen(program)}
                      {...nav.getItemProps(r + 1, c)}
                    >
                      <span className="guide__program-title">{program.title}</span>
                      <span className="guide__program-slot">{slot(program)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <span className="guide__nowline" style={{ left: CHANNEL_PX + (now - FROM) * YEAR_PX }} aria-hidden="true">
            <span>Now</span>
          </span>
        </div>
      </div>
    </div>
  );
}
