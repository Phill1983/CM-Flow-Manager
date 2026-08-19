/**
 * Observed Mercedes-style leading `A` prefix rule (4E.1 only).
 * Does NOT generalize to other manufacturer prefixes.
 */
export type LeadingAPrefixMatch = {
  readonly side: 'estimate' | 'invoice';
  readonly core: string;
  readonly removed: 'A';
};

/** Remove exactly one leading `A` when remainder is a non-empty alphanumeric core. */
export function tryLeadingAPrefixCore(normalized: string): LeadingAPrefixMatch | null {
  if (!normalized.startsWith('A') || normalized.length <= 1) {
    return null;
  }
  const core = normalized.slice(1);
  if (core.length === 0 || !/^[0-9A-Z]+$/.test(core)) {
    return null;
  }
  return { side: 'invoice', core, removed: 'A' };
}

export function evaluateLeadingAPrefixRelation(
  estimateNormalized: string,
  invoiceNormalized: string,
): { core: string; removedSide: 'estimate' | 'invoice' } | null {
  const invoiceStripped = tryLeadingAPrefixCore(invoiceNormalized);
  if (invoiceStripped && invoiceStripped.core === estimateNormalized) {
    return { core: estimateNormalized, removedSide: 'invoice' };
  }

  const estimateStripped = tryLeadingAPrefixCore(estimateNormalized);
  if (estimateStripped && estimateStripped.core === invoiceNormalized) {
    return { core: invoiceNormalized, removedSide: 'estimate' };
  }

  return null;
}
