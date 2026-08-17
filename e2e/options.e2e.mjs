import { expect, test } from "./fixtures.mjs";

const SETTINGS_SCHEMA_VERSION_KEY = "settings.v1.schemaVersion";
const SEEK_BACKWARD_KEY = "settings.v1.seekBackwardSeconds";
const TIME_DISPLAY_MODE_KEY = "settings.v1.timeDisplayMode";

async function openOptionsPage(context, extensionId) {
  const page = await context.newPage();
  const errors = [];

  page.on("pageerror", (error) => {
    errors.push(`pageerror: ${error.message}`);
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(`console: ${message.text()}`);
    }
  });

  await page.goto(`chrome-extension://${extensionId}/options.html`, {
    waitUntil: "domcontentloaded"
  });
  await expect(page.locator("#settings-form")).toBeVisible();

  return { page, errors };
}

async function setTimeDisplayMode(extensionWorker, mode) {
  await extensionWorker.evaluate(async ({ schemaKey, timeKey, value }) => {
    await chrome.storage.sync.set({
      [schemaKey]: 1,
      [timeKey]: value
    });
  }, {
    schemaKey: SETTINGS_SCHEMA_VERSION_KEY,
    timeKey: TIME_DISPLAY_MODE_KEY,
    value: mode
  });
}

async function getTimeDisplayMode(extensionWorker) {
  return extensionWorker.evaluate(async (timeKey) => {
    const stored = await chrome.storage.sync.get(timeKey);
    return stored[timeKey];
  }, TIME_DISPLAY_MODE_KEY);
}

test("loads the real branded Options Page with trusted project links", async ({ context, extensionId }) => {
  const { page, errors } = await openOptionsPage(context, extensionId);

  await expect(page).toHaveTitle(/FloatPlay/);
  await expect(page.locator("#seek-backward")).toHaveValue("5");
  await expect(page.locator("#seek-backward")).toHaveAttribute("min", "1");
  await expect(page.locator("#seek-backward")).toHaveAttribute("max", "600");
  await expect(page.locator("#seek-backward")).toHaveAttribute("step", "1");
  await expect(page.locator("#seek-backward")).toHaveAttribute("inputmode", "numeric");
  await expect(page.locator("#seek-backward")).toHaveAttribute(
    "aria-describedby",
    "seek-backward-help seek-backward-error"
  );
  await expect(page.locator("#seek-backward-error")).toBeHidden();
  await expect(page.locator("#seek-forward")).toHaveValue("5");
  await expect(page.locator("#seek-forward")).toHaveAttribute("step", "1");
  await expect(page.locator("#volume-step")).toHaveValue("5");
  await expect(page.locator("#volume-step")).toHaveAttribute("step", "1");
  await expect(page.locator("#auto-hide-enabled")).toBeChecked();
  await expect(page.locator("#auto-hide-delay")).toHaveValue("1");
  await expect(page.locator("#auto-hide-delay")).toHaveAttribute("min", "0");
  await expect(page.locator("#auto-hide-delay")).toHaveAttribute("max", "60");
  await expect(page.locator("#auto-hide-delay")).toHaveAttribute("step", "1");
  await expect(page.locator('[data-i18n="optionsHowToOpen"]')).toContainText("FloatPlay");

  const portfolioLink = page.locator("#developer-portfolio-link");
  await expect(portfolioLink).toHaveAttribute("href", "https://renan-rcp.vercel.app");
  await expect(portfolioLink).toHaveAttribute("target", "_blank");
  await expect(portfolioLink).toHaveAttribute("rel", "noopener noreferrer");

  const sourceLink = page.locator("#source-code-link");
  await expect(sourceLink).toHaveText("Source code");
  await expect(sourceLink).toHaveAttribute("href", "https://github.com/renanrcp16/float-play");
  await expect(sourceLink).toHaveAttribute("target", "_blank");
  await expect(sourceLink).toHaveAttribute("rel", "noopener noreferrer");

  const brandStyles = await page.evaluate(() => {
    const styles = globalThis.getComputedStyle(globalThis.document.documentElement);
    return {
      main: styles.getPropertyValue("--brand-main").trim().toLowerCase(),
      auxiliary: styles.getPropertyValue("--brand-aux").trim().toLowerCase(),
      dark: styles.getPropertyValue("--brand-dark").trim().toLowerCase(),
      light: styles.getPropertyValue("--brand-light").trim().toLowerCase(),
      fontFamily: styles.fontFamily
    };
  });

  expect(brandStyles).toMatchObject({
    main: "#7c8cff",
    auxiliary: "#b4beff",
    dark: "#1b2230",
    light: "#f5f7fa"
  });
  expect(brandStyles.fontFamily).not.toContain("Inter");
  expect(errors).toEqual([]);

  await page.close();
});

test("persists supported settings and restores defaults", async ({ context, extensionId }) => {
  const firstOpen = await openOptionsPage(context, extensionId);
  const page = firstOpen.page;

  await page.locator("#seek-backward").fill("7");
  await page.locator("#seek-forward").fill("8");
  await page.locator("#volume-step").fill("12");
  await page.locator("#auto-hide-delay").fill("3");
  await page.locator("#auto-hide-enabled").uncheck();
  await page.locator("#save-button").click();
  await expect(page.locator("#form-status")).toHaveAttribute("data-tone", "success");
  expect(firstOpen.errors).toEqual([]);
  await page.close();

  const secondOpen = await openOptionsPage(context, extensionId);
  const reopenedPage = secondOpen.page;

  await expect(reopenedPage.locator("#seek-backward")).toHaveValue("7");
  await expect(reopenedPage.locator("#seek-forward")).toHaveValue("8");
  await expect(reopenedPage.locator("#volume-step")).toHaveValue("12");
  await expect(reopenedPage.locator("#auto-hide-enabled")).not.toBeChecked();
  await expect(reopenedPage.locator("#auto-hide-delay")).toHaveValue("3");
  await expect(reopenedPage.locator("#auto-hide-delay")).toBeDisabled();

  await reopenedPage.locator("#reset-button").click();
  await expect(reopenedPage.locator("#form-status")).toHaveAttribute("data-tone", "success");
  await expect(reopenedPage.locator("#seek-backward")).toHaveValue("5");
  await expect(reopenedPage.locator("#seek-forward")).toHaveValue("5");
  await expect(reopenedPage.locator("#volume-step")).toHaveValue("5");
  await expect(reopenedPage.locator("#auto-hide-enabled")).toBeChecked();
  await expect(reopenedPage.locator("#auto-hide-delay")).toHaveValue("1");
  await expect(reopenedPage.locator("#auto-hide-delay")).toBeEnabled();
  expect(secondOpen.errors).toEqual([]);
  await reopenedPage.close();

  const thirdOpen = await openOptionsPage(context, extensionId);

  await expect(thirdOpen.page.locator("#seek-backward")).toHaveValue("5");
  await expect(thirdOpen.page.locator("#seek-forward")).toHaveValue("5");
  await expect(thirdOpen.page.locator("#auto-hide-delay")).toHaveValue("1");
  expect(thirdOpen.errors).toEqual([]);
  await thirdOpen.page.close();
});

test("shows actionable inline feedback for invalid numeric settings", async ({
  context,
  extensionId,
  extensionWorker
}) => {
  const { page, errors } = await openOptionsPage(context, extensionId);
  const seekBackward = page.locator("#seek-backward");
  const seekBackwardError = page.locator("#seek-backward-error");

  await seekBackward.evaluate((input) => {
    input.removeAttribute("max");
    input.removeAttribute("step");
  });
  await expect(seekBackward).not.toHaveAttribute("max");
  await expect(seekBackward).not.toHaveAttribute("step");

  await seekBackward.fill("1000");
  await page.locator("#save-button").click();

  await expect(seekBackward).toHaveAttribute("min", "1");
  await expect(seekBackward).toHaveAttribute("max", "600");
  await expect(seekBackward).toHaveAttribute("step", "1");
  await expect(page.locator("#form-status")).toHaveAttribute("data-tone", "error");
  await expect(seekBackward).toHaveAttribute("aria-invalid", "true");
  await expect(seekBackward).toBeFocused();
  await expect(seekBackwardError).toBeVisible();
  await expect(seekBackwardError).toHaveText("Use a whole number from 1 to 600 seconds.");

  const storedSeek = await extensionWorker.evaluate(async (key) => {
    const stored = await chrome.storage.sync.get(key);
    return stored[key];
  }, SEEK_BACKWARD_KEY);

  expect(storedSeek).not.toBe(1000);

  await seekBackward.fill("100");
  await expect(seekBackward).not.toHaveAttribute("aria-invalid");
  await expect(seekBackwardError).toBeHidden();
  expect(errors).toEqual([]);
  await page.close();
});

test("rejects decimal values even when input guards and DOM step are bypassed", async ({
  context,
  extensionId,
  extensionWorker
}) => {
  const { page, errors } = await openOptionsPage(context, extensionId);
  const seekBackward = page.locator("#seek-backward");
  const seekBackwardError = page.locator("#seek-backward-error");

  await seekBackward.evaluate((input) => {
    input.removeAttribute("step");
    input.value = "7.5";
    input.dispatchEvent(new globalThis.Event("input", { bubbles: true }));
  });
  await expect(seekBackward).not.toHaveAttribute("step");
  await expect(seekBackward).toHaveValue("7.5");

  await page.locator("#save-button").click();

  await expect(seekBackward).toHaveAttribute("step", "1");
  await expect(page.locator("#form-status")).toHaveAttribute("data-tone", "error");
  await expect(seekBackward).toHaveAttribute("aria-invalid", "true");
  await expect(seekBackward).toBeFocused();
  await expect(seekBackwardError).toHaveText("Use a whole number from 1 to 600 seconds.");

  const storedSeek = await extensionWorker.evaluate(async (key) => {
    const stored = await chrome.storage.sync.get(key);
    return stored[key];
  }, SEEK_BACKWARD_KEY);

  expect(storedSeek).not.toBe(7.5);
  expect(errors).toEqual([]);
  await page.close();
});

test("does not overwrite the player-owned time display preference", async ({
  context,
  extensionId,
  extensionWorker
}) => {
  await setTimeDisplayMode(extensionWorker, "remaining");
  const { page, errors } = await openOptionsPage(context, extensionId);

  await page.locator("#seek-backward").fill("9");
  await page.locator("#save-button").click();
  await expect(page.locator("#form-status")).toHaveAttribute("data-tone", "success");
  await expect.poll(() => getTimeDisplayMode(extensionWorker)).toBe("remaining");

  await page.locator("#reset-button").click();
  await expect(page.locator("#form-status")).toHaveAttribute("data-tone", "success");
  await expect.poll(() => getTimeDisplayMode(extensionWorker)).toBe("remaining");
  expect(errors).toEqual([]);

  await page.close();
});
