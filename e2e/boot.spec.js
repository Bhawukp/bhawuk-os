import { expect, test } from "@playwright/test";
import { bootToHome } from "./helpers";

test.describe("boot sequence", () => {
  test("turns on by itself within ~6s without any input", async ({ page }) => {
    await page.goto("/?tier=lite");
    await expect(page.locator(".boot")).toHaveAttribute("data-phase", "standby");
    await page.waitForTimeout(4_000);
    await expect(page.locator(".boot")).toHaveAttribute("data-phase", "standby");
    await expect(page.locator("html")).toHaveAttribute("data-booted", "1", { timeout: 8_000 });
    await expect(page.locator(".boot")).toHaveCount(0);
  });

  test("Enter skips the standby screen", async ({ page }) => {
    await bootToHome(page);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("clicking the power button turns the TV on", async ({ page }) => {
    await page.goto("/?tier=lite");
    await page.getByRole("button", { name: "Power on now" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-booted", "1", { timeout: 5_000 });
  });

  test("a repeat visit in the same session skips the intro", async ({ page }) => {
    await bootToHome(page);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-booted", "1");
    await expect(page.locator(".boot")).toBeHidden();
  });

  test("power off then back on", async ({ page }) => {
    await bootToHome(page);
    await page.getByRole("button", { name: "Turn the TV off" }).click();
    await expect(page.locator(".boot")).toHaveAttribute("data-phase", "standby");
    await page.keyboard.press("Enter");
    await expect(page.locator(".boot")).toHaveCount(0);
  });

  test("3D tier flies in automatically and frees the canvas afterwards", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "3D intro is desktop-only");
    await page.goto("/?tier=full");
    await expect(page.locator(".room")).toBeAttached({ timeout: 15_000 });
    await expect(page.locator("html")).toHaveAttribute("data-booted", "1", { timeout: 20_000 });
    await expect(page.locator(".room canvas")).toHaveCount(0);
  });

  test("phones never get the 3D room, even when forced with ?tier=full", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "mobile only");
    await page.goto("/?tier=full");
    await expect(page.locator(".boot")).toHaveAttribute("data-phase", "standby");
    await page.waitForTimeout(2_000);
    await expect(page.locator(".room")).toHaveCount(0);
  });
});
