import "server-only";
import { certifications } from "@/content/certifications";
import { experience } from "@/content/experience";
import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import { playerSkills, skills } from "@/content/skills";
import { stats } from "@/content/stats";
import { testimonials } from "@/content/testimonials";

/** @typedef {{ topic: string, text: string }} Snippet */

/** Every fact the assistant (and llms.txt) may use — derived only from the content files. @returns {Snippet[]} */
export function snippets() {
  const { education } = profile;
  return [
    { topic: "About", text: `${profile.name} is a ${profile.role} (${profile.tagline}) at ${profile.company}, ${profile.location}. ${profile.summary}` },
    {
      topic: "Education",
      text: `${education.degree}, ${education.school} (${education.period}), GPA ${education.gpa}.`,
    },
    ...experience.map((e) => ({
      topic: `Experience: ${e.title}`,
      text: `${e.title} at ${e.org} (${e.period}). ${e.synopsis} Highlights: ${e.highlights.join("; ")}. Tech: ${e.tags.join(", ")}.`,
    })),
    ...projects.map((p) => ({
      topic: `Project: ${p.title}`,
      text: `${p.title} (${p.kicker}). ${p.synopsis}${p.highlights?.length ? ` Highlights: ${p.highlights.join("; ")}.` : ""} Tech: ${p.tags.join(", ")}.${p.links?.length ? ` Links: ${p.links.map((l) => l.href).join(", ")}.` : ""}`,
    })),
    { topic: "Player & streaming skills", text: playerSkills.map((s) => `${s.title}: ${s.synopsis}`).join(" ") },
    { topic: "Frontend skills", text: skills.map((s) => `${s.title}: ${s.synopsis}`).join(" ") },
    { topic: "Impact numbers", text: stats.map((s) => `${s.glyph} ${s.title}: ${s.synopsis}`).join(" ") },
    { topic: "Certifications", text: certifications.map((c) => `${c.title} — ${c.issuer} (${c.year})`).join("; ") + "." },
    { topic: "Recommendations", text: testimonials.map((t) => `${t.author} (${t.relation}): "${t.quote}"`).join(" ") },
    {
      topic: "Contact",
      text: `Email ${profile.email}. ${profile.socials.map((s) => `${s.label}: ${s.href}`).join(". ")}. Resumes: ${profile.resumes.map((r) => r.label).join(", ")} (downloadable on the site).`,
    },
  ];
}

export const factsText = () => snippets().map((s) => `## ${s.topic}\n${s.text}`).join("\n\n");

const STOP = new Set(
  "a an and are as at be by can did do does for from has have he him his how i in is it me my of on or so tell that the their them this to was what when where which who why with work works you your about bhawuk pahuja".split(" "),
);

/** @param {string} s */
const words = (s) => s.toLowerCase().match(/[a-z0-9.+#]+/g)?.filter((w) => w.length > 1 && !STOP.has(w)) ?? [];

/** Keyword-overlap retrieval used when no LLM key is configured (or the LLM call fails). @param {string} question */
export function localAnswer(question) {
  const q = new Set(words(question));
  const ranked = snippets()
    .map((s) => {
      const hay = words(`${s.topic} ${s.text}`);
      return { s, score: hay.reduce((n, w) => n + (q.has(w) ? 1 : 0), 0) };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  if (!ranked.length) {
    return `I can tell you about Bhawuk's work on streaming players at Xperi (TiVo), his projects, skills, education and how to reach him. Try asking "What does he work on at TiVo?" — or email ${profile.email}.`;
  }
  return ranked.map(({ s }) => `${s.topic} — ${s.text}`).join("\n\n");
}
