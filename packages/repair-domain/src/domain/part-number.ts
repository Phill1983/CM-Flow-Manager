import type { NormalizationStatus } from './types.js';

/**
 * Deterministic part-number normalization contract only.
 * Does NOT declare A-prefix / superseded / aftermarket equivalence.
 */
export type PartNumberNormalization = {
  readonly rawPartNumber: string;
  readonly normalizedPartNumber: string;
  readonly normalizationSteps: readonly string[];
  readonly status: NormalizationStatus;
};

/** Whitespace collapse + uppercase. Separators preserved in raw; stripped in normalized. */
export function normalizePartNumberDeterministic(raw: string): PartNumberNormalization {
  const steps: string[] = [];
  let current = raw;
  const trimmed = current.trim();
  if (trimmed !== current) {
    steps.push('trim');
    current = trimmed;
  }
  const collapsed = current.replace(/\s+/g, '');
  if (collapsed !== current) {
    steps.push('remove_whitespace');
    current = collapsed;
  }
  const noSep = current.replace(/[-_.]/g, '');
  if (noSep !== current) {
    steps.push('remove_formatting_separators');
    current = noSep;
  }
  const upper = current.toUpperCase();
  if (upper !== current) {
    steps.push('uppercase');
    current = upper;
  }
  return {
    rawPartNumber: raw,
    normalizedPartNumber: current,
    normalizationSteps: steps,
    status: current.length === 0 ? 'invalid' : steps.length === 0 ? 'raw' : 'normalized',
  };
}
