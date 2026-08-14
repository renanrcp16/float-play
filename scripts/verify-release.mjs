import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { stdout } from "node:process";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");

const packageJson = await readJson(path.join(rootDir, "package.json"));
const sourceManifest = await readJson(path.join(rootDir, "public", "manifest.json"));
const distManifest = await readJson(path.join(distDir, "manifest.json"));

assertEqual(
  packageJson.version,
  sourceManifest.version,
  "package.json and public/manifest.json versions must match"
);
assertEqual(
  sourceManifest.version,
  distManifest.version,
  "dist/manifest.json must match the source manifest version"
);

assertStringArrayEqual(
  distManifest.permissions,
  ["storage"],
  "release manifest permissions changed from the approved v1 set"
);

const expectedMatches = ["https://www.youtube.com/*", "https://youtube.com/*"];
const contentScripts = Array.isArray(distManifest.content_scripts) ? distManifest.content_scripts : [];

if (contentScripts.length === 0) {
  fail("release manifest must contain content scripts");
}

for (const contentScript of contentScripts) {
  assertStringArrayEqual(
    contentScript.matches,
    expectedMatches,
    "release manifest content-script scope changed from the approved YouTube origins"
  );
}

const requiredFiles = new Set([
  "manifest.json",
  "_locales/en/messages.json",
  "_locales/pt_BR/messages.json"
]);

addRequiredFile(requiredFiles, distManifest.options_page, "options_page");
addRequiredFile(requiredFiles, distManifest.background?.service_worker, "background.service_worker");

for (const iconPath of Object.values(distManifest.icons ?? {})) {
  addRequiredFile(requiredFiles, iconPath, "icons");
}

for (const contentScript of contentScripts) {
  for (const scriptPath of contentScript.js ?? []) {
    addRequiredFile(requiredFiles, scriptPath, "content_scripts.js");
  }
}

const optionsPage = distManifest.options_page;
if (typeof optionsPage === "string") {
  const optionsHtml = await readFile(path.join(distDir, optionsPage), "utf8");
  for (const assetPath of collectLocalHtmlAssets(optionsHtml)) {
    requiredFiles.add(assetPath);
  }
}

for (const relativePath of requiredFiles) {
  const normalizedPath = path.normalize(relativePath);
  if (normalizedPath.startsWith("..") || path.isAbsolute(normalizedPath)) {
    fail(`invalid release asset path: ${relativePath}`);
  }

  try {
    await access(path.join(distDir, normalizedPath));
  } catch {
    fail(`missing required release file: dist/${relativePath}`);
  }
}

stdout.write(
  `Release verification passed for FloatPlay ${sourceManifest.version} (${requiredFiles.size} required files checked).\n`
);

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(`unable to read ${path.relative(rootDir, filePath)}: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(`${message}: expected ${String(expected)}, received ${String(actual)}`);
  }
}

function assertStringArrayEqual(actual, expected, message) {
  if (!Array.isArray(actual) || actual.some((value) => typeof value !== "string")) {
    fail(`${message}: expected a string array`);
  }

  const actualSorted = [...actual].sort();
  const expectedSorted = [...expected].sort();

  if (
    actualSorted.length !== expectedSorted.length ||
    actualSorted.some((value, index) => value !== expectedSorted[index])
  ) {
    fail(`${message}: expected ${expectedSorted.join(", ")}, received ${actualSorted.join(", ")}`);
  }
}

function addRequiredFile(target, value, fieldName) {
  if (typeof value !== "string" || value.length === 0) {
    fail(`release manifest field ${fieldName} must reference a file`);
  }

  target.add(value);
}

function collectLocalHtmlAssets(html) {
  const assets = new Set();
  const attributePattern = /(?:src|href)=["']([^"']+)["']/g;

  for (const match of html.matchAll(attributePattern)) {
    const value = match[1];
    if (
      value === undefined ||
      value.startsWith("#") ||
      value.startsWith("data:") ||
      value.startsWith("http://") ||
      value.startsWith("https://")
    ) {
      continue;
    }

    assets.add(value.replace(/^\.\//, ""));
  }

  return assets;
}

function fail(message) {
  throw new Error(`Release verification failed: ${message}`);
}
