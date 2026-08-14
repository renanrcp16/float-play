import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: ["**/*.spec.mjs"],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  reporter: "list",
  outputDir: "test-results",
  use: {
    trace: "retain-on-failure"
  }
});
