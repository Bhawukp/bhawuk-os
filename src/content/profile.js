/** @typedef {{ label: string, href: string }} Link */

// Source of truth: the 2026 resume (player/frontend) and the general frontend resume in /public/resume.
export const profile = {
  name: "Bhawuk Pahuja",
  initials: "BP",
  role: "Frontend & Player Engineer",
  tagline: "Smart TV & Streaming",
  company: "Xperi (TiVo)",
  location: "Pune, India",
  since: 2022,
  summary:
    "I build the streaming players and React interfaces behind TiVo Plus on Smart TVs and the web. 3+ years at Xperi (TiVo) shipping high-performance HTML5 video — Shaka Player, DASH & HLS, DRM and adaptive bitrate — and keeping D-pad navigation at 60fps on low-powered TV hardware across LG webOS, Samsung Tizen and desktop browsers.",
  education: {
    degree: "B.E., Computer Science Engineering",
    school: "Chitkara University",
    period: "2019 – 2023",
    gpa: "9.93 / 10",
  },
  email: "bhawukp@gmail.com",
  resumeUrl: "/resume/bhawuk-pahuja-resume.pdf",
  /** @type {Link[]} */
  resumes: [
    { label: "Resume · Player & Frontend", href: "/resume/bhawuk-pahuja-resume.pdf" },
    { label: "Resume · Frontend", href: "/resume/bhawuk-pahuja-frontend-resume.pdf" },
  ],
  /** @type {Link[]} */
  socials: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/bhawuk-pahuja-1110" },
    { label: "GitHub", href: "https://github.com/Bhawukp" },
  ],
};
