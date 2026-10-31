"use client";

/** @typedef {import("@/content/catalog").CatalogItem} CatalogItem */

/** @param {unknown} value */
const text = (value) => ({ content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }] });

/**
 * Exposes the portfolio to in-browser AI agents via WebMCP (navigator.modelContext), when the browser supports it.
 * Side-effecting tools only prepare UI for the human (e.g. prefill the contact form) — they never send anything themselves.
 * @param {{
 *   about: CatalogItem,
 *   items: CatalogItem[],
 *   resumes: { label: string, href: string }[],
 *   openTitle: (item: CatalogItem) => void,
 *   openContact: (prefill: { name?: string, email?: string, message?: string }) => void,
 *   openGuide: () => void
 * }} api
 * @returns {() => void} cleanup
 */
export function registerWebMcp({ about, items, resumes, openTitle, openContact, openGuide }) {
  const mc = /** @type {any} */ (navigator).modelContext;
  if (!mc) return () => {};

  const find = (/** @type {string} */ id) => items.find((i) => i.id === id);
  const summary = (/** @type {CatalogItem} */ i) => ({ id: i.id, title: i.title, kind: i.kicker });

  const tools = [
    {
      name: "get_profile",
      description: "Get Bhawuk Pahuja's professional summary, highlights, skills and contact links.",
      inputSchema: { type: "object", properties: {} },
      execute: async () => text({ name: about.title, role: about.meta, summary: about.synopsis, highlights: about.highlights, links: about.links }),
    },
    {
      name: "list_titles",
      description: "List everything on the portfolio: work case studies, projects, career roles, skills and certifications.",
      inputSchema: { type: "object", properties: {} },
      execute: async () => text(items.map(summary)),
    },
    {
      name: "get_title",
      description: "Get full details (synopsis, highlights, tech, engineering commentary) for one title by id.",
      inputSchema: { type: "object", properties: { id: { type: "string", description: "Id from list_titles" } }, required: ["id"] },
      execute: async (/** @type {{ id: string }} */ { id }) => {
        const item = find(id);
        return text(item ? { ...summary(item), synopsis: item.synopsis, highlights: item.highlights, tech: item.tags, commentary: item.commentary, links: item.links } : `No title with id "${id}".`);
      },
    },
    {
      name: "open_title",
      description: "Open a title's detail screen in the user's browser so they can see it.",
      inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
      execute: async (/** @type {{ id: string }} */ { id }) => {
        const item = find(id);
        if (!item) return text(`No title with id "${id}".`);
        openTitle(item);
        return text(`Opened "${item.title}".`);
      },
    },
    {
      name: "open_tv_guide",
      description: "Open the TV Guide showing Bhawuk's life, education, career, projects and learning on a timeline.",
      inputSchema: { type: "object", properties: {} },
      execute: async () => {
        openGuide();
        return text("TV Guide opened.");
      },
    },
    {
      name: "get_resume_links",
      description: "Get download links for Bhawuk's resumes (PDF).",
      inputSchema: { type: "object", properties: {} },
      execute: async () => text(resumes.map((r) => ({ label: r.label, url: new URL(r.href, location.origin).href }))),
    },
    {
      name: "prefill_contact_form",
      description: "Open the contact form prefilled with a draft. The user reviews and sends it themselves.",
      inputSchema: {
        type: "object",
        properties: { name: { type: "string" }, email: { type: "string" }, message: { type: "string" } },
      },
      execute: async (/** @type {{ name?: string, email?: string, message?: string }} */ draft) => {
        openContact({ name: draft?.name?.slice(0, 80), email: draft?.email?.slice(0, 254), message: draft?.message?.slice(0, 2000) });
        return text("Contact form opened with the draft. The user must review and press Send.");
      },
    },
  ];

  if (typeof mc.provideContext === "function") {
    mc.provideContext({ tools });
    return () => mc.clearContext?.();
  }
  if (typeof mc.registerTool === "function") {
    const registrations = tools.map((t) => mc.registerTool(t));
    return () =>
      registrations.forEach((r, i) => {
        if (typeof r?.unregister === "function") r.unregister();
        else mc.unregisterTool?.(tools[i].name);
      });
  }
  return () => {};
}
