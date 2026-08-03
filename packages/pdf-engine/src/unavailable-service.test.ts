import { describe, expect, it } from 'vitest';
import { UnavailablePdfUnlockService } from './unavailable-service';

describe('UnavailablePdfUnlockService', () => {
  it('reports unavailable on inspect', async () => {
    const service = new UnavailablePdfUnlockService();
    const result = await service.inspect('C:/tmp/sample.pdf');
    expect(result.status).toBe('unavailable');
  });

  it('fails unlock with EngineUnavailable', async () => {
    const service = new UnavailablePdfUnlockService();
    const result = await service.unlock({
      sourcePath: 'C:/tmp/sample.pdf',
      destinationPath: 'C:/tmp/sample_unlocked.pdf',
      password: 'secret-must-not-leak',
    });
    expect(result.status).toBe('failed');
    if (result.status === 'failed') {
      expect(result.category).toBe('EngineUnavailable');
      expect(JSON.stringify(result)).not.toContain('secret-must-not-leak');
    }
  });
});
