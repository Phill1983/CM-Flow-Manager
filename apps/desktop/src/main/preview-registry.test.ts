import { describe, expect, it } from 'vitest';
import { PdfPreviewRegistry, isPreviewToken } from './preview-registry';

describe('PdfPreviewRegistry', () => {
  it('grants opaque tokens and resolves them back to the same path', () => {
    const registry = new PdfPreviewRegistry();
    const token = registry.grant('C:\\docs\\a.pdf');
    expect(isPreviewToken(token)).toBe(true);
    expect(registry.resolve(token)).toBe('C:\\docs\\a.pdf');
    expect(registry.resolve('not-a-token')).toBe(null);
  });

  it('reuses a token for the same path and revokes it', () => {
    const registry = new PdfPreviewRegistry();
    const first = registry.grant('C:\\docs\\a.pdf');
    const second = registry.grant('C:\\docs\\a.pdf');
    expect(second).toBe(first);
    expect(registry.revoke(first)).toBe(true);
    expect(registry.resolve(first)).toBe(null);
  });

  it('clears all tokens', () => {
    const registry = new PdfPreviewRegistry();
    registry.grant('C:\\docs\\a.pdf');
    registry.grant('C:\\docs\\b.pdf');
    registry.revokeAll();
    expect(registry.size()).toBe(0);
  });
});
