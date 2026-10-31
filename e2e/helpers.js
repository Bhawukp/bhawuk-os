import { expect } from "@playwright/test";

/** A fresh fake client IP per test keeps server rate limits from leaking between tests. */
export const fakeIp = () => `10.${(Math.random() * 255) | 0}.${(Math.random() * 255) | 0}.${(Math.random() * 255) | 0}`;

/**
 * Loads the site, skips the intro with Enter and waits until the TV is on.
 * @param {import("@playwright/test").Page} page
 * @param {"lite" | "mid" | "full"} [tier]
 */
export async function bootToHome(page, tier = "lite") {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": fakeIp() });
  await page.goto(`/?tier=${tier}`);
  await expect(page.locator(".boot")).toHaveAttribute("data-phase", "standby");
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-booted", "1");
  await expect(page.locator(".boot")).toHaveCount(0);
}

/** @param {import("@playwright/test").Page} page */
export const activePos = (page) => page.evaluate(() => document.activeElement?.getAttribute("data-pos") ?? null);
