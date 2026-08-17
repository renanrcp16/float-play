import { expect, test } from "./fixtures.mjs";

const WATCH_URL = "https://www.youtube.com/watch?v=floatplay-e2e";
const TRIGGER_SELECTOR = '[data-floatplay="trigger"]';
const COACHMARK_SEEN_KEY = "triggerCoachmarkSeen";

function createWatchFixtureHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>FloatPlay deterministic watch fixture</title>
    <style>
      html, body { margin: 0; min-height: 100%; }
      body { font-family: system-ui, sans-serif; padding: 24px; }
      ytd-watch-metadata { display: block; margin-top: 16px; }
      #owner { display: flex; align-items: center; min-height: 48px; }
      #subscribe-button { width: 120px; height: 36px; }
      video { display: block; width: 640px; height: 360px; background: #111; }
    </style>
  </head>
  <body>
    <video id="watch-video"></video>
    <ytd-watch-metadata>
      <div id="owner">
        <div id="subscribe-button" aria-hidden="true"></div>
      </div>
    </ytd-watch-metadata>
  </body>
</html>`;
}

async function openWatchFixture(context) {
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

  await page.route("https://www.youtube.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: createWatchFixtureHtml()
    });
  });

  await page.goto(WATCH_URL, { waitUntil: "domcontentloaded" });
  const trigger = page.locator(TRIGGER_SELECTOR);
  await expect(trigger).toHaveCount(1);
  await expect(trigger).toBeVisible();

  return { page, errors, trigger };
}

async function clearCoachmarkState(extensionWorker) {
  await extensionWorker.evaluate(async (key) => {
    await chrome.storage.local.remove(key);
  }, COACHMARK_SEEN_KEY);
}

async function hasSeenCoachmark(extensionWorker) {
  return extensionWorker.evaluate(async (key) => {
    const stored = await chrome.storage.local.get(key);
    return stored[key] === true;
  }, COACHMARK_SEEN_KEY);
}

function attributesOf(node) {
  const attributes = node.attributes ?? [];
  const result = new Map();

  for (let index = 0; index < attributes.length; index += 2) {
    const name = attributes[index];
    const value = attributes[index + 1];

    if (name !== undefined && value !== undefined) {
      result.set(name, value);
    }
  }

  return result;
}

function flattenPiercedTree(root) {
  const nodes = [];
  const visit = (node) => {
    nodes.push(node);

    for (const shadowRoot of node.shadowRoots ?? []) {
      visit(shadowRoot);
    }

    for (const child of node.children ?? []) {
      visit(child);
    }
  };

  visit(root);
  return nodes;
}

function findNodeByClass(nodes, className) {
  return nodes.find((node) => {
    const classes = attributesOf(node).get("class")?.split(/\s+/) ?? [];
    return classes.includes(className);
  });
}

async function readTriggerShadowState(page) {
  const client = await page.context().newCDPSession(page);

  try {
    await client.send("DOM.enable");
    const { root } = await client.send("DOM.getDocument", {
      depth: -1,
      pierce: true
    });
    const nodes = flattenPiercedTree(root);
    const button = findNodeByClass(nodes, "trigger-button");
    const icon = findNodeByClass(nodes, "trigger-icon");
    const coachmark = findNodeByClass(nodes, "coachmark");
    const coachmarkClose = findNodeByClass(nodes, "coachmark-close");

    if (button === undefined || icon === undefined || coachmark === undefined || coachmarkClose === undefined) {
      throw new Error("Unable to inspect the FloatPlay trigger shadow tree.");
    }

    const buttonChildren = button.children ?? [];
    const visibleButtonText = buttonChildren
      .filter((node) => node.nodeName === "#text")
      .map((node) => node.nodeValue ?? "")
      .join("")
      .trim();

    return {
      buttonAriaLabel: attributesOf(button).get("aria-label"),
      iconSrc: attributesOf(icon).get("src"),
      coachmarkHidden: attributesOf(coachmark).has("hidden"),
      coachmarkCloseAriaLabel: attributesOf(coachmarkClose).get("aria-label"),
      visibleButtonText
    };
  } finally {
    await client.detach();
  }
}

async function clickShadowElementByClass(page, className) {
  const client = await page.context().newCDPSession(page);

  try {
    await client.send("DOM.enable");
    const { root } = await client.send("DOM.getDocument", {
      depth: -1,
      pierce: true
    });
    const node = findNodeByClass(flattenPiercedTree(root), className);

    if (node?.backendNodeId === undefined) {
      throw new Error(`Unable to find shadow element .${className}.`);
    }

    const { object } = await client.send("DOM.resolveNode", {
      backendNodeId: node.backendNodeId
    });

    if (object.objectId === undefined) {
      throw new Error(`Unable to resolve shadow element .${className}.`);
    }

    await client.send("Runtime.callFunctionOn", {
      objectId: object.objectId,
      functionDeclaration: "function () { this.click(); }"
    });
  } finally {
    await client.detach();
  }
}

async function replacePreferredAnchor(page) {
  await page.evaluate(() => {
    const current = document.querySelector("ytd-watch-metadata");
    const replacement = document.createElement("ytd-watch-metadata");
    const owner = document.createElement("div");
    const subscription = document.createElement("div");

    owner.id = "owner";
    subscription.id = "subscribe-button";
    subscription.setAttribute("aria-hidden", "true");
    owner.append(subscription);
    replacement.append(owner);
    current?.replaceWith(replacement);
  });
}

async function removePreferredAnchor(page) {
  await page.evaluate(() => {
    document.querySelector("ytd-watch-metadata")?.remove();
  });
}

async function addPreferredAnchor(page) {
  await page.evaluate(() => {
    const metadata = document.createElement("ytd-watch-metadata");
    const owner = document.createElement("div");
    const subscription = document.createElement("div");

    owner.id = "owner";
    subscription.id = "subscribe-button";
    subscription.setAttribute("aria-hidden", "true");
    owner.append(subscription);
    metadata.append(owner);
    document.body.append(metadata);
  });
}

test("shows the real icon-only trigger and persists explicit coachmark dismissal", async ({
  context,
  extensionId,
  extensionWorker
}) => {
  await clearCoachmarkState(extensionWorker);
  const { page, errors, trigger } = await openWatchFixture(context);

  await expect(trigger).toHaveAttribute("data-placement", "inline");

  const initialState = await readTriggerShadowState(page);
  expect(initialState.buttonAriaLabel).toBe("Open FloatPlay");
  expect(initialState.visibleButtonText).toBe("");
  expect(initialState.iconSrc).toBe(`chrome-extension://${extensionId}/brand/icon.svg`);
  expect(initialState.coachmarkHidden).toBe(false);
  expect(initialState.coachmarkCloseAriaLabel).toBe("Dismiss FloatPlay tip");

  await clickShadowElementByClass(page, "coachmark-close");
  await expect.poll(() => hasSeenCoachmark(extensionWorker)).toBe(true);
  await expect.poll(async () => (await readTriggerShadowState(page)).coachmarkHidden).toBe(true);

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(TRIGGER_SELECTOR)).toHaveCount(1);
  await expect(page.locator(TRIGGER_SELECTOR)).toBeVisible();
  await expect.poll(async () => (await readTriggerShadowState(page)).coachmarkHidden).toBe(true);
  expect(errors).toEqual([]);

  await page.close();
});

test("reconciles one trigger across navigation-like anchor changes and fallback placement", async ({
  context,
  extensionWorker
}) => {
  await clearCoachmarkState(extensionWorker);
  const { page, errors, trigger } = await openWatchFixture(context);

  await expect(trigger).toHaveAttribute("data-placement", "inline");

  await replacePreferredAnchor(page);
  await expect(page.locator(TRIGGER_SELECTOR)).toHaveCount(1);
  await expect(page.locator(TRIGGER_SELECTOR)).toHaveAttribute("data-placement", "inline");

  await removePreferredAnchor(page);
  await expect(page.locator(TRIGGER_SELECTOR)).toHaveCount(1);
  await expect(page.locator(TRIGGER_SELECTOR)).toHaveAttribute("data-placement", "fallback");
  await expect(page.locator(TRIGGER_SELECTOR)).toBeVisible();

  await addPreferredAnchor(page);
  await expect(page.locator(TRIGGER_SELECTOR)).toHaveCount(1);
  await expect(page.locator(TRIGGER_SELECTOR)).toHaveAttribute("data-placement", "inline");
  expect(errors).toEqual([]);

  await page.close();
});
