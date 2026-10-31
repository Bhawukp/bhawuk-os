import { siteUrl } from "@/config/flags";
import { profile } from "@/content/profile";

export default function sitemap() {
  return [
    { url: siteUrl, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/llms.txt`, changeFrequency: "monthly", priority: 0.5 },
    ...profile.resumes.map((r) => ({ url: `${siteUrl}${r.href}`, changeFrequency: "monthly", priority: 0.6 })),
  ];
}
