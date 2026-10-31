import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

// Runs against a production build (`npm run test:e2e` builds first). Uses the installed Google Chrome,
// so no Playwright browser download is needed.
export default defineConfig({
  testDir: "e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: "chrome",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"], channel: "chrome" } },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    // Secrets are cleared so tests exercise the keyless fallbacks deterministically.
    env: { GEMINI_API_KEY: "", RESEND_API_KEY: "", TURNSTILE_SECRET_KEY: "", UPSTASH_REDIS_REST_URL: "" },
  },
});
