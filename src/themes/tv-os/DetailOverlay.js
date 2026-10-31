import { useEffect, useRef, useState } from "react";
import { play } from "@/features/sound/sound";
import { linkAttrs } from "@/lib/linkAttrs";

/** @typedef {import("@/content/catalog").CatalogItem} CatalogItem */

/** Fake but stable track timestamps for the commentary notes. @param {number} i */
const timestamp = (i) => {
  const s = 12 + i * 41;
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

/** @param {{ item: CatalogItem, onClose: () => void }} props */
export default function DetailOverlay({ item, onClose }) {
  const panelRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const [commentary, setCommentary] = useState(false);
  const hasCommentary = !!item.commentary?.length;

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const actions = () => /** @type {HTMLElement[]} */ ([...panel.querySelectorAll("[data-action]")]);
    actions()[0]?.focus({ preventScroll: true });

    /** @param {KeyboardEvent} e */
    const onKey = (e) => {
      if (e.key === "Escape" || e.key === "Backspace") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key.toLowerCase() === "c" && hasCommentary) {
        play("open");
        setCommentary((v) => !v);
        return;
      }
      const list = actions();
      const i = list.indexOf(/** @type {HTMLElement} */ (document.activeElement));
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (step || e.key === "Tab") {
        e.preventDefault();
        const dir = step ?? (e.shiftKey ? -1 : 1);
        list[(i + dir + list.length) % list.length]?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, hasCommentary]);

  const style = /** @type {import("react").CSSProperties} */ ({ "--a1": item.accent[0], "--a2": item.accent[1] });

  return (
    <div className="detail" role="dialog" aria-modal="true" aria-labelledby="detail-title" style={style}>
      <div className="detail__scrim" onClick={onClose} />
      <div className="detail__panel" ref={panelRef}>
        <div className="detail__art" aria-hidden="true">
          <span className="card__glyph">{item.glyph ?? item.title.slice(0, 2)}</span>
        </div>
        <div className="detail__body">
          {item.kicker && <p className="detail__kicker">{item.kicker}</p>}
          <h2 id="detail-title" className="detail__title">
            {item.title}
          </h2>
          {item.meta && item.meta !== item.kicker && <p className="detail__meta">{item.meta}</p>}
          {item.synopsis && <p className="detail__synopsis">{item.synopsis}</p>}

          {commentary && hasCommentary ? (
            <section className="commentary" aria-label="Director's commentary">
              <h3 className="detail__label">
                <span className="commentary__wave" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                Director&apos;s commentary
              </h3>
              <ol className="commentary__track">
                {item.commentary?.map((note, i) => (
                  <li key={note} style={/** @type {import("react").CSSProperties} */ ({ "--n": i })}>
                    <span className="commentary__ts">{timestamp(i)}</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : (
            <>
              {!!item.highlights?.length && (
                <>
                  <h3 className="detail__label">Episode highlights</h3>
                  <ul className="detail__list">
                    {item.highlights.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </>
              )}

              {!!item.tags?.length && (
                <>
                  <h3 className="detail__label">Cast</h3>
                  <ul className="detail__tags">
                    {item.tags.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}

          <div className="detail__actions">
            {item.links?.map((l, i) => (
              <a key={l.href} data-action className={`btn${i === 0 ? " btn--primary" : ""}`} {...linkAttrs(l.href)}>
                {l.label}
              </a>
            ))}
            {hasCommentary && (
              <button
                type="button"
                data-action
                className="btn btn--commentary"
                aria-pressed={commentary}
                onClick={() => {
                  play("open");
                  setCommentary((v) => !v);
                }}
              >
                <span aria-hidden="true">●</span> Commentary {commentary ? "on" : "off"}
              </button>
            )}
            <button type="button" data-action className="btn" onClick={onClose}>
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
