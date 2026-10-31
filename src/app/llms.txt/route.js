import { siteUrl } from "@/config/flags";
import { profile } from "@/content/profile";
import { factsText } from "@/lib/server/knowledge";

// A plain-text profile for LLMs and agents (https://llmstxt.org).
export function GET() {
  const body = `# ${profile.name}

> ${profile.role} — ${profile.tagline}. ${profile.company}, ${profile.location}.

Site: ${siteUrl}
Resumes: ${profile.resumes.map((r) => `${siteUrl}${r.href}`).join(" , ")}
Email: ${profile.email}

${factsText()}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
