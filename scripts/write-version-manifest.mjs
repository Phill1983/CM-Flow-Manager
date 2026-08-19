#!/usr/bin/env node
/**
 * Writes version-manifest.json for GitHub Releases update checks.
 * Reads SHA256SUMS.txt and package version.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RELEASE_DIR = join(ROOT, 'release');
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
      ...(setupHash
        ? { nsis: { fileName: githubAssetName(setupName), sha256: setupHash } }
        : {}),
      ...(portableHash
        ? { portable: { fileName: githubAssetName(portableName), sha256: portableHash } }
        : {}),
    },
    signing: {
      authenticodeRequired: false,
      status: 'unsigned',
    },
  };

  const outPath = join(RELEASE_DIR, 'version-manifest.json');
  writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${outPath}`);

  syncUpdaterYml(RELEASE_DIR, VERSION, setupName, githubAssetName(setupName));
}

/** GitHub Release uploads via gh CLI store assets with spaces replaced by dots. */
function githubAssetName(localFileName) {
  return localFileName.replace(/ /g, '.');
}

/**
 * electron-builder emits latest.yml with slugified path/url (hyphens) while
 * artifactName keeps spaces. GitHub stores uploads with dots instead of spaces.
 * Updater yml must reference the GitHub-downloadable asset name exactly.
 */
function syncUpdaterYml(releaseDir, version, setupFileName, githubSetupName) {
  const latestYml = join(releaseDir, 'latest.yml');
  const alphaYml = join(releaseDir, 'alpha.yml');
  if (!existsSync(latestYml)) {
    console.warn(`Skipping updater yml sync — missing ${latestYml}`);
    return;
  }

  const setupPath = join(releaseDir, setupFileName);
  if (!existsSync(setupPath)) {
    throw new Error(
      `Updater yml references ${setupFileName} but file is missing in ${releaseDir}`,
    );
  }

  const raw = readFileSync(latestYml, 'utf8');
  const fixed = raw
    .replace(/^path: .+$/m, `path: ${githubSetupName}`)
    .replace(/^(\s+- url: ).+$/m, `$1${githubSetupName}`);

  if (!fixed.includes(`path: ${githubSetupName}`)) {
    throw new Error('Failed to rewrite path in latest.yml');
  }

  writeFileSync(latestYml, fixed, 'utf8');
  writeFileSync(alphaYml, fixed, 'utf8');
  console.log(`Synced ${latestYml} and ${alphaYml} path/url → ${githubSetupName}`);
}

main();
