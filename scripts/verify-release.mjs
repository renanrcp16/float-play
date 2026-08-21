import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { stdout } from "node:process";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");

const expectedMatches = [
  "https://www.youtube.com/*",
  "https://youtube.com/*",
  "https://music.youtube.com/*"
];
const expectedManifestKeys = [
  "background",
  "content_scripts",
  "content_security_policy",
  "default_locale",
  "description",
  "externally_connectable",
  "icons",
  "manifest_version",
  "minimum_chrome_version",
  "name",
  "options_page",
  "permissions",
  "version",
  "web_accessible_resources"
];
const expectedIcons = {
  "16": "icons/icon-16.png",
  "32": "icons/icon-32.png",
  "48": "icons/icon-48.png",
  "128": "icons/icon-128.png"
};
const expectedContentScripts = [
  {
    matches: expectedMatches,
    js: ["youtube-player-main.js"],
    run_at: "document_start",
    world: "MAIN"
  },
  {
    matches: expectedMatches,
    js: ["content.js"],
    run_at: "document_idle",
    world: "ISOLATED"
  }
];
const expectedWebAccessibleResources = [
  {
    resources: ["brand/icon.svg"],
    matches: expectedMatches
  }
];
const expectedExtensionCsp = {
  extension_pages: "default-src 'self'"
};
const expectedExternallyConnectable = {
  ids: []
};

const packageJson = await readJson(path.join(rootDir, "package.json"));
const sourceManifest = await readJson(path.join(rootDir, "public", "manifest.json"));
const distManifest = await readJson(path.join(distDir, "manifest.json"));

assertEqual(
  packageJson.version,
  sourceManifest.version,
  "package.json and public/manifest.json versions must match"
);
assertDeepEqual(
  distManifest,
  sourceManifest,
  "dist/manifest.json must match public/manifest.json exactly"
);

assertStringArrayEqual(
  Object.keys(distManifest),
  expectedManifestKeys,
  "release manifest top-level keys changed from the approved release allowlist"
);
assertEqual(distManifest.manifest_version, 3, "release manifest must remain Manifest V3");
assertEqual(distManifest.name, "__MSG_extensionName__", "release manifest name changed");
assertEqual(
  distManifest.description,
  "__MSG_extensionDescription__",
  "release manifest description changed"
);
assertEqual(distManifest.default_locale, "en", "release manifest default locale changed");
assertEqual(
  distManifest.minimum_chrome_version,
  "130",
  "release manifest minimum Chrome version changed"
);
assertStringArrayEqual(
  distManifest.permissions,
  ["storage"],
  "release manifest permissions changed from the approved release set"
);
assertDeepEqual(distManifest.icons, expectedIcons, "release manifest icon set changed");
assertEqual(distManifest.options_page, "options.html", "release manifest options page changed");
assertDeepEqual(
  distManifest.background,
  { service_worker: "service-worker.js" },
  "release manifest background worker changed"
);
assertDeepEqual(
  distManifest.content_security_policy,
  expectedExtensionCsp,
  "release manifest extension CSP changed from the approved local-only policy"
);
assertDeepEqual(
  distManifest.externally_connectable,
  expectedExternallyConnectable,
  "release manifest external messaging policy changed from the approved closed policy"
);
assertDeepEqual(
  distManifest.content_scripts,
  expectedContentScripts,
  "release manifest content scripts changed from the approved v1.1 allowlist"
);
assertDeepEqual(
  distManifest.web_accessible_resources,
  expectedWebAccessibleResources,
  "release manifest web-accessible resources changed from the approved v1.1 allowlist"
);

for (const forbiddenField of [
  "host_permissions",
  "optional_permissions",
  "optional_host_permissions",
  "sandbox"
]) {
  assertAbsentField(distManifest, forbiddenField);
}

const contentScripts = distManifest.content_scripts;
const webAccessibleResources = distManifest.web_accessible_resources;
const requiredFiles = new Set([
  "manifest.json",
  "_locales/en/messages.json",
  "_locales/pt_BR/messages.json"
]);

addRequiredFile(requiredFiles, distManifest.options_page, "options_page");
addRequiredFile(requiredFiles, distManifest.background.service_worker, "background.service_worker");

for (const iconPath of Object.values(distManifest.icons)) {
  addRequiredFile(requiredFiles, iconPath, "icons");
}

for (const contentScript of contentScripts) {
  for (const scriptPath of contentScript.js) {
    addRequiredFile(requiredFiles, scriptPath, "content_scripts.js");
  }
}

for (const resourceGroup of webAccessibleResources) {
  for (const resourcePath of resourceGroup.resources) {
    addRequiredFile(requiredFiles, resourcePath, "web_accessible_resources.resources");
  }
}

const optionsHtml = await readFile(path.join(distDir, distManifest.options_page), "utf8");
for (const assetPath of collectLocalHtmlAssets(optionsHtml)) {
  requiredFiles.add(assetPath);
}

const distFiles = await collectFiles(distDir);
const sourceMaps = distFiles.filter((relativePath) => relativePath.endsWith(".map"));
if (sourceMaps.length > 0) {
  fail(`release dist must not contain source maps: ${sourceMaps.join(", ")}`);
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
  `Release verification passed for FloatPlay ${sourceManifest.version} (${requiredFiles.size} required files, ${distFiles.length} packaged files checked).\n`
);

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(`unable to read ${path.relative(rootDir, filePath)}: ${message}`);
  }
}

async function collectFiles(directory, prefix = "") {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(`unable to read ${path.relative(rootDir, directory)}: ${message}`);
  }

  const files = [];
  for (const entry of entries) {
    const relativePath = prefix.length === 0 ? entry.name : `${prefix}/${entry.name}`;
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath, relativePath)));
      continue;
    }

    if (!entry.isFile()) {
      fail(`unsupported non-file entry in dist/: ${relativePath}`);
    }

    files.push(relativePath);
  }

  return files.sort((left, right) => left.localeCompare(right, "en"));
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

function assertDeepEqual(actual, expected, message) {
  const actualCanonical = JSON.stringify(canonicalize(actual));
  const expectedCanonical = JSON.stringify(canonicalize(expected));

  if (actualCanonical !== expectedCanonical) {
    fail(`${message}: expected ${expectedCanonical}, received ${actualCanonical}`);
  }
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right, "en"))
        .map(([key, child]) => [key, canonicalize(child)])
    );
  }

  return value;
}

function assertAbsentField(object, fieldName) {
  if (Object.hasOwn(object, fieldName)) {
    fail(`release manifest must not define ${fieldName}`);
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
