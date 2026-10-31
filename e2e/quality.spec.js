import { gzipSync } from "node:zlib";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { bootToHome } from "./helpers";

const INITIAL_JS_BUDGET_KB = 200;

test.describe("performance budget", () => {
  test("initial JS stays under budget and never includes three.js", async ({ request }, info) => {
    test.skip(info.project.name !== "desktop", "runs once");
    const html = await (await request.get("/")).text();
    const scripts = [...new Set(html.match(/\/_next\/static\/[^"']+\.js/g) ?? [])];
    let total = 0;
    for (const src of scripts) {
      const body = await (await request.get(src)).body();
      expect(body.toString("utf8").includes("WebGLRenderer"), `${src} must not contain three.js`).toBe(false);
      total += gzipSync(body).length;
    }
    const kb = Math.round(total / 1024);
    test.info().annotations.push({ type: "initial JS (gzip)", description: `${kb} KB` });
    expect(kb).toBeLessThan(INITIAL_JS_BUDGET_KB);
  });

  test("phones never download the 3D engine", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "mobile only");
    let threeLoaded = false;
    page.on("response", async (res) => {
      if (res.url().endsWith(".js") && (await res.text().catch(() => "")).includes("WebGLRenderer")) threeLoaded = true;
    });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-booted", "1", { timeout: 10_000 });
    await page.waitForLoadState("networkidle");
    expect(threeLoaded).toBe(false);
  });
});

test.describe("accessibility", () => {
  test("home screen has no serious or critical axe violations", async ({ page }) => {
    await bootToHome(page);
    // Let the power-on entrance animations settle so contrast is measured at full opacity.
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => a.effect?.getTiming().iterations !== Infinity)
          .map((a) => a.finished.catch(() => {})),
      ),
    );
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(
      blocking.map((v) => `${v.id}: ${v.nodes.length} × ${v.nodes[0]?.target.join(" ")}`),
      "serious/critical a11y violations",
    ).toEqual([]);
  });
});
