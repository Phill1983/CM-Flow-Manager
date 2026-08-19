import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractPdfTextFromBytes } from '@cm-flow-manager/pdf-text-layer';
import {
  extractRepairDocument,
  extractionInputFromPages,
} from '@cm-flow-manager/repair-extraction';
import { moneyToMajorString } from '@cm-flow-manager/repair-domain';
import { validateInvoiceAgainstEstimate } from './validate-invoice.js';

const soakDir = process.env.REPAIR_SOAK_DIR;

function mapPdfs(root: string): Array<{ caseId: string; role: 'estimate' | 'invoice'; path: string }> {
  const out: Array<{ caseId: string; role: 'estimate' | 'invoice'; path: string }> = [];
  const cases = [
    { folder: '2', caseId: 'CASE-4A2-02' },
    { folder: '3', caseId: 'CASE-4A2-03' },
  ];
  for (const { folder, caseId } of cases) {
    const dir = join(root, folder);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (!name.toLowerCase().endsWith('.pdf')) continue;
      const lower = name.toLowerCase();
      const role: 'estimate' | 'invoice' =
        lower.startsWith('faktura') || lower.startsWith('fv') ? 'invoice' : 'estimate';
      out.push({ caseId, role, path: join(dir, name) });
    }
  }
  return out;
}

function sanitizeSummary(result: ReturnType<typeof validateInvoiceAgainstEstimate>) {
  return {
    estimateDocumentId: result.estimateDocumentId,
    invoiceDocumentId: result.invoiceDocumentId,
    netDelta: result.totals.netDelta ? moneyToMajorString(result.totals.netDelta) : null,
    grossDelta: result.totals.grossDelta ? moneyToMajorString(result.totals.grossDelta) : null,
    explained: result.explainedDifference ? moneyToMajorString(result.explainedDifference) : null,
    residual: result.residual ? moneyToMajorString(result.residual) : null,
    categories: result.categoryDifferences.map((c) => ({
      category: c.category,
      level: c.level,
      delta: c.delta ? moneyToMajorString(c.delta) : null,
    })),
    partMatched: result.partMatches.matched.length,
    partEstimateOnly: result.partMatches.estimateOnly.length,
    partInvoiceOnly: result.partMatches.invoiceOnly.length,
    partAmbiguous: result.partMatches.ambiguous.length,
    warnings: result.warnings.map((w) => w.code),
  };
}

describe.skipIf(!soakDir)('reconcile soak (local PDFs)', () => {
  it('reconciles CASE-4A2-02 and CASE-4A2-03 from extracted canonical documents', async () => {
    const mapped = mapPdfs(soakDir!);
    const byCase = new Map<string, { estimate?: string; invoice?: string }>();
    for (const m of mapped) {
      const slot = byCase.get(m.caseId) ?? {};
      slot[m.role] = m.path;
      byCase.set(m.caseId, slot);
    }

    for (const [caseId, paths] of byCase) {
      if (!paths.estimate || !paths.invoice) continue;
      const estBytes = new Uint8Array(readFileSync(paths.estimate));
      const invBytes = new Uint8Array(readFileSync(paths.invoice));
      const estText = await extractPdfTextFromBytes(estBytes);
      const invText = await extractPdfTextFromBytes(invBytes);
      const estDoc = extractRepairDocument(
        extractionInputFromPages(`${caseId}-estimate`, estText.pages),
      ).document;
      const invDoc = extractRepairDocument(
        extractionInputFromPages(`${caseId}-invoice`, invText.pages),
      ).document;
      expect(estDoc).toBeDefined();
      expect(invDoc).toBeDefined();
      const result = validateInvoiceAgainstEstimate(estDoc!, invDoc!);
      const summary = sanitizeSummary(result);
      expect(summary.netDelta).toBeTruthy();
      if (result.totals.netDelta && result.explainedDifference && result.residual) {
        expect(result.totals.netDelta.minorUnits).toBe(
          result.explainedDifference.minorUnits + result.residual.minorUnits,
        );
      }
      console.log(JSON.stringify({ caseId, summary }, null, 2));
    }
  });
});

describe('reconcile sanitized fixtures', () => {
  it('CASE-4A2-02 invariant: explained + residual = net delta', async () => {
    const { buildCase4a202Estimate, buildCase4a202Invoice } = await import(
      '@cm-flow-manager/repair-domain'
    );
    const result = validateInvoiceAgainstEstimate(
      buildCase4a202Estimate(),
      buildCase4a202Invoice(),
    );
    expect(result.totals.netDelta?.minorUnits).toBe(
      (result.explainedDifference?.minorUnits ?? 0n) + (result.residual?.minorUnits ?? 0n),
    );
  });
});
