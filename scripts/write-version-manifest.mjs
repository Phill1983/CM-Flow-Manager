#!/usr/bin/env node
/**
 * Writes version-manifest.json for GitHub Releases update checks.
 * Reads SHA256SUMS.txt and package version.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RELEASE_DIR = process.env.RELEASE_DIR
  ? resolve(process.env.RELEASE_DIR)
  : join(ROOT, 'release');
const PKG = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const VERSION = PKG.version;
const CHANNEL = 'alpha';
const OWNER = 'Phill1983';
const REPO = 'CM-Flow-Manager';

function parseSums(text) {
  /** @type {Map<string, string>} */
  const map = new Map();
  for (const line of text.split(/\r?\n/)) {
    const match = /^([a-f0-9]{64})\s{2}(.+)$/i.exec(line.trim());
    if (match) {
      map.set(match[2], match[1].toLowerCase());
    }
  }
  return map;
}

function main() {
  const sumsPath = join(RELEASE_DIR, 'SHA256SUMS.txt');
  if (!existsSync(sumsPath)) {
    throw new Error('Missing SHA256SUMS.txt — run release:checksums first.');
  }
  const sums = parseSums(readFileSync(sumsPath, 'utf8'));
  const setupName = `CM Flow Manager Setup ${VERSION}.exe`;
  const portableName = `CM Flow Manager ${VERSION}.exe`;
  const setupHash = sums.get(setupName);
  const portableHash = sums.get(portableName);
  if (!setupHash && !portableHash) {
    throw new Error('No matching installer/portable hashes in SHA256SUMS.txt');
  }

  const manifest = {
    schemaVersion: 1,
    channel: CHANNEL,
    latestVersion: VERSION,
    minimumSupportedVersion: '0.1.0-alpha',
    policy: 'optional',
    updateRequired: false,
    message: '',
    releaseNotesUrl: `https://github.com/${OWNER}/${REPO}/releases/tag/v${VERSION}`,
    publishedAt: new Date().toISOString(),
    artifacts: {
      ...(setupHash ? { nsis: { fileName: setupName, sha256: setupHash } } : {}),
      ...(portableHash ? { portable: { fileName: portableName, sha256: portableHash } } : {}),
    },
    signing: {
      authenticodeRequired: false,
      status: 'unsigned',
    },
  };

  const outPath = join(RELEASE_DIR, 'version-manifest.json');
  writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${outPath}`);

  // electron-updater alpha channel expects alpha.yml; builder often emits latest.yml only.
  const latestYml = join(RELEASE_DIR, 'latest.yml');
  const alphaYml = join(RELEASE_DIR, 'alpha.yml');
  if (existsSync(latestYml) && !existsSync(alphaYml)) {
    writeFileSync(alphaYml, readFileSync(latestYml));
    console.log(`Wrote ${alphaYml} (copy of latest.yml)`);
  }
}

main();
