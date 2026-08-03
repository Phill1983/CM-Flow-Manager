import { describe, expect, it } from 'vitest';
import { createPdfUnlockService } from './index';

describe('UnavailablePdfUnlockService', () => {
  it('reports unavailable on inspect', async () => {
    const service = createPdfUnlockService();
    const result = await service.inspect('C:/tmp/sample.pdf');
    expect(result.status).toBe('unavailable');
  });

  it('fails unlock with EngineUnavailable', async () => {
    const service = createPdfUnlockService();
    const result = await service.unlock({
      sourcePath: 'C:/tmp/sample.pdf',
      destinationPath: 'C:/tmp/sample_unlocked.pdf',
      password: 'secret-must-not-leak',
    });
    expect(result.status).toBe('failed');
    if (result.status === 'failed') {
      expect(result.category).toBe('EngineUnavailable');
    }
  });
});
