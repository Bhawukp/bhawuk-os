import { flags } from "@/config/flags";
import TvOsTheme from "./tv-os";

/**
 * @typedef {{ id: string, label: string, Component: import("react").ComponentType<any> }} ThemeDefinition
 */

// Static imports: Turbopack can't resolve client references inside dynamically imported server modules.
/** @type {Record<string, ThemeDefinition>} */
const themes = {
  "tv-os": { id: "tv-os", label: "Bhawuk OS", Component: TvOsTheme },
};

/** @returns {ThemeDefinition} */
export function getActiveTheme() {
  const enabled = flags.enabledThemes.filter((id) => id in themes);
  const id = enabled.includes(flags.defaultTheme) ? flags.defaultTheme : enabled[0] ?? "tv-os";
  return themes[id];
}
