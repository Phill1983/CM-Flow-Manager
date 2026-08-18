/**
 * Fail the desktop build if main bundle still runtime-imports workspace
 * TypeScript packages (Electron cannot load `.ts`).
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mainBundle = resolve(root, 'out/main/index.js');

if (!existsSync(mainBundle)) {
  console.error(`[assert-main-bundle] missing ${mainBundle}`);
  process.exit(1);
}

const source = readFileSync(mainBundle, 'utf8');
const forbidden = [
  '@cm-flow-manager/app-updater',
  '@cm-flow-manager/pdf-engine',
  '@cm-flow-manager/pdf-password-remover',
  '@cm-flow-manager/pdf-split-merge',
  '@cm-flow-manager/file-utils',
  '@cm-flow-manager/ipc-contracts',
  'packages/app-updater/src/',
];

const hits = forbidden.filter((token) => source.includes(token));
// Allow createRequire('electron-updater') / from "electron-updater" — CJS package is expected external.
if (hits.length > 0) {
  console.error('[assert-main-bundle] forbidden runtime references in out/main/index.js:');
  for (const hit of hits) console.error(`  - ${hit}`);
  process.exit(1);
}

if (!source.includes('electron-updater')) {
  console.error('[assert-main-bundle] expected electron-updater require/import in main bundle');
  process.exit(1);
}

if (source.includes("from \"electron-updater\"") && source.includes('{ autoUpdater }')) {
  console.error(
    '[assert-main-bundle] named ESM import of autoUpdater is unsafe; use createRequire',
  );
  process.exit(1);
}

console.info('[assert-main-bundle] ok');
