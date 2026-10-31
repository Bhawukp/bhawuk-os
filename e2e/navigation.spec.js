import { expect, test } from "@playwright/test";
import { activePos, bootToHome } from "./helpers";

test.describe("TV navigation", () => {
  test.beforeEach(async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "keyboard/remote navigation is a desktop experience");
    await bootToHome(page);
  });

  test("arrow keys move focus between rows and cards", async ({ page }) => {
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowDown");
    expect(await activePos(page)).toMatch(/^1:/);
    await page.keyboard.press("ArrowRight");
    expect(await activePos(page)).toMatch(/^1:1$/);
  });

  test("Enter opens a title, C toggles commentary, Esc closes", async ({ page }) => {
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("c");
    await expect(dialog.getByText("Director's commentary")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("number keys surf channels with an on-screen display", async ({ page }) => {
    await page.keyboard.press("3");
    await expect(page.locator(".osd")).toContainText("CH 03");
    expect(await activePos(page)).toMatch(/^3:0$/);
  });

  test("G opens the TV Guide on the live programme; Esc closes", async ({ page }) => {
    await page.keyboard.press("g");
    const guide = page.getByRole("dialog", { name: "TV Guide" });
    await expect(guide).toBeVisible();
    await expect(guide.locator(".guide__program[data-state='live']").first()).toBeVisible();
    await expect(guide.locator(".guide__info")).toContainText("Engineer");
    await page.keyboard.press("Escape");
    await expect(guide).toHaveCount(0);
  });

  test("the on-screen remote drives navigation", async ({ page }) => {
    await page.getByRole("button", { name: "Show remote" }).click();
    await page.getByRole("button", { name: "Down", exact: true }).click();
    expect(await activePos(page)).toMatch(/^1:/);
    await page.getByRole("button", { name: "OK" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});

test.describe("touch / mobile", () => {
  test("rows are swipeable and a tap opens a title", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "mobile only");
    await bootToHome(page);
    await page.locator("#originals .card").first().tap();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
