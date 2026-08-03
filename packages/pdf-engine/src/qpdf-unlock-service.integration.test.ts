import { createHash, randomUUID } from 'node:crypto';
import { copyFile, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import {
  QpdfUnlockService,
  resolveQpdfExecutable,
  type PdfEngineLogEvent,
} from './qpdf-unlock-service';

const FIXTURES = fileURLToPath(new URL('../fixtures', import.meta.url));
const KNOWN_PASSWORD = 'poc-known-pass';
const WRONG_PASSWORD = 'definitely-wrong-password';

function qpdfAvailable(): boolean {
  const path = resolveQpdfExecutable();
  return Boolean(path && existsSync(path));
}

const describeQpdf = qpdfAvailable() ? describe : describe.skip;

describeQpdf('QpdfUnlockService integration', () => {
  const events: PdfEngineLogEvent[] = [];
  let service: QpdfUnlockService;
  let workRoot: string;

  beforeAll(async () => {
    service = new QpdfUnlockService({
      logger: {
        log: (event) => {
          events.push(event);
        },
      },
    });
    workRoot = await mkdtemp(join(tmpdir(), 'cmflow-pdf-it-'));
  });

  afterAll(async () => {
    await rm(workRoot, { recursive: true, force: true });
  });

  function assertNoSecretLeak(secret: string): void {
    const blob = JSON.stringify(events);
    expect(blob.includes(secret)).toBe(false);
  }

  it('unlocks encrypted PDF with correct password and leaves source unchanged', async () => {
    events.length = 0;
    const source = join(FIXTURES, 'encrypted-known-password.pdf');
    const sourceBefore = createHash('sha256').update(await readFile(source)).digest('hex');
    const destination = join(workRoot, 'ok_unlocked.pdf');

    const result = await service.unlock({
      sourcePath: source,
      destinationPath: destination,
      password: KNOWN_PASSWORD,
    });

    expect(result.status).toBe('unlocked');
    if (result.status !== 'unlocked') return;

    const sourceAfter = createHash('sha256').update(await readFile(source)).digest('hex');
    expect(sourceAfter).toBe(sourceBefore);

    const outStat = await stat(result.destinationPath);
    expect(outStat.size).toBeGreaterThan(0);

    const inspectOut = await service.inspect(result.destinationPath);
    expect(inspectOut.status).toBe('unencrypted');
    assertNoSecretLeak(KNOWN_PASSWORD);
  });

  it('returns incorrect_password and does not leave output', async () => {
    events.length = 0;
    const source = join(FIXTURES, 'encrypted-known-password.pdf');
    const destination = join(workRoot, 'wrong_out.pdf');

    const result = await service.unlock({
      sourcePath: source,
      destinationPath: destination,
      password: WRONG_PASSWORD,
    });

    expect(result.status).toBe('incorrect_password');
    expect(existsSync(destination)).toBe(false);
    expect(JSON.stringify(result).includes(WRONG_PASSWORD)).toBe(false);
    assertNoSecretLeak(WRONG_PASSWORD);
  });

  it('maps corrupted PDF to InvalidPdf', async () => {
    const source = join(FIXTURES, 'corrupted.pdf');
    const destination = join(workRoot, 'corrupt_out.pdf');
    const result = await service.unlock({
      sourcePath: source,
      destinationPath: destination,
      password: KNOWN_PASSWORD,
    });
    expect(result.status).toBe('failed');
    if (result.status === 'failed') {
      expect(result.category).toBe('InvalidPdf');
      expect(result.message.toLowerCase()).not.toContain(KNOWN_PASSWORD);
    }
  });

  it('maps missing source to SourceFileNotFound', async () => {
    const result = await service.unlock({
      sourcePath: join(workRoot, 'missing-file.pdf'),
      destinationPath: join(workRoot, 'missing_out.pdf'),
      password: KNOWN_PASSWORD,
    });
    expect(result.status).toBe('failed');
    if (result.status === 'failed') {
      expect(result.category).toBe('SourceFileNotFound');
    }
  });

  it('fails with DestinationExists when output already present', async () => {
    const source = join(FIXTURES, 'encrypted-known-password.pdf');
    const destination = join(workRoot, 'exists_out.pdf');
    await writeFile(destination, 'placeholder');

    const result = await service.unlock({
      sourcePath: source,
      destinationPath: destination,
      password: KNOWN_PASSWORD,
    });

    expect(result.status).toBe('failed');
    if (result.status === 'failed') {
      expect(result.category).toBe('DestinationExists');
    }
    expect(await readFile(destination, 'utf8')).toBe('placeholder');
  });

  it('handles plain PDF by writing a verified unencrypted copy', async () => {
    const source = join(FIXTURES, 'plain.pdf');
    const destination = join(workRoot, 'plain_copy.pdf');
    const inspect = await service.inspect(source);
    expect(inspect.status).toBe('unencrypted');

    const result = await service.unlock({
      sourcePath: source,
      destinationPath: destination,
      password: '',
    });
    expect(result.status).toBe('unlocked');
    const outInspect = await service.inspect(destination);
    expect(outInspect.status).toBe('unencrypted');
  });

  it('supports Unicode path characters', async () => {
    const unicodeDir = join(workRoot, 'zażółć-тест');
    await mkdir(unicodeDir, { recursive: true });
    const source = join(unicodeDir, 'zażółć-тест.pdf');
    await copyFile(join(FIXTURES, 'encrypted-known-password.pdf'), source);
    const destination = join(unicodeDir, 'zażółć-тест_unlocked.pdf');

    const result = await service.unlock({
      sourcePath: source,
      destinationPath: destination,
      password: KNOWN_PASSWORD,
    });
    expect(result.status).toBe('unlocked');
    expect(existsSync(destination)).toBe(true);
  });

  it('supports paths with spaces', async () => {
    const spacedDir = join(workRoot, 'path with spaces');
    await mkdir(spacedDir, { recursive: true });
    const source = join(spacedDir, 'spaced file.pdf');
    await copyFile(join(FIXTURES, 'encrypted-known-password.pdf'), source);
    const destination = join(spacedDir, 'spaced file_unlocked.pdf');

    const result = await service.unlock({
      sourcePath: source,
      destinationPath: destination,
      password: KNOWN_PASSWORD,
    });
    expect(result.status).toBe('unlocked');
  });
});

describe('fixture password constants', () => {
  it('uses only synthetic passwords', () => {
    expect(KNOWN_PASSWORD.startsWith('poc-')).toBe(true);
    expect(WRONG_PASSWORD.includes('poc-known-pass')).toBe(false);
    expect(randomUUID().length).toBeGreaterThan(0);
  });
});
