# Project Status

| Field | Value |
| --- | --- |
| Current phase | **Phase 3.5 complete** — next: Phase 3B (deferred) or owner-directed follow-up |
| Application version | `0.1.0-alpha` |
| Date | 2026-08-05 |
| Workspace path | `D:\Projects\cm-flow-manager` |
| Product display name | CM Flow Manager |
| Window title | Flow Manager |
| Package ID | `com.cmflowmanager.desktop` |

## Completed work

### Phase 0–3A
- Planning, shell, Tailwind/shadcn, qpdf PoC, Password Remover product UI, governance (native E2E).

### Phase 3.5 (approved / published)
- electron-builder NSIS installer + portable Windows x64.
- Bundled qpdf under `resources/qpdf` with Apache-2.0 NOTICE.
- Version `0.1.0-alpha`; About shows product name + version.
- Packaged EXE is primary verification target for user-facing desktop work.
- Windows EXE icon/VERSIONINFO via afterPack + `rcedit`; NSIS shortcuts use `resources/icon.ico` (avoids Electron icon-cache on upgrades).
- Authenticode signing still deferred → SmartScreen/UAC “Unknown publisher” remains.

### Governance
- Delivery cycle: Implementation → Validation → Phase Report → Human approval → Commit → Push.
- Native End-to-End Verification + Packaged EXE verification (`docs/DEVELOPMENT_WORKFLOW.md`).

## Work in progress

- None (Phase 3.5 closed). Phase 3B remains deferred until explicit approval.

## Blockers

1. **Owner approval required** before Phase 3B (plate → folder).
2. **Authenticode code-signing certificate** required to remove Windows “Unknown publisher”.

## Next approved task

Awaiting owner direction (Phase 3B or other).

## Latest test result

```text
pnpm typecheck → pass
pnpm lint → pass (0 warnings)
pnpm test → pass
```

## Latest build / pack result

```text
pnpm build → pass
pnpm pack:win / dist:win → NSIS + portable produced
Packaged app log: QpdfUnlockService packaged:true
Bundled qpdf 12.3.2 decrypt smoke → exit 0
Desktop/Start Menu shortcuts use resources/icon.ico
```

## GitHub repository

- Remote: https://github.com/Phill1983/CM-Flow-Manager.git
- Branches: `main`, `develop`
