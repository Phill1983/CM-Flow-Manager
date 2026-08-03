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

Shipping qpdf inside the Windows installer is deferred. Production packaging must include Apache-2.0 attribution and the verified binary/DLLs. Do not treat the Phase 2 vendor folder as the final redistribute layout.
