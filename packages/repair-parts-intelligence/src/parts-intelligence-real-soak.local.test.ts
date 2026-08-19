import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractPdfTextFromBytes } from '@cm-flow-manager/pdf-text-layer';
import {
  extractRepairDocument,
  extractionInputFromPages,
} from '@cm-flow-manager/repair-extraction';
import { validateInvoiceAgainstEstimate } from '@cm-flow-manager/repair-reconciliation';
import { analyzePartRelationCandidates } from './index.js';
import type { PartRelationCandidate } from './types.js';

const soakDir = process.env.REPAIR_SOAK_DIR;
const CASE_ID = 'CASE-4A2-03';

function findCase03Pdfs(root: string): { estimate?: string; invoice?: string } {
  const dir = join(root, '3');
  if (!existsSync(dir)) return {};
  const out: { estimate?: string; invoice?: string } = {};
  for (const name of readdirSync(dir)) {
    if (!name.toLowerCase().endsWith('.pdf')) continue;
    const lower = name.toLowerCase();
    const path = join(dir, name);
    if (lower.startsWith('faktura') || lower.startsWith('fv')) {
      out.invoice = path;
    } else {
      out.estimate = path;
    }
  }
  return out;
}

function isStructuralCandidate(c: PartRelationCandidate): boolean {
  return c.relation !== 'unresolved';
}

function reviewFalsePositives(
  candidates: readonly PartRelationCandidate[],
  estimateParts: Map<string, { description?: string; quantity?: string; unit?: string }>,
  invoiceParts: Map<string, { description?: string; quantity?: string; unit?: string }>,
) {
  const leadingA = candidates.filter((c) => c.relation === 'prefix_variant_candidate');
  let incompatibleDescription = false;
  let incompatibleQtyUnit = false;

  for (const c of leadingA) {
    const est = estimateParts.get(c.leftLineId);
    const inv = invoiceParts.get(c.rightLineId);
    if (est?.description && inv?.description) {
      const a = est.description.toUpperCase();
      const b = inv.description.toUpperCase();
      const estPos = a.match(/\b(P|T)\s+L\b/);
      const invPos = b.match(/\b(P|T)\s+L\b/);
      if (estPos && invPos && estPos[1] !== invPos[1]) {
        incompatibleDescription = true;
      }
    }
    if (est?.quantity && inv?.quantity && est.quantity !== inv.quantity) {
      incompatibleQtyUnit = true;
    }
    if (est?.unit && inv?.unit && est.unit.toLowerCase() !== inv.unit.toLowerCase()) {
      incompatibleQtyUnit = true;
    }
  }

  const unrelatedPromoted = candidates.some(
    (c) =>
      c.relation !== 'unresolved' &&
      !c.reasonCodes.includes('normalized_numbers_equal') &&
      !c.reasonCodes.includes('leading_a_prefix_removed') &&
      !c.reasonCodes.includes('formatting_only_difference'),
  );

  return {
    leadingAIncompatibleDescription: incompatibleDescription,
    leadingAIncompatibleQtyUnit: incompatibleQtyUnit,
    unrelatedPromotedBySecondaryOnly: unrelatedPromoted,
  };
}

describe.skipIf(!soakDir)('parts intelligence real-pair soak (local PDFs)', () => {
  it('CASE-4A2-03 extraction + 4D + 4E.1 sanitized report', async () => {
    const paths = findCase03Pdfs(soakDir!);
    expect(paths.estimate, 'estimate PDF missing in Exemples/3').toBeTruthy();
    expect(paths.invoice, 'invoice PDF missing in Exemples/3').toBeTruthy();

    const estBytes = new Uint8Array(readFileSync(paths.estimate!));
    const invBytes = new Uint8Array(readFileSync(paths.invoice!));
    const estText = await extractPdfTextFromBytes(estBytes);
    const invText = await extractPdfTextFromBytes(invBytes);
    const estDoc = extractRepairDocument(
      extractionInputFromPages(`${CASE_ID}-estimate`, estText.pages),
    ).document!;
    const invDoc = extractRepairDocument(
      extractionInputFromPages(`${CASE_ID}-invoice`, invText.pages),
    ).document!;

    const validation = validateInvoiceAgainstEstimate(estDoc, invDoc);
    const analysis = analyzePartRelationCandidates(validation, estDoc, invDoc);

    const structural = analysis.candidates.filter(isStructuralCandidate);
    const leadingA = analysis.candidates.filter((c) => c.relation === 'prefix_variant_candidate');
    const leadingAEstLines = new Set(leadingA.map((c) => c.leftLineId));
    const leadingAInvLines = new Set(leadingA.map((c) => c.rightLineId));
    const unique11 = leadingA.filter((c) => c.status === 'candidate').length;
    const manyToMany = leadingA.filter((c) => c.status === 'ambiguous').length;

    const estimateParts = new Map(
      (estDoc.parts ?? []).map((p) => [
        p.lineId,
        {
          description: p.description?.value,
          quantity: p.quantity?.value,
          unit: p.unit?.value,
        },
      ]),
    );
    const invoiceParts = new Map(
      (invDoc.parts ?? []).map((p) => [
        p.lineId,
        {
          description: p.description?.value,
          quantity: p.quantity?.value,
          unit: p.unit?.value,
        },
      ]),
    );

    const fpReview = reviewFalsePositives(analysis.candidates, estimateParts, invoiceParts);

    const report = {
      caseId: CASE_ID,
      baseline4D: {
        estimatePartLines: estDoc.parts?.length ?? 0,
        invoicePartLines: invDoc.parts?.length ?? 0,
        matched: validation.partMatches.matched.length,
        estimateOnly: validation.partMatches.estimateOnly.length,
        invoiceOnly: validation.partMatches.invoiceOnly.length,
      },
      analysis4E1: {
        totalPairEvaluations: analysis.candidates.length,
        structuralCandidates: structural.length,
        leadingACandidates: leadingA.length,
        highConfidence: analysis.candidates.filter((c) => c.confidence === 'high').length,
        mediumConfidence: analysis.candidates.filter((c) => c.confidence === 'medium').length,
        ambiguous: analysis.counts.ambiguousCandidates,
        unresolved: analysis.counts.unresolvedPairs,
      },
      leadingABreakdown: {
        distinctEstimateLines: leadingAEstLines.size,
        distinctInvoiceLines: leadingAInvLines.size,
        uniqueOneToOne: unique11,
        manyToManyAmbiguous: manyToMany,
      },
      falsePositiveReview: {
        leadingAIncompatibleDescription: fpReview.leadingAIncompatibleDescription ? 'YES' : 'NO',
        leadingAIncompatibleQtyUnit: fpReview.leadingAIncompatibleQtyUnit ? 'YES' : 'NO',
        unrelatedPromotedByPriceOrDescriptionAlone: fpReview.unrelatedPromotedBySecondaryOnly
          ? 'YES'
          : 'NO',
      },
    };

    console.log(JSON.stringify(report, null, 2));
    expect(analysis.candidates.length).toBeGreaterThan(0);
  });
});
