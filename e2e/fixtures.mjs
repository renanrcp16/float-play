import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect, test as base } from "@playwright/test";

const e2eDirectory = path.dirname(fileURLToPath(import.meta.url));
const extensionPath = path.resolve(e2eDirectory, "..", "dist");

async function resolveExtensionServiceWorker(context) {
  let [serviceWorker] = context.serviceWorkers();

  if (serviceWorker === undefined) {
    serviceWorker = await context.waitForEvent("serviceworker");
  }

  return serviceWorker;
}

export const test = base.extend({
  context: async ({ browserName }, use) => {
    if (browserName !== "chromium") {
      throw new Error("FloatPlay extension E2E tests require Chromium.");
    }

    const context = await chromium.launchPersistentContext("", {
      channel: "chromium",
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`
      ]
    });

    await use(context);
    await context.close();
  },

  extensionWorker: async ({ context }, use) => {
    await use(await resolveExtensionServiceWorker(context));
  },

  extensionId: async ({ extensionWorker }, use) => {
    const extensionId = extensionWorker.url().split("/")[2];

    if (extensionId === undefined || extensionId.length === 0) {
      throw new Error("Unable to determine the loaded FloatPlay extension id.");
    }

    await use(extensionId);
  }
});

export { expect };
