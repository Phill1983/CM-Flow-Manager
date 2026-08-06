import { createHash } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import type { IntegrityVerifyResult, PackageIntegrityPort } from '@cm-flow-manager/app-updater';

export class Sha256IntegrityService implements PackageIntegrityPort {
  async verifySha256(filePath: string, expectedSha256: string): Promise<IntegrityVerifyResult> {
    if (!existsSync(filePath)) {
      return { ok: false, code: 'missing_file', expected: expectedSha256 };
    }
    try {
      const hash = createHash('sha256');
      await pipeline(createReadStream(filePath), hash);
      const actual = hash.digest('hex');
      if (actual !== expectedSha256.toLowerCase()) {
        return { ok: false, code: 'mismatch', expected: expectedSha256.toLowerCase(), actual };
      }
      return { ok: true };
    } catch {
      return { ok: false, code: 'read_error', expected: expectedSha256 };
    }
  }
}
