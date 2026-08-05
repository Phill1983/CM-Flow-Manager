/**
 * Embeds CM icon + Windows VERSIONINFO into the packaged EXE.
 * Used because electron-builder's signAndEditExecutable also pulls winCodeSign
 * (symlink privilege issues on this machine), so we keep that flag false and
 * edit resources here with the rcedit npm package instead.
 *
 * Note: CompanyName metadata is not Authenticode. UAC/SmartScreen still show
 * "Unknown publisher" until a trusted code-signing certificate is used.
 */
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const desktopRoot = join(repoRoot, 'apps', 'desktop');
const iconPath = join(desktopRoot, 'resources', 'icon.ico');

function toWindowsFileVersion(semver) {
  const numeric = String(semver ?? '0.0.0')
    .split(/[+-]/, 1)[0]
    .split('.')
    .map((part) => {
      const n = Number.parseInt(part, 10);
      return Number.isFinite(n) ? String(n) : '0';
    });
  while (numeric.length < 4) {
    numeric.push('0');
  }
  return numeric.slice(0, 4).join('.');
}

/** @param {import('electron-builder').AfterPackContext} context */
export default async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') {
    return;
  }

  const productName = context.packager.appInfo.productFilename;
  const exePath = join(context.appOutDir, `${productName}.exe`);
  const version = context.packager.appInfo.version;
  const fileVersion = toWindowsFileVersion(version);

  const requireFromDesktop = createRequire(join(desktopRoot, 'package.json'));
  const rceditEntry = requireFromDesktop.resolve('rcedit');
  const { rcedit } = await import(pathToFileURL(rceditEntry).href);

  console.log(`[after-pack-win] editing ${exePath}`);
  await rcedit(exePath, {
    icon: iconPath,
    'file-version': fileVersion,
    'product-version': fileVersion,
    'version-string': {
      CompanyName: 'CM Flow Manager',
      FileDescription: 'CM Flow Manager',
      ProductName: 'CM Flow Manager',
      LegalCopyright: 'Copyright (c) CM Flow Manager',
      OriginalFilename: `${productName}.exe`,
      InternalName: productName,
    },
  });
  console.log(`[after-pack-win] icon + VERSIONINFO applied (${fileVersion})`);
}
