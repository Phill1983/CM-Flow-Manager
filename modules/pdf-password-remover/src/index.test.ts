import { describe, expect, it } from 'vitest';
import { getPdfPasswordRemoverModuleInfo } from './index';

describe('pdf-password-remover module info', () => {
  it('marks engine unavailable in Phase 1', () => {
    const info = getPdfPasswordRemoverModuleInfo();
    expect(info.engineAvailable).toBe(false);
    expect(info.route).toBe('/pdf-tools/password-remover');
  });
});
