import { useRef } from "react";
import { linkAttrs } from "@/lib/linkAttrs";

/** @typedef {import("@/content/catalog").CatalogItem} CatalogItem */

/**
 * @param {{
 *   profile: typeof import("@/content/profile").profile,
 *   slides: CatalogItem[],
 *   slide: number,
 *   attract: boolean,
 *   slideMs: number,
 *   onSelectSlide: (index: number) => void,
 *   getItemProps: (col: number) => Record<string, any>,
 *   onPlay: () => void,
 *   onContact: () => void
 * }} props
 */
export default function Billboard({ profile, slides, slide, attract, slideMs, onSelectSlide, getItemProps, onPlay, onContact }) {
  const stageRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const frame = useRef(0);
  const item = slides[slide] ?? slides[0];
  const isProfile = slide === 0;

  /** @param {import("react").PointerEvent<HTMLElement>} e */
  const onPointerMove = (e) => {
    if (e.pointerType !== "mouse") return;
    const { clientX, clientY, currentTarget } = e;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const r = currentTarget.getBoundingClientRect();
      const x = (clientX - r.left) / r.width - 0.5;
      const y = (clientY - r.top) / r.height - 0.5;
      stageRef.current?.style.setProperty("--ry", `${x * 18}deg`);
      stageRef.current?.style.setProperty("--rx", `${-y * 14}deg`);
    });
  };

  return (
    <section className="billboard" aria-labelledby="billboard-title" onPointerMove={onPointerMove}>
      <div className="billboard__grid" aria-hidden="true">
        <div />
      </div>

      <div className="billboard__copy">
        <div key={item.id} className="billboard__swap">
          <p className="billboard__kicker">
            <span className="billboard__dot" /> {isProfile ? "Bhawuk Original · Now Streaming" : "Featured Original"}
          </p>
          <h1 id="billboard-title" className="billboard__title">
            {item.title}
          </h1>
          {isProfile ? (
            <p className="billboard__role">
              {profile.role} <span>— {profile.tagline}</span>
            </p>
          ) : (
            <p className="billboard__role">
              <span>{item.kicker}</span>
            </p>
          )}
          <ul className="billboard__meta" aria-label="Highlights">
            {isProfile ? (
              <>
                <li className="billboard__pill">{profile.since} — Present</li>
                <li>{profile.company}</li>
                <li>{profile.location}</li>
                <li className="billboard__pill">webOS · Tizen · Web</li>
              </>
            ) : (
              item.tags?.map((t) => <li key={t}>{t}</li>)
            )}
          </ul>
          <p className="billboard__summary">{item.synopsis}</p>
        </div>
        <div className="billboard__actions">
          <button type="button" className="btn btn--primary" onClick={onPlay} {...getItemProps(0)}>
            <span aria-hidden="true">▶</span> {isProfile ? "Play Showreel" : "Watch now"}
          </button>
          <a className="btn" {...linkAttrs(profile.resumeUrl)} {...getItemProps(1)}>
            <span aria-hidden="true">↓</span> Resume
          </a>
          <button type="button" className="btn" onClick={onContact} {...getItemProps(2)}>
            <span aria-hidden="true">✉</span> Contact
          </button>
        </div>
        {slides.length > 1 && (
          <div className="billboard__dots" role="group" aria-label="Featured titles">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                tabIndex={-1}
                className="billboard__dot-btn"
                data-active={i === slide || undefined}
                aria-label={`Show ${s.title}`}
                onClick={() => onSelectSlide(i)}
              >
                {i === slide && attract && (
                  <span
                    key={`${slide}-progress`}
                    className="billboard__progress"
                    style={{ animationDuration: `${slideMs}ms` }}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        className="billboard__stage"
        ref={stageRef}
        aria-hidden="true"
        style={/** @type {import("react").CSSProperties} */ ({ "--a1": item.accent[0], "--a2": item.accent[1] })}
      >
        <div className="screen">
          <div className="screen__glare" />
          <span key={item.id} className="screen__mono">
            {item.glyph ?? profile.initials}
          </span>
          <span className="screen__label">{isProfile ? "Frontend · Player · Smart TV" : item.kicker}</span>
        </div>
        <span className="chip chip--a">60fps on TV</span>
        <span className="chip chip--b">Shaka · DASH · HLS</span>
        <span className="chip chip--c">~30% faster UI</span>
      </div>
    </section>
  );
}
