import { linkAttrs } from "@/lib/linkAttrs";

/** @typedef {import("@/content/catalog").CatalogItem} CatalogItem */
/** @typedef {import("@/content/catalog").CatalogRow} CatalogRow */

/**
 * @param {{ item: CatalogItem, variant: CatalogRow["variant"], itemProps: Record<string, any>, onOpen: (item: CatalogItem) => void }} props
 */
function Card({ item, variant, itemProps, onOpen }) {
  const style = /** @type {import("react").CSSProperties} */ ({ "--a1": item.accent[0], "--a2": item.accent[1] });
  const className = `card card--${variant}${item.comingSoon ? " card--soon" : ""}`;

  const content =
    variant === "quote" ? (
      <>
        <span className="card__quote">“{item.synopsis}”</span>
        <span className="card__body">
          <span className="card__title">{item.title}</span>
          <span className="card__meta">{item.kicker}</span>
        </span>
      </>
    ) : (
      <>
        <span className="card__art" aria-hidden="true">
          <span className="card__glyph">{item.glyph}</span>
        </span>
        {item.badge && <span className="card__badge">{item.badge}</span>}
        {item.comingSoon && <span className="card__badge card__badge--soon">Coming soon</span>}
        <span className="card__body">
          <span className="card__title">{item.title}</span>
          {item.meta && <span className="card__meta">{item.meta}</span>}
        </span>
        {item.progress !== undefined && (
          <span className="card__progress" aria-label={`${item.progress}% watched`}>
            <span style={{ width: `${item.progress}%` }} />
          </span>
        )}
      </>
    );

  if (item.href) {
    return (
      <a className={className} style={style} {...linkAttrs(item.href)} {...itemProps}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" className={className} style={style} onClick={() => onOpen(item)} {...itemProps}>
      {content}
    </button>
  );
}

/**
 * @param {{ row: CatalogRow, index: number, getItemProps: (col: number) => Record<string, any>, onOpen: (item: CatalogItem) => void }} props
 */
export default function Rail({ row, index, getItemProps, onOpen }) {
  return (
    <section className="rail" id={row.id} aria-labelledby={`${row.id}-title`} style={/** @type {any} */ ({ "--i": index })}>
      <h2 id={`${row.id}-title`} className="rail__title">
        <span className="rail__ch">CH {String(index + 1).padStart(2, "0")}</span>
        {row.title}
      </h2>
      <div className="rail__track" role="list">
        {row.items.map((item, col) => (
          <div role="listitem" key={item.id} className="rail__cell">
            <Card item={item} variant={row.variant} itemProps={getItemProps(col)} onOpen={onOpen} />
          </div>
        ))}
      </div>
    </section>
  );
}
