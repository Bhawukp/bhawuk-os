/** @typedef {"lite" | "mid" | "full"} DeviceTier */

const SOFTWARE_GPU = /swiftshader|llvmpipe|software|basic render/i;

function webgl2Quality() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return "none";
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return SOFTWARE_GPU.test(renderer) ? "software" : "hardware";
  } catch {
    return "none";
  }
}

export const DESKTOP_QUERY = "(pointer: fine) and (hover: hover) and (min-width: 1024px)";

/**
 * Decides how much visual budget this device gets. `?tier=lite|mid|full` overrides for testing,
 * but phones and tablets can never be forced into the 3D tier.
 * @returns {DeviceTier}
 */
export function getDeviceTier() {
  const desktop = matchMedia(DESKTOP_QUERY).matches;
  const override = new URLSearchParams(location.search).get("tier");
  if (override === "lite" || override === "mid") return override;
  if (override === "full") return desktop ? "full" : "mid";

  const nav = /** @type {any} */ (navigator);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return "lite";
  if (nav.connection?.saveData || /2g/.test(nav.connection?.effectiveType ?? "")) return "lite";

  const memory = nav.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 4;

  if (!desktop) return memory >= 4 && cores >= 6 ? "mid" : "lite";
  if (memory < 4 || cores < 4) return "mid";
  return webgl2Quality() === "hardware" ? "full" : "mid";
}
