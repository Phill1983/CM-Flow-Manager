#!/usr/bin/env node
/**
 * Smoke: packaged main can load updater + validate local version-manifest.json.
 * Does not install an update (same version = up-to-date).
 */
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const requireFromDesktop = createRequire(join(root, 'apps/desktop/package.json'));

// Validate local manifest with package validator
const updaterEntry = requireFromDesktop.resolve('@cm-flow-manager/app-updater');
const { validateVersionManifest, evaluateUpdate } = await import(pathToFileURL(updaterEntry).href);

const manifestJson = JSON.parse(readFileSync(join(root, 'release/version-manifest.json'), 'utf8'));
const validated = validateVersionManifest(manifestJson);
if (!validated.ok) {
  console.error('manifest invalid', validated.errors);
  process.exit(1);
}
const evaluation = evaluateUpdate('0.1.0-alpha', validated.manifest);
console.log(
  JSON.stringify(
    {
      manifestOk: true,
      latestVersion: validated.manifest.latestVersion,
      evaluation,
      channel: validated.manifest.channel,
    },
    null,
    2,
  ),
);

// Live fetch from GitHub
const res = await fetch(
  'https://api.github.com/repos/Phill1983/CM-Flow-Manager/releases/tags/v0.1.0-alpha',
  { headers: { 'User-Agent': 'CM-Flow-Manager-Updater-Smoke', Accept: 'application/vnd.github+json' } },
);
if (!res.ok) {
  console.error('github release fetch failed', res.status);
  process.exit(1);
}
const release = await res.json();
const asset = (release.assets || []).find((a) => a.name === 'version-manifest.json');
if (!asset) {
  console.error('version-manifest.json not on GitHub release yet');
  process.exit(1);
}
const remote = await fetch(asset.browser_download_url, {
  headers: { 'User-Agent': 'CM-Flow-Manager-Updater-Smoke' },
});
const remoteJson = await remote.json();
const remoteValidated = validateVersionManifest(remoteJson);
if (!remoteValidated.ok) {
  console.error('remote manifest invalid', remoteValidated.errors);
  process.exit(1);
}
console.log('remoteManifestOk', true);
console.log('remoteLatest', remoteValidated.manifest.latestVersion);
