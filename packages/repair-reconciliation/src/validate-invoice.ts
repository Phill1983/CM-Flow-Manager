import {
  addMoney,
  isCanonicalRepairDocument,
  subtractMoney,
  validateRepairDocument,
  type CanonicalRepairDocument,
} from '@cm-flow-manager/repair-domain';
import {
  compareAdditionalCosts,
  compareNormalia,
  comparePaintAndMaterials,
  comparePartsCategory,
  grossConsistency,
  normaliaConsistencyWarning,
  sumExplainedContributions,
  vatComparison,
} from './compare-categories.js';
import { compareLabour, labourCategoryDifferences } from './compare-labour.js';
import { matchParts, partsExplainedContribution } from './match-parts.js';
import { moneyDelta } from './money-util.js';
import {
  DELTA_SIGN_CONVENTION,
  ReconciliationInputError,
  type InvoiceValidationOptions,
  type InvoiceValidationResult,
  type ReconciliationWarning,
} from './types.js';

function assertInput(estimate: CanonicalRepairDocument, invoice: CanonicalRepairDocument): void {
  if (!isCanonicalRepairDocument(estimate)) {
    throw new ReconciliationInputError('invalid_document', 'Estimate is not a canonical repair document.');
  }
  if (!isCanonicalRepairDocument(invoice)) {
    throw new ReconciliationInputError('invalid_document', 'Invoice is not a canonical repair document.');
  }
  if (estimate.source.documentType !== 'estimate') {
    throw new ReconciliationInputError(
      'wrong_document_type',
      `Expected estimate documentType; got ${estimate.source.documentType}.`,
    );
  }
  if (invoice.source.documentType !== 'invoice') {
    throw new ReconciliationInputError(
      'wrong_document_type',
      `Expected invoice documentType; got ${invoice.source.documentType}.`,
    );
  }
  if (estimate.currency !== invoice.currency) {
    throw new ReconciliationInputError(
      'currency_mismatch',
      `Currency mismatch: estimate ${estimate.currency} vs invoice ${invoice.currency}.`,
    );
  }

  const estVal = validateRepairDocument(estimate);
  const invVal = validateRepairDocument(invoice);
  if (!estVal.ok || !invVal.ok) {
    throw new ReconciliationInputError(
      'invalid_document',
      'One or both documents failed canonical validation.',
    );
  }
}

/**
 * Process B — deterministic invoice validation against an approved estimate.
 * Sign convention: delta = invoice − estimate (positive ⇒ invoice more expensive).
 * Invariant: netDelta = explainedDifference + residual (residual never forced to zero).
 */
export function validateInvoiceAgainstEstimate(
  estimate: CanonicalRepairDocument,
  invoice: CanonicalRepairDocument,
  options?: InvoiceValidationOptions,
): InvoiceValidationResult {
  assertInput(estimate, invoice);

  const currency = estimate.currency;
  const warnings: ReconciliationWarning[] = [];

  const partMatches = matchParts(currency, estimate.parts ?? [], invoice.parts ?? [], {
    humanConfirmedOverrides: options?.confirmedPartRelations,
  });
  if (partMatches.overrideWarnings?.length) {
    for (const message of partMatches.overrideWarnings) {
      warnings.push({ code: 'human_override_invalid', message });
    }
  }
  const partContribs = partsExplainedContribution(partMatches);
  const partsCategory = comparePartsCategory(
    currency,
    partContribs,
    estimate.totals?.partsNet?.value,
    invoice.totals?.partsNet?.value,
  );

  const labourComparison = compareLabour(
    currency,
    estimate.labour ?? [],
    invoice.labour ?? [],
    estimate.totals?.labourNet?.value,
    invoice.totals?.labourNet?.value,
  );
  const labourCategories = labourCategoryDifferences(labourComparison);

  const paintAndMaterials = comparePaintAndMaterials(estimate, invoice);
  const normaliaCategory = compareNormalia(estimate, invoice);
  const additionalCategory = compareAdditionalCosts(estimate, invoice);

  for (const n of estimate.normalia ?? []) {
    const w = normaliaConsistencyWarning(n);
    if (w) {
      warnings.push({ code: 'normalia_source_inconsistent', message: w });
    }
  }

  const labourBody = labourCategories.filter((c) => c.category === 'labourBody');
  const paintLabourFromLabour = labourCategories.filter((c) => c.category === 'paintLabour');
  const paintLabourFromPaint = paintAndMaterials.filter((c) => c.category === 'paintLabour');
  const paintMaterials = paintAndMaterials.filter((c) => c.category === 'paintMaterials');

  const paintLabour =
    paintLabourFromLabour.length > 0 ? paintLabourFromLabour : paintLabourFromPaint;

  const categoryDifferences = [
    partsCategory,
    ...labourBody,
    ...paintLabour,
    ...paintMaterials,
    normaliaCategory,
    additionalCategory,
  ].filter(
    (c) =>
      c.explainedContribution !== undefined ||
      c.delta !== undefined ||
      c.estimateAmount !== undefined ||
      c.invoiceAmount !== undefined,
  );

  const explainedDifference = sumExplainedContributions(categoryDifferences);

  const netCmp = moneyDelta(invoice.totals?.totalNet?.value, estimate.totals?.totalNet?.value);
  const vat = vatComparison(estimate, invoice);
  const grossCmp = moneyDelta(invoice.totals?.totalGross?.value, estimate.totals?.totalGross?.value);

  let residual = netCmp.delta;
  if (residual && explainedDifference) {
    residual = subtractMoney(residual, explainedDifference);
  }

  const grossConsistencyDelta = grossConsistency(netCmp.delta, vat.vatDelta, grossCmp.delta);
  if (grossConsistencyDelta && grossConsistencyDelta.minorUnits !== 0n) {
    warnings.push({
      code: 'gross_net_vat_rounding_discrepancy',
      message: `grossDelta differs from netDelta+vatDelta by ${grossConsistencyDelta.minorUnits} minor units`,
    });
  }

  if (partMatches.ambiguous.length > 0) {
    warnings.push({
      code: 'ambiguous_part_matches',
      message: `${partMatches.ambiguous.length} duplicate OEM group(s) could not be disambiguated deterministically.`,
    });
  }

  for (const w of labourComparison.warnings) {
    warnings.push({ code: 'labour_comparison', message: w });
  }

  return {
    estimateDocumentId: estimate.source.documentId,
    invoiceDocumentId: invoice.source.documentId,
    currency,
    signConvention: DELTA_SIGN_CONVENTION,
    partMatches,
    labourComparison,
    categoryDifferences,
    totals: {
      estimateNet: netCmp.estimate,
      invoiceNet: netCmp.invoice,
      netDelta: netCmp.delta,
      estimateVat: vat.estimateVat,
      invoiceVat: vat.invoiceVat,
      vatDelta: vat.vatDelta,
      estimateGross: grossCmp.estimate,
      invoiceGross: grossCmp.invoice,
      grossDelta: grossCmp.delta,
      grossFromNetPlusVat:
        netCmp.delta && vat.vatDelta ? addMoney(netCmp.delta, vat.vatDelta) : undefined,
      grossConsistencyDelta,
    },
    explainedDifference,
    residual,
    warnings,
  };
}

export { ReconciliationInputError };
