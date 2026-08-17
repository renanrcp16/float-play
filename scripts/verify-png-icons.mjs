import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const expectedIcons = new Map([
  ["icons/icon-16.png", 16],
  ["icons/icon-32.png", 32],
  ["icons/icon-48.png", 48],
  ["icons/icon-128.png", 128]
]);

for (const [relativePath, expectedSize] of expectedIcons) {
  const buffer = await readFile(path.join(distDir, relativePath));
  verifyPng(buffer, relativePath, expectedSize);
}

console.log(`PNG icon verification passed (${expectedIcons.size} icons).`);

function verifyPng(buffer, relativePath, expectedSize) {
  if (buffer.length < pngSignature.length || !buffer.subarray(0, 8).equals(pngSignature)) {
    fail(relativePath, "invalid PNG signature");
  }

  let offset = 8;
  let width = null;
  let height = null;
  let sawIhdr = false;
  let sawIend = false;
  const idatChunks = [];

  while (offset < buffer.length) {
    if (offset + 8 > buffer.length) {
      fail(relativePath, "truncated PNG chunk header");
    }

    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    if (!/^[A-Za-z]{4}$/.test(type)) {
      fail(relativePath, `invalid PNG chunk type at byte ${offset + 4}`);
    }

    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const chunkEnd = dataEnd + 4;
    if (chunkEnd > buffer.length) {
      fail(relativePath, `truncated ${type} chunk`);
    }

    if (!sawIhdr && type !== "IHDR") {
      fail(relativePath, "IHDR must be the first PNG chunk");
    }

    if (type === "IHDR") {
      if (sawIhdr || length !== 13) {
        fail(relativePath, "invalid IHDR chunk");
      }
      sawIhdr = true;
      width = buffer.readUInt32BE(dataStart);
      height = buffer.readUInt32BE(dataStart + 4);
    } else if (type === "IDAT") {
      idatChunks.push(buffer.subarray(dataStart, dataEnd));
    } else if (type === "IEND") {
      if (length !== 0) {
        fail(relativePath, "invalid IEND chunk");
      }
      sawIend = true;
      offset = chunkEnd;
      break;
    }

    offset = chunkEnd;
  }

  if (!sawIhdr || !sawIend || offset !== buffer.length) {
    fail(relativePath, "PNG stream does not terminate cleanly at IEND");
  }

  if (width !== expectedSize || height !== expectedSize) {
    fail(relativePath, `expected ${expectedSize}x${expectedSize}, received ${width}x${height}`);
  }

  if (idatChunks.length === 0) {
    fail(relativePath, "PNG contains no IDAT image data");
  }

  try {
    inflateSync(Buffer.concat(idatChunks));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(relativePath, `invalid compressed image data: ${message}`);
  }
}

function fail(relativePath, message) {
  throw new Error(`PNG icon verification failed for dist/${relativePath}: ${message}`);
}
