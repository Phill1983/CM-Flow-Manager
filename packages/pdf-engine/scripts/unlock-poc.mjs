#!/usr/bin/env node
/**
 * Minimal CLI PoC for Phase 2.
 *
 *   pnpm --filter @cm-flow-manager/pdf-engine poc:unlock -- --source in.pdf --dest out.pdf --password secret
 *
 * Uses Node's TypeScript strip-types (Node 22+) to load the adapter directly.
 */
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const serviceTs = join(here, '../src/qpdf-unlock-service.ts');

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || !process.argv[index + 1]) return null;
  return process.argv[index + 1];
}

const source = readArg('--source');
const dest = readArg('--dest');
const password = readArg('--password') ?? '';

if (!source || !dest) {
  console.error('Usage: poc:unlock -- --source <in.pdf> --dest <out.pdf> --password <pass>');
  process.exit(1);
}

const runner = `
import { pathToFileURL } from 'node:url';
const mod = await import(pathToFileURL(${JSON.stringify(serviceTs)}).href);
const service = new mod.QpdfUnlockService({
  logger: { log: (e) => console.log(JSON.stringify(e)) },
});
const inspect = await service.inspect(${JSON.stringify(resolve(source))});
console.log(JSON.stringify({ inspect }));
const result = await service.unlock({
  sourcePath: ${JSON.stringify(resolve(source))},
  destinationPath: ${JSON.stringify(resolve(dest))},
  password: ${JSON.stringify(password)},
});
console.log(JSON.stringify({ result }));
process.exit(result.status === 'unlocked' ? 0 : 2);
`;

const result = spawnSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', runner], {
  encoding: 'utf8',
  shell: false,
  windowsHide: true,
});
process.stdout.write(result.stdout || '');
process.stderr.write(result.stderr || '');
process.exit(result.status ?? 1);
