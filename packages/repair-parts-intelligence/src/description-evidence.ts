/** Generic tokens that must not alone support a candidate relation. */
const GENERIC_DESCRIPTION_TOKENS = new Set([
  'SENSOR',
  'COVER',
  'DOOR',
  'BOLT',
  'USZCZELKA',
  'DRZWI',
  'SEAL',
  'GASKET',
  'NUT',
  'SCREW',
  'CLIP',
  'BRACKET',
]);

export function normalizeDescriptionText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toUpperCase();
}

function tokenizeDescription(value: string): readonly string[] {
  return normalizeDescriptionText(value)
    .split(/[\s/,-]+/)
    .map((token) => token.replace(/[^0-9A-Z]/g, ''))
    .filter((token) => token.length > 0);
}

export type DescriptionEvidence = {
  readonly exactMatch: boolean;
  readonly overlapTokens: readonly string[];
};

export function collectDescriptionEvidence(
  estimateDescription?: string,
  invoiceDescription?: string,
): DescriptionEvidence {
  if (!estimateDescription || !invoiceDescription) {
    return { exactMatch: false, overlapTokens: [] };
  }

  const left = normalizeDescriptionText(estimateDescription);
  const right = normalizeDescriptionText(invoiceDescription);
  if (left === right) {
    return { exactMatch: true, overlapTokens: tokenizeDescription(left) };
  }

  const leftTokens = tokenizeDescription(left).filter((t) => !GENERIC_DESCRIPTION_TOKENS.has(t));
  const rightTokens = tokenizeDescription(right).filter((t) => !GENERIC_DESCRIPTION_TOKENS.has(t));
  const overlap = leftTokens.filter((token) => rightTokens.includes(token));

  return { exactMatch: false, overlapTokens: overlap };
}

export function hasStrongDescriptionSupport(evidence: DescriptionEvidence): boolean {
  if (evidence.exactMatch) {
    return true;
  }
  return evidence.overlapTokens.length >= 2;
}
