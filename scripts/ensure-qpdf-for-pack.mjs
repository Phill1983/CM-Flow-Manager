#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const qpdf = resolve(root, 'vendor/qpdf/bin/qpdf.exe');
const notice = resolve(root, 'vendor/qpdf/NOTICE');

if (!existsSync(qpdf)) {
  console.error('Missing vendor/qpdf/bin/qpdf.exe. Run: pnpm fetch:qpdf');
  process.exit(1);
}
if (!existsSync(notice)) {
  console.error('Missing vendor/qpdf/NOTICE (Apache-2.0 attribution).');
  process.exit(1);
}

console.log('qpdf pack prerequisites OK:', qpdf);
