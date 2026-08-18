import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));

describe('split workspace preview policy', () => {
  it('keeps lazy rendering limits and a larger low-resolution thumbnail width', () => {
    const preview = readFileSync(join(here, 'pdfjs-preview.ts'), 'utf8');
    expect(preview).toContain('const MAX_CONCURRENT_RENDERS = 3;');
    expect(preview).toContain('export const WORKSPACE_THUMBNAIL_WIDTH_PX = 168;');
    expect(preview).toContain('export const INSPECT_PAGE_WIDTH_PX = 720;');
    expect(preview).toContain('export const THUMBNAIL_VIRTUALIZE_AFTER = 80;');
  });

  it('allows Chromium blob workers for PDF.js without opening remote scripts', () => {
    const html = readFileSync(join(here, '../../../index.html'), 'utf8');
    expect(html).toContain("script-src 'self' blob:");
    expect(html).toContain("worker-src 'self' blob:");
    expect(html).toContain("connect-src 'self' cmflow-pdf:");
  });
});
