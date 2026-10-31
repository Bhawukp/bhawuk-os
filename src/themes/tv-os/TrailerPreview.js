/** @typedef {import("@/content/catalog").CatalogItem} CatalogItem */

const WIDTH = 380;

/** Stable fake "match" score so each title always shows the same number. @param {string} id */
const match = (id) => 90 + ([...id].reduce((h, c) => h + c.charCodeAt(0), 0) % 10);

/** @param {{ item: CatalogItem, rect: DOMRect }} props */
export default function TrailerPreview({ item, rect }) {
  const width = Math.max(WIDTH, rect.width * 1.25);
  const left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, 12), window.innerWidth - width - 12);
  const top = Math.max(rect.top - 28, 72);
  const style = /** @type {import("react").CSSProperties} */ ({
    left,
    top,
    width,
    "--a1": item.accent[0],
    "--a2": item.accent[1],
  });

  return (
    <div className="preview" style={style} aria-hidden="true">
      <div className="preview__art">
        <span className="preview__glyph">{item.glyph ?? item.title.slice(0, 2)}</span>
        <span className="preview__scan" />
        <span className="preview__live">● Preview</span>
        <span className="preview__eq">
          <i />
          <i />
          <i />
          <i />
        </span>
      </div>
      <div className="preview__body">
        <p className="preview__meta">
          <span className="preview__match">{match(item.id)}% match</span>
          {item.kicker && <span>{item.kicker}</span>}
        </p>
        <p className="preview__title">{item.title}</p>
        {item.synopsis && <p className="preview__synopsis">{item.synopsis}</p>}
        {!!item.tags?.length && (
          <ul className="preview__tags">
            {item.tags.slice(0, 4).map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
        <p className="preview__hint">
          <kbd>Enter</kbd> {item.href ? "Open" : "Watch now"}
        </p>
      </div>
    </div>
  );
}
