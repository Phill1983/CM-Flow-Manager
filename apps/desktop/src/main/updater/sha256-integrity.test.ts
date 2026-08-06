import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { Sha256IntegrityService } from './sha256-integrity.js';

describe('Sha256IntegrityService', () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const dir of dirs) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('accepts matching digests and rejects mismatches', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'cm-sha-'));
    dirs.push(dir);
    const filePath = join(dir, 'payload.bin');
    const payload = Buffer.from('cm-flow-manager-integrity');
    writeFileSync(filePath, payload);
    const expected = createHash('sha256').update(payload).digest('hex');
    const service = new Sha256IntegrityService();

    await expect(service.verifySha256(filePath, expected)).resolves.toEqual({ ok: true });
    await expect(service.verifySha256(filePath, 'a'.repeat(64))).resolves.toMatchObject({
      ok: false,
      code: 'mismatch',
    });
  });
});
