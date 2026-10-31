import { siteUrl } from "@/config/flags";
import { experience } from "@/content/experience";
import { profile } from "@/content/profile";
import { playerSkills, skills } from "@/content/skills";
import { getActiveTheme } from "@/themes/registry";

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: experience.at(-1)?.title,
  description: profile.summary,
  url: siteUrl,
  email: `mailto:${profile.email}`,
  worksFor: { "@type": "Organization", name: profile.company },
  alumniOf: { "@type": "CollegeOrUniversity", name: profile.education.school },
  address: { "@type": "PostalAddress", addressLocality: profile.location },
  sameAs: profile.socials.map((s) => s.href),
  knowsAbout: [...playerSkills, ...skills].map((s) => s.title),
};

export default function Home() {
  const { Component: Theme } = getActiveTheme();
  return (
    <>
      <script
        type="application/ld+json"
        // Escaping "<" prevents the JSON from closing the script tag early.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c") }}
      />
      <Theme />
    </>
  );
}
