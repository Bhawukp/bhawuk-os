import { expect, test } from "@playwright/test";
import { bootToHome } from "./helpers";

test.describe("Ask Bhawuk", () => {
  test("answers from the site's content without an API key", async ({ page }) => {
    await bootToHome(page);
    await page.getByRole("button", { name: /Ask Bhawuk assistant/ }).click();
    const ask = page.getByRole("dialog", { name: "Ask Bhawuk" });
    await expect(ask).toBeVisible();
    await ask.getByLabel("Your question").fill("Which video player and DRM has he worked with?");
    await ask.getByRole("button", { name: "Ask", exact: true }).click();
    await expect(ask.locator(".ask__msg--assistant").last()).toContainText(/Shaka|Widevine|DRM/);
    await page.keyboard.press("Escape");
    await expect(ask).toHaveCount(0);
  });
});

test.describe("contact form", () => {
  test("validates fields, then falls back to an email draft when sending isn't configured", async ({ page }) => {
    await bootToHome(page);
    await page.locator("#cast .card").first().click();
    const form = page.getByRole("dialog", { name: "Send a message" });
    await expect(form).toBeVisible();

    await form.getByRole("button", { name: "Send message" }).click();
    await expect(form.getByRole("alert").first()).toBeVisible();

    await form.getByLabel("Name").fill("Test Recruiter");
    await form.getByLabel("Email").fill("recruiter@example.com");
    await form.getByLabel(/Message/).fill("Loved the TV portfolio — let's talk about a player role.");
    await form.getByRole("button", { name: "Send message" }).click();

    const draft = form.getByRole("link", { name: "Open email draft" });
    await expect(draft).toBeVisible();
    await expect(draft).toHaveAttribute("href", /^mailto:bhawukp@gmail\.com\?subject=/);
  });
});
