#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const desktopRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../apps/desktop');
process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'false';

const result = spawnSync(
  'pnpm',
  ['exec', 'electron-builder', '--config', 'electron-builder.yml', '--win', 'nsis', 'portable', '--x64'],
  {
    cwd: desktopRoot,
    env: process.env,
    stdio: 'inherit',
    shell: true,
  },
);

process.exit(result.status ?? 1);
