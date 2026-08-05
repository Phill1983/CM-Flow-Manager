# Development qpdf (Phase 2)

CM Flow Manager uses the official **qpdf** Windows build for local PDF unlock proof-of-concept work.

| Field | Value |
| --- | --- |
| Upstream | https://github.com/qpdf/qpdf |
| License | Apache License 2.0 |
| Tested version | 12.3.2 (`msvc64`) |
| Fetch script | `pnpm fetch:qpdf` → `scripts/fetch-qpdf-dev.mjs` |

## Phase 2 (development)

```bash
pnpm fetch:qpdf
pnpm fixtures:pdf
pnpm test:pdf
```

The binary under `vendor/qpdf/bin` is **not committed**. Checksums are verified against the official `qpdf-*.sha256` release asset before extract.

## Future production bundling

Phase 3.5 Alpha ships qpdf via electron-builder `extraResources` (`resources/qpdf`) with `NOTICE` (Apache-2.0). Development still uses `pnpm fetch:qpdf` into `vendor/qpdf/bin` (gitignored).

Signed / SmartScreen-hardened redistribution remains a later release goal.
