#!/usr/bin/env node
/**
 * Writes SHA-256 checksums and release notes into /release for Alpha packaging.
 */
import { createHash } from 'node:crypto';
import {
  createReadStream,
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RELEASE_DIR = join(ROOT, 'release');
const VERSION = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;

async function sha256File(filePath) {
  const hash = createHash('sha256');
  await pipeline(createReadStream(filePath), hash);
  return hash.digest('hex');
}

async function main() {
  if (!existsSync(RELEASE_DIR)) {
    throw new Error(`Missing release directory: ${RELEASE_DIR}. Run pack:win first.`);
  }

  const entries = readdirSync(RELEASE_DIR)
    .filter((name) => name.toLowerCase().endsWith('.exe'))
    .sort();

  if (entries.length === 0) {
    throw new Error('No .exe artifacts found in /release.');
  }

  const lines = [];
  for (const name of entries) {
    const full = join(RELEASE_DIR, name);
    if (!statSync(full).isFile()) continue;
    const digest = await sha256File(full);
    lines.push(`${digest}  ${name}`);
    console.log(`${digest}  ${name}`);
  }

  const sumsPath = join(RELEASE_DIR, 'SHA256SUMS.txt');
  writeFileSync(sumsPath, `${lines.join('\n')}\n`, 'utf8');

  const notes = `# CM Flow Manager ${VERSION} — Alpha Release Notes

## What this is

Windows Alpha of **CM Flow Manager** — stable PDF tools release (Password Remover + Split/Merge + updater foundation).

- Not a signed production release.
- Unsigned builds may trigger Windows SmartScreen warnings.

## Artifacts

- NSIS installer: \`CM Flow Manager Setup ${VERSION}.exe\`
- Portable: \`CM Flow Manager ${VERSION}.exe\`
- Checksums: \`SHA256SUMS.txt\`
- Update manifest: \`version-manifest.json\`
- electron-updater metadata: \`alpha.yml\` (when emitted by builder)

## Included

- PDF Password Remover (picker, drag/drop, unlock, open folder)
- PDF Split (page thumbnails, selection, drag-reorder, extract)
- PDF Merge (multi-file picker, ordering, merge)
- PDF.js page previews (local, renderer-only)
- Bundled qpdf 12.3.2 (Apache-2.0)
- Settings → Updates (GitHub Releases, SHA-256 verification, user-approved download/install)
- Localization: Polish, Ukrainian, English

## Not included

- Repair document extraction (Phase 4C)
- Invoice reconciliation (Phase 4D)
- OCR / AI / Repair Intelligence UI
- Vehicle plate → folder (Phase 3B)
- Code signing (Authenticode deferred)

## Default output behavior

- Unlock: \`*_unlocked.pdf\` next to source (collision-safe suffixes)
- Split: \`*_pages_<selection>.pdf\`
- Merge: \`merged.pdf\` (or user-chosen Save As)

## Verification checklist (packaged EXE)

- [ ] Application starts; About shows ${VERSION}
- [ ] Password Remover: picker, drag/drop, unlock, open folder
- [ ] Split: thumbnails, page select/reorder, extract
- [ ] Merge: add/remove files, reorder, merge
- [ ] Settings → Updates detects this release from an older install
`;

  writeFileSync(join(RELEASE_DIR, `RELEASE_NOTES-${VERSION}.md`), notes, 'utf8');

  const changelogExcerpt = `# CHANGELOG excerpt — ${VERSION}

### Added

- PDF Split and Merge workspaces with PDF.js page thumbnails, selection, and drag-reorder.
- GitHub Releases updater foundation (SHA-256 verified, user-approved install).

### Changed

- Alpha version bump from \`0.1.0-alpha\` to \`${VERSION}\` for PDF-tools stable release.

### Notes

- Excludes Phase 4C/4D repair extraction and reconciliation work (remains on \`main\`).
- Alpha builds remain unsigned; SmartScreen may warn.
`;

  writeFileSync(join(RELEASE_DIR, `CHANGELOG-excerpt-${VERSION}.md`), changelogExcerpt, 'utf8');
  console.log(`Wrote ${sumsPath} and release notes.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
