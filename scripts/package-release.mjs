import { Buffer } from "node:buffer";
import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { stdout } from "node:process";
import { fileURLToPath } from "node:url";

const CRC32_TABLE = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = (crc & 1) === 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");
const packageJson = await readJson(path.join(rootDir, "package.json"));
const sourceManifest = await readJson(path.join(rootDir, "public", "manifest.json"));

if (packageJson.version !== sourceManifest.version) {
  fail(
    `package.json and public/manifest.json versions must match: ${String(packageJson.version)} !== ${String(sourceManifest.version)}`
  );
}

const version = sourceManifest.version;
if (typeof version !== "string" || version.length === 0) {
  fail("public/manifest.json must contain a non-empty version");
}

const files = await collectFiles(distDir);
if (files.length === 0) {
  fail("dist/ is empty; run the release verifier before packaging");
}

const expectedPaths = files.map((file) => file.relativePath);
if (!expectedPaths.includes("manifest.json")) {
  fail("dist/manifest.json is required at the archive root");
}

const archive = createZip(files);
const archivePaths = inspectZip(archive);
assertStringArraysEqual(archivePaths, expectedPaths, "archive entries must match dist/ exactly");

if (archivePaths.some((entry) => entry === "dist" || entry.startsWith("dist/"))) {
  fail("archive must contain dist/ contents at the ZIP root, not a nested dist directory");
}

const outputName = `floatplay-${version}.zip`;
const outputPath = path.join(rootDir, outputName);
await rm(outputPath, { force: true });
await writeFile(outputPath, archive);

stdout.write(
  `Release package created: ${outputName} (${files.length} files, ${archive.length} bytes).\n`
);

async function collectFiles(directory, prefix = "") {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(`unable to read ${path.relative(rootDir, directory)}: ${message}`);
  }

  entries.sort((left, right) => left.name.localeCompare(right.name, "en"));
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

    files.push({
      relativePath,
      data: await readFile(absolutePath)
    });
  }

  return files;
}

function createZip(files) {
  const localParts = [];
  const centralParts = [];
  let localOffset = 0;
  let centralSize = 0;

  for (const file of files) {
    const fileName = Buffer.from(file.relativePath, "utf8");
    const data = file.data;

    if (data.length > 0xffffffff) {
      fail(`file is too large for the release ZIP format: ${file.relativePath}`);
    }

    const checksum = crc32(data);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0x0021, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(fileName.length, 26);
    localHeader.writeUInt16LE(0, 28);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0x0021, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(fileName.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(localOffset, 42);

    localParts.push(localHeader, fileName, data);
    centralParts.push(centralHeader, fileName);

    localOffset += localHeader.length + fileName.length + data.length;
    centralSize += centralHeader.length + fileName.length;

    if (localOffset > 0xffffffff || centralSize > 0xffffffff) {
      fail("release ZIP exceeds classic ZIP size limits");
    }
  }

  if (files.length > 0xffff) {
    fail("release ZIP contains too many files for classic ZIP format");
  }

  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(localOffset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, end]);
}

function inspectZip(archive) {
  const endSignature = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
  const endOffset = archive.lastIndexOf(endSignature);

  if (endOffset < 0 || endOffset + 22 !== archive.length) {
    fail("generated ZIP is missing a valid end-of-central-directory record");
  }

  const entryCount = archive.readUInt16LE(endOffset + 10);
  const centralSize = archive.readUInt32LE(endOffset + 12);
  const centralOffset = archive.readUInt32LE(endOffset + 16);

  if (centralOffset + centralSize !== endOffset) {
    fail("generated ZIP central-directory size or offset is invalid");
  }

  const entries = [];
  let offset = centralOffset;

  for (let index = 0; index < entryCount; index += 1) {
    if (archive.readUInt32LE(offset) !== 0x02014b50) {
      fail(`generated ZIP has an invalid central-directory entry at index ${index}`);
    }

    const fileNameLength = archive.readUInt16LE(offset + 28);
    const extraLength = archive.readUInt16LE(offset + 30);
    const commentLength = archive.readUInt16LE(offset + 32);
    const localHeaderOffset = archive.readUInt32LE(offset + 42);
    const fileNameStart = offset + 46;
    const fileNameEnd = fileNameStart + fileNameLength;
    const fileName = archive.subarray(fileNameStart, fileNameEnd).toString("utf8");

    if (archive.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
      fail(`generated ZIP has an invalid local header for ${fileName}`);
    }

    const localNameLength = archive.readUInt16LE(localHeaderOffset + 26);
    const localNameStart = localHeaderOffset + 30;
    const localNameEnd = localNameStart + localNameLength;
    const localName = archive.subarray(localNameStart, localNameEnd).toString("utf8");

    if (localName !== fileName) {
      fail(`generated ZIP local and central names disagree for ${fileName}`);
    }

    if (
      fileName.length === 0 ||
      fileName.startsWith("/") ||
      fileName.split("/").includes("..")
    ) {
      fail(`generated ZIP contains an unsafe entry path: ${fileName}`);
    }

    entries.push(fileName);
    offset = fileNameEnd + extraLength + commentLength;
  }

  if (offset !== endOffset) {
    fail("generated ZIP central directory does not end at the expected offset");
  }

  return entries;
}

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(`unable to read ${path.relative(rootDir, filePath)}: ${message}`);
  }
}

function assertStringArraysEqual(actual, expected, message) {
  if (
    actual.length !== expected.length ||
    actual.some((value, index) => value !== expected[index])
  ) {
    fail(`${message}: expected ${expected.join(", ")}, received ${actual.join(", ")}`);
  }
}

function fail(message) {
  throw new Error(`Release packaging failed: ${message}`);
}
