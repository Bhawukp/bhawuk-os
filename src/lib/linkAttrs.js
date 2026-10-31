/** @param {string} href */
export function linkAttrs(href) {
  if (/^https?:\/\//.test(href)) return { href, target: "_blank", rel: "noopener noreferrer" };
  if (href.endsWith(".pdf")) return { href, download: "" };
  return { href };
}
