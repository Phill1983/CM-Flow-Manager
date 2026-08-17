import type { DecimalRatio, Money } from './money.js';
import type { SourceRef, SourceValue } from './source.js';
import type { Certainty, LabourUnit, NormalizationStatus } from './types.js';

/**
 * Document-local labour unit conversion.
 * NEVER hardcode 10 JC = 1 RBG or 12 JC = 1 RBG globally.
 * Parser must supply conversion from the source document.
 */
export type LabourUnitConversion = {
  readonly sourceUnit: LabourUnit;
  readonly targetUnit: LabourUnit;
  /** e.g. 10 JC per 1 RBG → numerator 10, denominator 1. Always document-local. */
  readonly sourceUnitsPerTargetUnit: DecimalRatio;
  readonly source?: SourceRef;
  readonly certainty: Certainty;
};

export type LabourPresentation = 'detail' | 'lump' | 'unknown';

export type NormalizedLabourHours = {
  readonly status: 'resolved' | 'unresolved';
  /** Decimal major-hours string when resolved, e.g. "6.60" */
  readonly hours?: string;
  readonly conversionUsed?: LabourUnitConversion;
  readonly reason?: string;
};

export type LabourLine = {
  readonly lineId: string;
  readonly operationCode?: SourceValue<string>;
  readonly description?: SourceValue<string>;
  readonly category?: SourceValue<string>;
  /** Quantity in source units (JC, RBG, usl, …). */
  readonly quantity?: SourceValue<string>;
  readonly sourceUnit?: SourceValue<string>;
  readonly rate?: SourceValue<Money>;
  readonly lineNet?: SourceValue<Money>;
  readonly presentation: LabourPresentation;
  readonly normalizedHours?: NormalizedLabourHours;
  readonly normalizationStatus?: NormalizationStatus;
  readonly source?: SourceRef;
};

/**
 * Convert quantity in source units to target hours using document-local conversion.
 * Does not guess a conversion when missing or mismatched.
 */
export function resolveLabourHours(input: {
  quantityMajor: string;
  sourceUnit: LabourUnit | string;
  conversion?: LabourUnitConversion;
}): NormalizedLabourHours {
  const conversion = input.conversion;
  if (!conversion) {
    return {
      status: 'unresolved',
      reason: 'labour_unit_conversion_unavailable',
    };
  }
  if (conversion.sourceUnit.toUpperCase() !== input.sourceUnit.toUpperCase()) {
    return {
      status: 'unresolved',
      reason: 'source_unit_mismatch',
      conversionUsed: conversion,
    };
  }
  if (conversion.sourceUnitsPerTargetUnit.denominator === 0n) {
    return {
      status: 'unresolved',
      reason: 'invalid_conversion_denominator',
      conversionUsed: conversion,
    };
  }
  if (conversion.sourceUnitsPerTargetUnit.numerator <= 0n) {
    return {
      status: 'unresolved',
      reason: 'invalid_conversion_numerator',
      conversionUsed: conversion,
    };
  }

  // hours = quantity / (sourceUnitsPerTargetUnit)
  // = quantity * den / num
  const q = parseMajorToRational(input.quantityMajor);
  if (!q) {
    return {
      status: 'unresolved',
      reason: 'invalid_quantity',
      conversionUsed: conversion,
    };
  }
  const num = q.numerator * conversion.sourceUnitsPerTargetUnit.denominator;
  const den = q.denominator * conversion.sourceUnitsPerTargetUnit.numerator;
  const hours = formatRationalAsDecimal(num, den, 4);
  return {
    status: 'resolved',
    hours,
    conversionUsed: conversion,
  };
}

function parseMajorToRational(
  major: string,
): { numerator: bigint; denominator: bigint } | null {
  const trimmed = major.trim();
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return null;
  const negative = trimmed.startsWith('-');
  const body = negative ? trimmed.slice(1) : trimmed;
  const [whole, frac = ''] = body.split('.');
  const numerator = BigInt(whole + frac) * (negative ? -1n : 1n);
  const denominator = 10n ** BigInt(frac.length);
  return { numerator, denominator };
}

function formatRationalAsDecimal(num: bigint, den: bigint, maxScale: number): string {
  if (den === 0n) throw new Error('zero denominator');
  const negative = num < 0n !== den < 0n;
  const n = num < 0n ? -num : num;
  const d = den < 0n ? -den : den;
  const whole = n / d;
  let rem = n % d;
  let frac = '';
  for (let i = 0; i < maxScale && rem !== 0n; i += 1) {
    rem *= 10n;
    frac += (rem / d).toString();
    rem = rem % d;
  }
  // trim trailing zeros
  frac = frac.replace(/0+$/, '');
  const body = frac.length === 0 ? whole.toString() : `${whole.toString()}.${frac}`;
  return negative ? `-${body}` : body;
}
