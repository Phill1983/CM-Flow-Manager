#!/usr/bin/env node
/**
 * Writes SHA-256 checksums and release notes into /release for Alpha packaging.
 */
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RELEASE_DIR = join(ROOT, 'release');
const VERSION = '0.1.0-alpha';

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

First standalone Windows Alpha of **CM Flow Manager** for real daily testing outside the development environment.

- Not a public/production release.
- Unsigned builds may trigger Windows SmartScreen warnings.

## Artifacts

- NSIS installer: \`CM Flow Manager Setup ${VERSION}.exe\`
- Portable: \`CM Flow Manager ${VERSION}.exe\`
- Checksums: \`SHA256SUMS.txt\`

## Included

- Electron runtime (no Node/npm/pnpm/Git required for end users)
- Password Remover (single-file) UI
- Bundled qpdf 12.3.2 (Apache-2.0) under application resources
- Localization: Polish, Ukrainian, English

## Not included yet

- Vehicle plate → folder resolution (Phase 3B)
- Batch unlock (Phase 4)
- Code signing
- Auto-update

## Default output behavior

Unlocked PDFs are written next to the source as \`*_unlocked.pdf\` (collision-safe \`_2\`, \`_3\`, …) unless the user chooses Save As.

## Verification checklist (packaged EXE)

- [ ] Application starts
- [ ] Dashboard loads
- [ ] PDF Password Remover opens
- [ ] Select PDF works
- [ ] Drag & drop works
- [ ] Unlock works with bundled qpdf
- [ ] Output file created
- [ ] Open output folder works
- [ ] About shows version ${VERSION}
`;

  writeFileSync(join(RELEASE_DIR, `RELEASE_NOTES-${VERSION}.md`), notes, 'utf8');

  const changelogExcerpt = `# CHANGELOG excerpt — ${VERSION}

### Added

- First standalone Windows Alpha packaging (NSIS installer + portable).
- Bundled qpdf runtime for end users (no separate Node/qpdf install).

### Notes

- Alpha for internal/daily testing; not a signed public release.
- Phase 3B plate/folder automation and batch processing remain later.
`;

  writeFileSync(join(RELEASE_DIR, `CHANGELOG-excerpt-${VERSION}.md`), changelogExcerpt, 'utf8');
  console.log(`Wrote ${sumsPath} and release notes.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
