#!/usr/bin/env node
/**
 * Downloads official qpdf Windows x64 build for local Phase 2 development.
 * Source: https://github.com/qpdf/qpdf/releases
 * License: Apache-2.0
 *
 * Production bundling into the installer is deferred to a later phase.
 */
import { createHash } from 'node:crypto';
import { createWriteStream, existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';


const VERSION = '12.3.2';
const ASSET = `qpdf-${VERSION}-msvc64.zip`;
const BASE = `https://github.com/qpdf/qpdf/releases/download/v${VERSION}`;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../vendor/qpdf');
const DOWNLOAD_DIR = join(ROOT, 'download');
const BIN_DIR = join(ROOT, 'bin');

async function download(url, dest) {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Download failed: ${url} (${response.status})`);
  }
  await pipeline(response.body, createWriteStream(dest));
}

async function sha256File(filePath) {
  const hash = createHash('sha256');
  hash.update(await readFile(filePath));
  return hash.digest('hex');
}

async function main() {
  await mkdir(DOWNLOAD_DIR, { recursive: true });
  const zipPath = join(DOWNLOAD_DIR, ASSET);
  const shaPath = join(DOWNLOAD_DIR, `qpdf-${VERSION}.sha256`);

  if (!existsSync(shaPath)) {
    await download(`${BASE}/qpdf-${VERSION}.sha256`, shaPath);
  }
  if (!existsSync(zipPath)) {
    console.log(`Downloading ${ASSET}…`);
    await download(`${BASE}/${ASSET}`, zipPath);
  }

  const shaText = await readFile(shaPath, 'utf8');
  const expectedLine = shaText.split(/\r?\n/).find((line) => line.includes(ASSET));
  const expected = expectedLine?.trim().split(/\s+/)[0];
  const actual = await sha256File(zipPath);
  if (!expected || expected !== actual) {
    throw new Error(`Checksum mismatch for ${ASSET}\nexpected=${expected}\nactual=${actual}`);
  }
  console.log(`Checksum OK (${actual})`);

  const extractDir = join(ROOT, 'extracted');
  await rm(extractDir, { recursive: true, force: true });
  await mkdir(extractDir, { recursive: true });

  const ps = `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${extractDir.replace(/'/g, "''")}' -Force`;
  const { spawnSync } = await import('node:child_process');
  const result = spawnSync('powershell.exe', ['-NoProfile', '-Command', ps], { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(result.stderr || 'Expand-Archive failed');
  }

  // Copy bin next to vendor/qpdf/bin
  const { readdirSync, cpSync, statSync } = await import('node:fs');
  function findQpdf(dir) {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        const nested = findQpdf(full);
        if (nested) return nested;
      } else if (name.toLowerCase() === 'qpdf.exe') {
        return full;
      }
    }
    return null;
  }
  const qpdfExe = findQpdf(extractDir);
  if (!qpdfExe) {
    throw new Error('qpdf.exe not found after extract');
  }
  await rm(BIN_DIR, { recursive: true, force: true });
  await mkdir(BIN_DIR, { recursive: true });
  cpSync(dirname(qpdfExe), BIN_DIR, { recursive: true });

  const versionProbe = spawnSync(join(BIN_DIR, 'qpdf.exe'), ['--version'], { encoding: 'utf8' });
  console.log(versionProbe.stdout.trim());
  await writeFile(
    join(ROOT, 'VERSION.txt'),
    `${VERSION}\nsource=${BASE}/${ASSET}\nsha256=${actual}\n`,
    'utf8',
  );
  console.log(`Installed development qpdf to ${BIN_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
