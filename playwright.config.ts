/**
 * Playwright config para los E2E del reto Retail IA Center.
 *
 * Pre-requisito: el stack docker-compose tiene que estar arriba (front-end en
 * :5174, inventory-service en :3001, core-retail-service en :3002).
 *
 *   cd ../Backend && docker compose up -d
 *
 * Luego:
 *   npm run test:e2e
 */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: false,
  retries: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5174",
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
