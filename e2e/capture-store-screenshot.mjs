import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { stdout } from "node:process";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const e2eDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(e2eDirectory, "..");
const extensionPath = path.join(rootDir, "dist");
const outputDir = path.join(rootDir, "artifacts", "web-store");
const outputPath = path.join(outputDir, "options-page-en-1280x800.png");
const viewport = { width: 1280, height: 800 };

await mkdir(outputDir, { recursive: true });
await rm(outputPath, { force: true });

const context = await chromium.launchPersistentContext("", {
  channel: "chromium",
  viewport,
  deviceScaleFactor: 1,
  colorScheme: "light",
  locale: "en-US",
  args: [
    `--disable-extensions-except=${extensionPath}`,
    `--load-extension=${extensionPath}`,
    "--lang=en-US"
  ]
});

try {
  let [serviceWorker] = context.serviceWorkers();

  if (serviceWorker === undefined) {
    serviceWorker = await context.waitForEvent("serviceworker");
  }

  const extensionId = serviceWorker.url().split("/")[2];
  if (extensionId === undefined || extensionId.length === 0) {
    fail("unable to determine the loaded FloatPlay extension id");
  }

  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto(`chrome-extension://${extensionId}/options.html`, {
    waitUntil: "domcontentloaded"
  });
  await page.locator("h1").waitFor({ state: "visible" });

  const heading = (await page.locator("h1").textContent())?.trim();
  if (heading !== "FloatPlay Settings") {
    fail(`unexpected Options Page heading: ${String(heading)}`);
  }

  await page.evaluate(async () => {
    await document.fonts.ready;
  });

  if (pageErrors.length > 0) {
    fail(`Options Page emitted page errors: ${pageErrors.join(" | ")}`);
  }

  if (consoleErrors.length > 0) {
    fail(`Options Page emitted console errors: ${consoleErrors.join(" | ")}`);
  }

  const screenshot = await page.screenshot({
    path: outputPath,
    fullPage: false,
    animations: "disabled",
    caret: "hide",
    type: "png"
  });

  assertPngDimensions(screenshot, viewport.width, viewport.height);

  stdout.write(
    `Chrome Web Store screenshot captured: ${path.relative(rootDir, outputPath)} (${viewport.width}x${viewport.height}).\n`
  );
} finally {
  await context.close();
}

function assertPngDimensions(buffer, expectedWidth, expectedHeight) {
  const pngSignature = "89504e470d0a1a0a";
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== pngSignature) {
    fail("Playwright did not produce a valid PNG screenshot");
  }

  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);

  if (width !== expectedWidth || height !== expectedHeight) {
    fail(
      `screenshot dimensions must be ${expectedWidth}x${expectedHeight}, received ${width}x${height}`
    );
  }
}

function fail(message) {
  throw new Error(`Store screenshot capture failed: ${message}`);
}
