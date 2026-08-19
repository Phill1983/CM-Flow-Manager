import { describe, expect, it } from 'vitest';
import { extractPdfTextFromBytes } from './extract-pdf-text.js';

function minimalPdfWithText(text: string): Uint8Array {
  const escaped = text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const stream = `BT /F1 12 Tf 72 720 Td (${escaped}) Tj ET`;
  const obj4 = `4 0 obj << /Length ${Buffer.byteLength(stream)} >> stream\n${stream}\nendstream\nendobj\n`;
  const body =
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n' +
    '2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj\n' +
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n' +
    obj4 +
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n';
  const header = '%PDF-1.4\n';
  const offsets = [0];
  let cursor = header.length;
  const parts = body.split(/(?=\d+ 0 obj)/).filter((p) => p.length > 0);
  let rebuilt = '';
  for (const part of parts) {
    offsets.push(cursor);
    rebuilt += part;
    cursor += part.length;
  }
  const xrefStart = header.length + rebuilt.length;
  const xrefLines = ['xref', `0 ${offsets.length}`, '0000000000 65535 f '];
  for (let i = 1; i < offsets.length; i += 1) {
    xrefLines.push(`${String(offsets[i]).padStart(10, '0')} 00000 n `);
  }
  const xref = `${xrefLines.join('\n')}\n`;
  const trailer = `trailer << /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return new Uint8Array(Buffer.from(header + rebuilt + xref + trailer));
}

describe('extractPdfTextFromBytes', () => {
  it('extracts a text layer page with PDF.js and releases the document', async () => {
    const extracted = await extractPdfTextFromBytes(minimalPdfWithText('SYSTEM AUDATEX'));
    expect(extracted.pageCount).toBe(1);
    expect(extracted.pages[0]?.pageNumber).toBe(1);
    expect(extracted.pages[0]?.text).toContain('SYSTEM AUDATEX');
    expect(extracted.fullText).toContain('SYSTEM AUDATEX');
    expect(extracted.timing.totalMs).toBeLessThan(5000);
  });
});
