import { expect, test } from "./fixtures.mjs";

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

test("loads the real Options Page with the current defaults", async ({ context, extensionId }) => {
  const { page, errors } = await openOptionsPage(context, extensionId);

  await expect(page).toHaveTitle(/FloatPlay/);
  await expect(page.locator("#seek-backward")).toHaveValue("5");
  await expect(page.locator("#seek-forward")).toHaveValue("5");
  await expect(page.locator("#volume-step")).toHaveValue("5");
  await expect(page.locator("#auto-hide-enabled")).toBeChecked();
  await expect(page.locator("#auto-hide-delay")).toHaveValue("1");

  const portfolioLink = page.locator("#developer-portfolio-link");
  await expect(portfolioLink).toHaveAttribute("href", "https://renan-rcp.vercel.app");
  await expect(portfolioLink).toHaveAttribute("target", "_blank");
  await expect(portfolioLink).toHaveAttribute("rel", "noopener noreferrer");
  expect(errors).toEqual([]);

  await page.close();
});

test("persists supported settings and restores defaults", async ({ context, extensionId }) => {
  const firstOpen = await openOptionsPage(context, extensionId);
  const page = firstOpen.page;

  await page.locator("#seek-backward").fill("7.5");
  await page.locator("#seek-forward").fill("8.5");
  await page.locator("#volume-step").fill("12");
  await page.locator("#auto-hide-delay").fill("3.5");
  await page.locator("#auto-hide-enabled").uncheck();
  await page.locator("#save-button").click();
  await expect(page.locator("#form-status")).toHaveAttribute("data-tone", "success");
  expect(firstOpen.errors).toEqual([]);
  await page.close();

  const secondOpen = await openOptionsPage(context, extensionId);
  const reopenedPage = secondOpen.page;

  await expect(reopenedPage.locator("#seek-backward")).toHaveValue("7.5");
  await expect(reopenedPage.locator("#seek-forward")).toHaveValue("8.5");
  await expect(reopenedPage.locator("#volume-step")).toHaveValue("12");
  await expect(reopenedPage.locator("#auto-hide-enabled")).not.toBeChecked();
  await expect(reopenedPage.locator("#auto-hide-delay")).toHaveValue("3.5");
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
