import { profile } from "./profile";
import { experience } from "./experience";
import { projects } from "./projects";
import { skills, playerSkills } from "./skills";
import { certifications } from "./certifications";
import { testimonials } from "./testimonials";
import { timeline } from "./timeline";
import { stats } from "./stats";

/**
 * @typedef {{ label: string, href: string }} Link
 * @typedef {{
 *   id: string, title: string, glyph?: string, accent: string[], kicker?: string, badge?: string,
 *   synopsis?: string, highlights?: string[], tags?: string[], links?: Link[], progress?: number,
 *   href?: string, comingSoon?: boolean, meta?: string, commentary?: string[], action?: "contact"
 * }} CatalogItem
 * @typedef {{ id: string, title: string, variant: "landscape" | "poster" | "tile" | "quote" | "action" | "stat", items: CatalogItem[] }} CatalogRow
 * @typedef {CatalogItem & { start: number, end: number, ongoing?: boolean, period?: string }} Program
 * @typedef {{ id: string, title: string, programs: Program[] }} GuideChannel
 */

/** @returns {CatalogItem} */
export function buildAbout() {
  const { education } = profile;
  return {
    id: "about",
    title: profile.name,
    kicker: "Bhawuk Original · The Pilot",
    meta: `${profile.role} · ${profile.company} · ${profile.location}`,
    glyph: profile.initials,
    accent: ["#8b5cf6", "#22d3ee"],
    synopsis: profile.summary,
    highlights: [
      "Owns Shaka Player modules across TiVo Plus web and Smart TV apps",
      "~30% faster player UI · ~25% faster feature delivery · 60fps D-pad navigation",
      "Ships to LG webOS, Samsung Tizen and desktop browsers",
      `${education.degree}, ${education.school} — GPA ${education.gpa}`,
    ],
    tags: ["React", "TypeScript", "Shaka Player", "DASH/HLS", "DRM", "Smart TV"],
    links: [...profile.resumes, { label: "Email", href: `mailto:${profile.email}` }, ...profile.socials],
    commentary: [
      "This whole site is the pilot episode: built the way I build TV apps — focus-first, budget-aware, keyboard and remote friendly.",
      "Try the TV Guide with G, surf channels with the number keys, or press D for the live performance overlay.",
    ],
  };
}

/** Titles the billboard cycles through in attract mode. @returns {CatalogItem[]} */
export function buildFeatured() {
  const featured = projects.filter((p) => !p.comingSoon && !p.archive);
  return [buildAbout(), ...featured.map((p) => ({ ...p, meta: p.kicker }))];
}

/** Life, education, career, projects and learning laid out on a year-based TV Guide. @returns {GuideChannel[]} */
export function buildGuide() {
  const { education } = profile;
  return [
    {
      id: "life",
      title: "Life",
      programs: timeline.map((t) => ({ ...t, kicker: `Life · ${t.year}`, start: t.year, end: t.year + 1 })),
    },
    {
      id: "education",
      title: "Education",
      programs: [
        {
          id: "chitkara",
          title: education.degree,
          kicker: `${education.school} · ${education.period}`,
          period: education.period,
          glyph: "9.93",
          accent: ["#eab308", "#422006"],
          synopsis: `${education.degree} at ${education.school}, graduating with a GPA of ${education.gpa}.`,
          start: 2019,
          end: 2023,
        },
      ],
    },
    {
      id: "career",
      title: "Career",
      programs: experience.map((e) => ({ ...e, kicker: `${e.episode} · ${e.org}`, meta: e.period })),
    },
    {
      id: "originals",
      title: "Originals",
      programs: projects
        .filter((p) => p.year !== undefined)
        .map((p) => ({ ...p, start: /** @type {number} */ (p.year), end: /** @type {number} */ (p.year) + 1 })),
    },
    {
      id: "learning",
      title: "Learning",
      programs: certifications.map(({ href, ...c }) => ({
        ...c,
        kicker: `${c.issuer} · ${c.year}`,
        start: Number(c.year),
        end: Number(c.year) + 1,
        links: href ? [{ label: "Credential", href }] : [],
      })),
    },
  ];
}

/** @param {{ contactForm?: boolean }} [options] @returns {CatalogRow[]} */
export function buildCatalog({ contactForm = false } = {}) {
  return [
    {
      id: "originals",
      title: "Bhawuk Originals",
      variant: "poster",
      items: projects.filter((p) => !p.archive).map((p) => ({ ...p, meta: p.kicker })),
    },
    {
      id: "continue",
      title: "Continue Watching · Career",
      variant: "landscape",
      items: experience.map((e) => ({
        ...e,
        kicker: `${e.episode} · ${e.period}`,
        meta: `${e.org} · ${e.period}`,
      })),
    },
    {
      id: "numbers",
      title: "By the Numbers",
      variant: "stat",
      items: stats.map((s) => ({ ...s, kicker: "Impact", meta: s.title })),
    },
    {
      id: "player",
      title: "Now Playing · Player & Streaming",
      variant: "tile",
      items: playerSkills.map((s) => ({ ...s, kicker: "Player & Streaming" })),
    },
    {
      id: "channels",
      title: "Channels · Frontend",
      variant: "tile",
      items: skills.map((s) => ({ ...s, kicker: "Frontend" })),
    },
    {
      id: "awards",
      title: "Awards · Certifications",
      variant: "landscape",
      items: certifications.map(({ href, ...c }) => ({
        ...c,
        kicker: `${c.issuer} · ${c.year}`,
        meta: `${c.issuer} · ${c.year}`,
        links: href ? [{ label: "Credential", href }] : [],
      })),
    },
    {
      id: "reviews",
      title: "Reviews",
      variant: "quote",
      items: testimonials.map((t) => ({
        id: t.id,
        title: t.author,
        kicker: t.relation,
        synopsis: t.quote,
        accent: t.accent,
      })),
    },
    {
      id: "archive",
      title: "From the Archive · Early Work",
      variant: "landscape",
      items: projects.filter((p) => p.archive).map((p) => ({ ...p, meta: p.kicker })),
    },
    {
      id: "cast",
      title: "Cast to Bhawuk · Contact",
      variant: "action",
      items: [
        ...(contactForm
          ? [
              /** @type {CatalogItem} */ ({
                id: "message",
                title: "Send a message",
                glyph: "✉",
                meta: "Straight to my inbox",
                action: "contact",
                accent: ["#ec4899", "#500724"],
              }),
            ]
          : []),
        { id: "email", title: "Email me", glyph: "@", meta: profile.email, href: `mailto:${profile.email}`, accent: ["#8b5cf6", "#4c1d95"] },
        ...profile.resumes.map((r, i) => ({
          id: `resume-${i}`,
          title: r.label,
          glyph: "CV",
          meta: "Download PDF",
          href: r.href,
          accent: i === 0 ? ["#22d3ee", "#164e63"] : ["#38bdf8", "#0c4a6e"],
        })),
        ...profile.socials.map((s) => ({
          id: s.label.toLowerCase(),
          title: s.label,
          glyph: s.label === "GitHub" ? "GH" : "in",
          meta: s.href.replace(/^https?:\/\/(www\.)?/, ""),
          href: s.href,
          accent: s.label === "GitHub" ? ["#475569", "#0f172a"] : ["#0a66c2", "#0c2a4d"],
        })),
      ],
    },
  ];
}
