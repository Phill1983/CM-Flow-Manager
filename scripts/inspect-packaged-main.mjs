import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const asar = require('../node_modules/.pnpm/@electron+asar@3.4.1/node_modules/@electron/asar/lib/asar.js');
const src = 'D:/Projects/cm-flow-manager/release/win-unpacked/resources/app.asar';
const list = asar.listPackage(src);
const hits = list.filter(
  (p) => String(p).includes('out') && String(p).includes('main') && String(p).includes('index.js'),
);
console.log('hits', hits);

function tryExtract(key) {
  try {
    const buf = asar.extractFile(src, key);
    writeFileSync('D:/Projects/cm-flow-manager/release/packaged-main-check.js', buf);
    const t = buf.toString('utf8');
    console.log('OK', JSON.stringify(key), buf.length);
    console.log('named_esm', /import\s*\{\s*autoUpdater\s*\}\s*from\s*"electron-updater"/.test(t));
    console.log('createRequire_load', t.includes('require$1("electron-updater")'));
    console.log('app_updater_pkg', t.includes('@cm-flow-manager/app-updater'));
    console.log('ts_src', t.includes('app-updater/src/index.ts'));
    return true;
  } catch {
    return false;
  }
}

const keys = new Set(['out/main/index.js', 'out\\main\\index.js']);
for (const p of hits) {
  const s = String(p);
  keys.add(s);
  keys.add(s.replace(/^\//, ''));
  keys.add(s.replace(/^\\/, ''));
  keys.add(s.replaceAll('\\', '/').replace(/^\//, ''));
}

for (const key of keys) {
  if (tryExtract(key)) process.exit(0);
}
console.error('failed');
process.exit(1);
