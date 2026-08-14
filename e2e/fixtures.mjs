import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect, test as base } from "@playwright/test";

const e2eDirectory = path.dirname(fileURLToPath(import.meta.url));
const extensionPath = path.resolve(e2eDirectory, "..", "dist");

export const test = base.extend({
  context: async ({}, use) => {
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

  extensionId: async ({ context }, use) => {
    let [serviceWorker] = context.serviceWorkers();

    if (serviceWorker === undefined) {
      serviceWorker = await context.waitForEvent("serviceworker");
    }

    const extensionId = serviceWorker.url().split("/")[2];

    if (extensionId === undefined || extensionId.length === 0) {
      throw new Error("Unable to determine the loaded FloatPlay extension id.");
    }

    await use(extensionId);
  }
});

export { expect };
