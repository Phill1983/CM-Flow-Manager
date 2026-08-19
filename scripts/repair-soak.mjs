import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = process.argv[2] || process.env.REPAIR_SOAK_DIR;
if (!dir) {
  console.error('Usage: pnpm repair:soak <local-folder>');
  process.exit(1);
}

const child = spawn(
  'pnpm',
  ['exec', 'vitest', 'run', 'packages/pdf-text-layer/src/repair-soak.local.test.ts'],
  {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, REPAIR_SOAK_DIR: resolve(dir) },
    shell: process.platform === 'win32',
  },
);

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
