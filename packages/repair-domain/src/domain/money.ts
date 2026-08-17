/**
 * Decimal-safe money: integer minor units (grosz for PLN).
 * Never use IEEE-754 number as the canonical monetary store.
 */

export type CurrencyCode = string;

export type Money = {
  readonly currency: CurrencyCode;
  /** Integer minor units (PLN → grosz). */
  readonly minorUnits: bigint;
};

export type DecimalRatio = {
  readonly numerator: bigint;
  readonly denominator: bigint;
};

export type RoundingMode = 'half-up';

const DECIMAL_RE = /^-?\d+(\.\d+)?$/;

export function isValidDecimalString(value: string): boolean {
  return DECIMAL_RE.test(value.trim());
}

export function assertValidRatio(ratio: DecimalRatio): void {
  if (ratio.denominator === 0n) {
    throw new Error('DecimalRatio denominator must be non-zero');
  }
}

export function ratioFromPercentMajor(percent: string): DecimalRatio {
  // "23" → 23/100; "2.0" → 20/1000 → reduce; "0.23" not used here
  const trimmed = percent.trim().replace('%', '');
  if (!isValidDecimalString(trimmed)) {
    throw new Error(`Invalid percent: ${percent}`);
  }
  const [whole, frac = ''] = trimmed.split('.');
  const scale = BigInt(frac.length);
  const den = 100n * 10n ** scale;
  const num = BigInt(whole + frac);
  return reduceRatio({ numerator: num, denominator: den });
}

export function ratioFromUnitFraction(numerator: string, denominator: string): DecimalRatio {
  if (!isValidDecimalString(numerator) || !isValidDecimalString(denominator)) {
    throw new Error('Invalid ratio components');
  }
  const n = parseDecimalToScaledInteger(numerator);
  const d = parseDecimalToScaledInteger(denominator);
  // align scales
  const scaleDiff = n.scale - d.scale;
  let num = n.value;
  let den = d.value;
  if (scaleDiff > 0) den *= 10n ** BigInt(scaleDiff);
  if (scaleDiff < 0) num *= 10n ** BigInt(-scaleDiff);
  if (den === 0n) throw new Error('Denominator is zero');
  return reduceRatio({ numerator: num, denominator: den });
}

function reduceRatio(ratio: DecimalRatio): DecimalRatio {
  const g = gcd(abs(ratio.numerator), abs(ratio.denominator));
  let numerator = ratio.numerator / g;
  let denominator = ratio.denominator / g;
  if (denominator < 0n) {
    numerator = -numerator;
    denominator = -denominator;
  }
  return { numerator, denominator };
}

function gcd(a: bigint, b: bigint): bigint {
  let x = a;
  let y = b;
  while (y !== 0n) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

function abs(n: bigint): bigint {
  return n < 0n ? -n : n;
}

function parseDecimalToScaledInteger(raw: string): { value: bigint; scale: number } {
  const trimmed = raw.trim();
  const negative = trimmed.startsWith('-');
  const body = negative ? trimmed.slice(1) : trimmed;
  const [whole, frac = ''] = body.split('.');
  const value = BigInt(whole + frac) * (negative ? -1n : 1n);
  return { value, scale: frac.length };
}

/** Parse major-unit decimal string into Money (default scale 2). */
export function moneyFromMajorString(
  currency: CurrencyCode,
  major: string,
  scale = 2,
): Money {
  if (!isValidDecimalString(major)) {
    throw new Error(`Invalid money major string: ${major}`);
  }
  if (!Number.isInteger(scale) || scale < 0) {
    throw new Error('Money scale must be a non-negative integer');
  }
  const { value, scale: srcScale } = parseDecimalToScaledInteger(major.trim());
  let minor = value;
  if (srcScale < scale) minor *= 10n ** BigInt(scale - srcScale);
  if (srcScale > scale) {
    // truncate excess only if trailing zeros; else reject for canonical construction
    const factor = 10n ** BigInt(srcScale - scale);
    if (value % factor !== 0n) {
      throw new Error(`Money major string has more than ${scale} decimal places: ${major}`);
    }
    minor = value / factor;
  }
  return { currency, minorUnits: minor };
}

export function moneyToMajorString(money: Money, scale = 2): string {
  const negative = money.minorUnits < 0n;
  const absMinor = abs(money.minorUnits);
  const factor = 10n ** BigInt(scale);
  const whole = absMinor / factor;
  const frac = absMinor % factor;
  const fracStr = frac.toString().padStart(scale, '0');
  const body = scale === 0 ? whole.toString() : `${whole.toString()}.${fracStr}`;
  return negative ? `-${body}` : body;
}

export function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
}

export function addMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { currency: a.currency, minorUnits: a.minorUnits + b.minorUnits };
}

export function subtractMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { currency: a.currency, minorUnits: a.minorUnits - b.minorUnits };
}

export function negateMoney(money: Money): Money {
  return { currency: money.currency, minorUnits: -money.minorUnits };
}

/** Multiply money by a ratio with half-up rounding to minor units. */
export function multiplyMoneyByRatio(
  money: Money,
  ratio: DecimalRatio,
  _mode: RoundingMode = 'half-up',
): Money {
  assertValidRatio(ratio);
  const prod = money.minorUnits * ratio.numerator;
  const den = ratio.denominator;
  const negative = prod < 0n;
  const absProd = abs(prod);
  const absDen = abs(den);
  const q = absProd / absDen;
  const r = absProd % absDen;
  const rounded = r * 2n >= absDen ? q + 1n : q;
  return {
    currency: money.currency,
    minorUnits: negative ? -rounded : rounded,
  };
}

export function isValidMoney(money: Money): boolean {
  return (
    typeof money.currency === 'string' &&
    money.currency.length > 0 &&
    typeof money.minorUnits === 'bigint'
  );
}

export function moneyEquals(a: Money, b: Money): boolean {
  return a.currency === b.currency && a.minorUnits === b.minorUnits;
}

/** -1 if a < b, 0 if equal, 1 if a > b. Throws on currency mismatch. */
export function compareMoney(a: Money, b: Money): -1 | 0 | 1 {
  assertSameCurrency(a, b);
  if (a.minorUnits < b.minorUnits) return -1;
  if (a.minorUnits > b.minorUnits) return 1;
  return 0;
}

export function absMoney(money: Money): Money {
  return {
    currency: money.currency,
    minorUnits: money.minorUnits < 0n ? -money.minorUnits : money.minorUnits,
  };
}

export function absoluteDifference(a: Money, b: Money): Money {
  return absMoney(subtractMoney(a, b));
}

/** JSON-safe money. bigint cannot round-trip through JSON.stringify. */
export type SerializedMoney = {
  readonly currency: CurrencyCode;
  readonly minorUnits: string;
};

export function serializeMoney(money: Money): SerializedMoney {
  return { currency: money.currency, minorUnits: money.minorUnits.toString() };
}

export function deserializeMoney(serialized: SerializedMoney): Money {
  if (!serialized.currency) {
    throw new Error('Serialized money requires currency');
  }
  if (!/^-?\d+$/.test(serialized.minorUnits)) {
    throw new Error(`Invalid serialized minorUnits: ${serialized.minorUnits}`);
  }
  return { currency: serialized.currency, minorUnits: BigInt(serialized.minorUnits) };
}

/** JSON.stringify replacer: bigint → decimal integer string. */
export function canonicalJsonReplacer(_key: string, value: unknown): unknown {
  return typeof value === 'bigint' ? value.toString() : value;
}
