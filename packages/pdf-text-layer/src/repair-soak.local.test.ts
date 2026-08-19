import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractPdfTextFromBytes } from './extract-pdf-text.js';
import {
  extractRepairDocument,
  extractionInputFromPages,
  type ExtractionResult,
} from '@cm-flow-manager/repair-extraction';

const soakDir = process.env.REPAIR_SOAK_DIR;
const dumpDir = process.env.REPAIR_SOAK_DUMP === '1' ? join(process.cwd(), '.repair-soak') : undefined;

type CaseRole = 'estimate' | 'invoice';

type MappedPdf = {
  readonly caseId: 'CASE-4A2-01' | 'CASE-4A2-02' | 'CASE-4A2-03';
  readonly role: CaseRole;
  readonly filePath: string;
};

function mapLocalPdfs(root: string): MappedPdf[] {
  const mapped: MappedPdf[] = [];
  const folders: Array<{ folder: string; caseId: MappedPdf['caseId'] }> = [
    { folder: '1', caseId: 'CASE-4A2-01' },
    { folder: '2', caseId: 'CASE-4A2-02' },
    { folder: '3', caseId: 'CASE-4A2-03' },
  ];
  for (const { folder, caseId } of folders) {
    const dir = join(root, folder);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (!name.toLowerCase().endsWith('.pdf')) continue;
      const lower = name.toLowerCase();
      const role: CaseRole = lower.startsWith('skm') || lower.includes('scan')
        ? 'estimate'
        : lower.startsWith('faktura') || lower.startsWith('fv')
          ? 'invoice'
          : lower.includes('akcept') || lower.includes('kalkul')
            ? 'estimate'
            : 'invoice';
      if (caseId === 'CASE-4A2-01' && lower.startsWith('skm')) {
        mapped.push({ caseId, role: 'estimate', filePath: join(dir, name) });
      } else if (lower.startsWith('faktura') || lower.startsWith('fv')) {
        mapped.push({ caseId, role: 'invoice', filePath: join(dir, name) });
      } else if (role === 'estimate') {
        mapped.push({ caseId, role: 'estimate', filePath: join(dir, name) });
      }
    }
  }
  return mapped;
}

function alnumCount(text: string): number {
  return (text.match(/[A-Za-z0-9]/g) ?? []).length;
}

function summarize(result: ExtractionResult) {
  const doc = result.document;
  return {
    status: result.status,
    format: result.detection.sourceFormat ?? result.detection.status,
    pages: doc?.source.pageCount ?? result.unavailable?.source.pageCount,
    parts: doc?.parts?.length ?? 0,
    labour: doc?.labour?.length ?? 0,
    jc: doc?.labourUnitConversions?.[0]?.sourceUnitsPerTargetUnit.numerator?.toString() ?? null,
    warnings: result.warnings.map((w) => w.code),
    pageOnPart: doc?.parts?.[0]?.source?.page ?? null,
    identifiers: Boolean(doc?.caseReference?.estimateNumber || doc?.caseReference?.invoiceNumber),
    vehicle: Boolean(doc?.vehicle?.plate || doc?.vehicle?.vin),
    totals: Boolean(doc?.totals?.totalNet || doc?.totals?.totalGross),
    vat: Boolean(doc?.totals?.tax?.taxAmount),
    normalia: doc?.normalia?.length ?? 0,
    materials: doc?.materials?.length ?? 0,
    dupPartKeys: (() => {
      const keys = (doc?.parts ?? []).map((p) => p.rawPartNumber?.value).filter(Boolean);
      return keys.length - new Set(keys).size;
    })(),
    paintHours: doc?.labour?.find((l) => l.category?.value === 'paint')?.normalizedHours?.status ?? null,
    lumpHours: doc?.labour?.find((l) => l.sourceUnit?.value === 'usl')?.normalizedHours?.status ?? null,
  };
}

describe.skipIf(!soakDir || !existsSync(soakDir))('local real-PDF soak', () => {
  it('extracts CASE-4A2 pairs with PDF.js and does not print document contents', async () => {
    const mapped = mapLocalPdfs(soakDir!);
    expect(mapped.length).toBeGreaterThan(0);
    if (dumpDir) mkdirSync(dumpDir, { recursive: true });

    const reports: Array<{ caseId: string; role: string; summary: ReturnType<typeof summarize>; timing: unknown }> = [];

    for (const item of mapped) {
      const bytes = new Uint8Array(readFileSync(item.filePath));
      const extracted = await extractPdfTextFromBytes(bytes);
      const documentId = `${item.caseId}-${item.role}`;
      const result = extractRepairDocument(extractionInputFromPages(documentId, extracted.pages));
      const summary = summarize(result);
      reports.push({
        caseId: item.caseId,
        role: item.role,
        summary,
        timing: extracted.timing,
      });
      console.log(
        `${item.caseId} ${item.role} format=${summary.format} result=${summary.status} pages=${extracted.pageCount} parts=${summary.parts} labour=${summary.labour} jcConversion=${summary.jc ?? '-'} identifiers=${summary.identifiers} vehicle=${summary.vehicle} totals=${summary.totals} vat=${summary.vat} normalia=${summary.normalia} materials=${summary.materials} dupPartKeys=${summary.dupPartKeys} pageOnPart=${summary.pageOnPart ?? '-'} warnings=${summary.warnings.join(',') || '0'} loadMs=${extracted.timing.loadMs} extractMs=${extracted.timing.extractMs} parseMs=${result.timingMs} alnum=${alnumCount(extracted.fullText)}`,
      );

      if (dumpDir) {
        const safeName = `${item.caseId}-${item.role}.txt`;
        writeFileSync(join(dumpDir, safeName), extracted.fullText, 'utf8');
      }
    }

    const scan = reports.find((r) => r.caseId === 'CASE-4A2-01' && r.role === 'estimate');
    if (scan) expect(scan.summary.status).toBe('OCR_REQUIRED');

    const est02 = reports.find((r) => r.caseId === 'CASE-4A2-02' && r.role === 'estimate');
    if (est02) {
      expect(['SUCCESS', 'PARTIAL']).toContain(est02.summary.status);
      expect(est02.summary.format).toBe('audatex');
      expect(est02.summary.jc).toBe('10');
      expect(est02.summary.parts).toBeGreaterThan(0);
      expect(est02.summary.labour).toBeGreaterThan(0);
      expect(est02.summary.totals).toBe(true);
      expect(est02.summary.vehicle).toBe(true);
      expect(est02.summary.pageOnPart).toEqual(expect.any(Number));
    }
    const inv02 = reports.find((r) => r.caseId === 'CASE-4A2-02' && r.role === 'invoice');
    if (inv02) {
      expect(['SUCCESS', 'PARTIAL']).toContain(inv02.summary.status);
      expect(inv02.summary.format).toBe('shop_faktura_vat');
      expect(inv02.summary.parts).toBeGreaterThan(0);
      expect(inv02.summary.labour).toBeGreaterThanOrEqual(2);
      expect(inv02.summary.identifiers).toBe(true);
      expect(inv02.summary.totals).toBe(true);
    }
    const est03 = reports.find((r) => r.caseId === 'CASE-4A2-03' && r.role === 'estimate');
    if (est03) {
      expect(['SUCCESS', 'PARTIAL']).toContain(est03.summary.status);
      expect(est03.summary.format).toBe('audatex');
      expect(est03.summary.jc).toBe('12');
      expect(est03.summary.parts).toBeGreaterThan(0);
      expect(est03.summary.warnings).toContain('conflicting_jc_labels');
      expect(est03.summary.dupPartKeys).toBeGreaterThan(0);
      expect(est03.summary.totals).toBe(true);
    }
    const inv03 = reports.find((r) => r.caseId === 'CASE-4A2-03' && r.role === 'invoice');
    if (inv03) {
      expect(['SUCCESS', 'PARTIAL']).toContain(inv03.summary.status);
      expect(inv03.summary.format).toBe('shop_faktura_vat');
      expect(inv03.summary.parts).toBeGreaterThan(0);
      expect(inv03.summary.lumpHours).toBe('unresolved');
      expect(inv03.summary.dupPartKeys).toBeGreaterThan(0);
      expect(inv03.summary.totals).toBe(true);
    }
  }, 60_000);
});
