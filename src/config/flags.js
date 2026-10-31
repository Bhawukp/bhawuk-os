/** @param {string | undefined} value @param {boolean} fallback */
const bool = (value, fallback) => (value === undefined || value === "" ? fallback : value === "true");

/** @param {string | undefined} value @param {string[]} fallback */
const list = (value, fallback) =>
  value
    ? value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    : fallback;

// NEXT_PUBLIC_* values are inlined at build time, so changing them requires a redeploy.
export const flags = {
  enabledThemes: list(process.env.NEXT_PUBLIC_ENABLED_THEMES, ["tv-os"]),
  defaultTheme: process.env.NEXT_PUBLIC_DEFAULT_THEME || "tv-os",
  bootSequence: bool(process.env.NEXT_PUBLIC_FEATURE_BOOT, true),
  devOverlay: bool(process.env.NEXT_PUBLIC_FEATURE_DEV_OVERLAY, true),
  intro3d: bool(process.env.NEXT_PUBLIC_FEATURE_3D, true),
  previews: bool(process.env.NEXT_PUBLIC_FEATURE_PREVIEWS, true),
  sound: bool(process.env.NEXT_PUBLIC_FEATURE_SOUND, true),
  guide: bool(process.env.NEXT_PUBLIC_FEATURE_GUIDE, true),
  attract: bool(process.env.NEXT_PUBLIC_FEATURE_ATTRACT, true),
  ask: bool(process.env.NEXT_PUBLIC_FEATURE_ASK, true),
  contactForm: bool(process.env.NEXT_PUBLIC_FEATURE_CONTACT_FORM, true),
  webmcp: bool(process.env.NEXT_PUBLIC_FEATURE_WEBMCP, true),
};

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
