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

  it('fails extract and merge with EngineUnavailable', async () => {
    const service = new UnavailablePdfUnlockService();
    const extracted = await service.extractPages({
      sourcePath: 'C:/tmp/sample.pdf',
      destinationPath: 'C:/tmp/sample_pages_1.pdf',
      pageSelection: '1',
    });
    expect(extracted.status).toBe('failed');
    if (extracted.status === 'failed') {
      expect(extracted.category).toBe('EngineUnavailable');
    }
    const merged = await service.mergePdfs({
      sourcePaths: ['C:/tmp/a.pdf', 'C:/tmp/b.pdf'],
      destinationPath: 'C:/tmp/merged.pdf',
    });
    expect(merged.status).toBe('failed');
    if (merged.status === 'failed') {
      expect(merged.category).toBe('EngineUnavailable');
    }
  });
});
