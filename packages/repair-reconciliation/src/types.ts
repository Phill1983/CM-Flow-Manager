import type { Money, SourceRef } from '@cm-flow-manager/repair-domain';

/** delta = invoice − estimate (positive ⇒ invoice more expensive). */
export const DELTA_SIGN_CONVENTION = 'delta = invoice - estimate' as const;

export type ReconciliationWarning = {
  readonly code: string;
  readonly message: string;
  readonly path?: string;
};

export type MoneyAvailability = 'both' | 'estimate_only' | 'invoice_only' | 'unavailable';

export type MoneyComparison = {
  readonly estimate?: Money;
  readonly invoice?: Money;
  readonly delta?: Money;
  readonly availability: MoneyAvailability;
};

export type CategoryComparisonLevel = 'line' | 'category' | 'unresolved';

export type ReconciliationCategory =
  | 'parts'
  | 'labourBody'
  | 'paintLabour'
  | 'paintMaterials'
  | 'normalia'
  | 'additionalCosts'
  | 'other';

export type CategoryDifference = {
  readonly category: ReconciliationCategory;
  readonly level: CategoryComparisonLevel;
  readonly estimateAmount?: Money;
  readonly invoiceAmount?: Money;
  readonly delta?: Money;
  readonly explainedContribution?: Money;
  readonly warnings: readonly string[];
};

export type PartMatchMethod =
  | 'unique_normalized_oem'
  | 'disambiguated_quantity_net'
  | 'disambiguated_quantity'
  | 'ambiguous'
  | 'unmatched';

export type MatchedPartLine = {
  readonly kind: 'matched';
  readonly estimateLineId: string;
  readonly invoiceLineId: string;
  readonly normalizedPartNumber: string;
  readonly matchMethod: Exclude<PartMatchMethod, 'ambiguous' | 'unmatched'>;
  readonly certainty: 'observed' | 'derived';
  readonly lineNetDelta?: Money;
  readonly quantityDelta?: string;
  readonly quantityEffect?: Money;
  readonly priceEffect?: Money;
  readonly estimateSource?: SourceRef;
  readonly invoiceSource?: SourceRef;
};

export type EstimateOnlyPartLine = {
  readonly kind: 'estimate_only';
  readonly estimateLineId: string;
  readonly normalizedPartNumber?: string;
  readonly lineNetContribution?: Money;
  readonly estimateSource?: SourceRef;
};

export type InvoiceOnlyPartLine = {
  readonly kind: 'invoice_only';
  readonly invoiceLineId: string;
  readonly normalizedPartNumber?: string;
  readonly lineNetContribution?: Money;
  readonly invoiceSource?: SourceRef;
};

export type AmbiguousPartMatch = {
  readonly kind: 'ambiguous';
  readonly normalizedPartNumber: string;
  readonly estimateLineIds: readonly string[];
  readonly invoiceLineIds: readonly string[];
  readonly reason: string;
};

export type PartMatchingResult = {
  readonly matched: readonly MatchedPartLine[];
  readonly estimateOnly: readonly EstimateOnlyPartLine[];
  readonly invoiceOnly: readonly InvoiceOnlyPartLine[];
  readonly ambiguous: readonly AmbiguousPartMatch[];
};

export type LabourHoursComparison = {
  readonly status: 'comparable' | 'value_only' | 'unresolved';
  readonly estimateHours?: string;
  readonly invoiceHours?: string;
  readonly hoursDelta?: string;
  readonly reason?: string;
};

export type MatchedLabourLine = {
  readonly kind: 'matched';
  readonly category: string;
  readonly estimateLineId: string;
  readonly invoiceLineId: string;
  readonly matchMethod: 'category_singleton' | 'operation_code_exact';
  readonly lineNetDelta?: Money;
  readonly hours?: LabourHoursComparison;
  readonly estimateSource?: SourceRef;
  readonly invoiceSource?: SourceRef;
};

export type LabourComparisonResult = {
  readonly matched: readonly MatchedLabourLine[];
  readonly estimateOnly: readonly { lineId: string; category?: string; lineNetContribution?: Money }[];
  readonly invoiceOnly: readonly { lineId: string; category?: string; lineNetContribution?: Money }[];
  readonly categoryFallback: readonly CategoryDifference[];
  readonly warnings: readonly string[];
};

export type InvoiceValidationTotals = {
  readonly estimateNet?: Money;
  readonly invoiceNet?: Money;
  readonly netDelta?: Money;
  readonly estimateVat?: Money;
  readonly invoiceVat?: Money;
  readonly vatDelta?: Money;
  readonly estimateGross?: Money;
  readonly invoiceGross?: Money;
  readonly grossDelta?: Money;
  readonly grossFromNetPlusVat?: Money;
  readonly grossConsistencyDelta?: Money;
};

export type InvoiceValidationResult = {
  readonly estimateDocumentId: string;
  readonly invoiceDocumentId: string;
  readonly currency: string;
  readonly signConvention: typeof DELTA_SIGN_CONVENTION;
  readonly partMatches: PartMatchingResult;
  readonly labourComparison: LabourComparisonResult;
  readonly categoryDifferences: readonly CategoryDifference[];
  readonly totals: InvoiceValidationTotals;
  readonly explainedDifference?: Money;
  readonly residual?: Money;
  readonly warnings: readonly ReconciliationWarning[];
};

export type ReconciliationErrorCode =
  | 'wrong_document_type'
  | 'currency_mismatch'
  | 'invalid_document';

export class ReconciliationInputError extends Error {
  readonly code: ReconciliationErrorCode;

  constructor(code: ReconciliationErrorCode, message: string) {
    super(message);
    this.name = 'ReconciliationInputError';
    this.code = code;
  }
}
