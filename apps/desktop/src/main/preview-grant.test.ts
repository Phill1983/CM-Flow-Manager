import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { grantPdfPreview } from './preview-grant';
import { PdfPreviewRegistry } from './preview-registry';
import { previewTokenFromUrl, previewUrlForToken } from './preview-url';

describe('grantPdfPreview', () => {
  it('grants a token for an unencrypted PDF and revokes it', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'cmflow-preview-'));
    const filePath = join(dir, 'plain.pdf');
    await writeFile(filePath, '%PDF-1.4 test');
    const registry = new PdfPreviewRegistry();
    try {
      const granted = await grantPdfPreview(
        filePath,
        { inspect: async () => ({ status: 'unencrypted', pageCount: 3 }) },
        registry,
      );
      expect(granted.ok).toBe(true);
      if (!granted.ok) return;
      expect(registry.resolve(granted.token)).toBe(filePath);
      expect(registry.revoke(granted.token)).toBe(true);
      expect(registry.resolve(granted.token)).toBe(null);
      expect(registry.size()).toBe(0);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('does not grant a token for encrypted or invalid PDFs', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'cmflow-preview-'));
    const filePath = join(dir, 'blocked.pdf');
    await writeFile(filePath, '%PDF-1.4 test');
    const registry = new PdfPreviewRegistry();
    try {
      const encrypted = await grantPdfPreview(
        filePath,
        { inspect: async () => ({ status: 'encrypted' }) },
        registry,
      );
      expect(encrypted).toEqual({ ok: false, code: 'encrypted_pdf' });
      const invalid = await grantPdfPreview(
        filePath,
        { inspect: async () => ({ status: 'invalid', reason: 'bad' }) },
        registry,
      );
      expect(invalid).toEqual({ ok: false, code: 'invalid_pdf' });
      expect(registry.size()).toBe(0);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('preview URLs', () => {
  it('round-trips a token through the custom scheme', () => {
    const token = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
    const url = previewUrlForToken(token);
    expect(url.startsWith('cmflow-pdf://preview/')).toBe(true);
    expect(previewTokenFromUrl(url)).toBe(token);
    expect(previewTokenFromUrl('https://example.com/secret')).toBe(null);
  });
});
