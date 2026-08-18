import {
  isValidDecimalString,
  moneyEquals,
  moneyFromMajorString,
  multiplyMoneyByRatio,
  ratioFromUnitFraction,
  type Money,
} from '@cm-flow-manager/repair-domain';

const NBSP = /[\u00A0\u202F\u2009\u2007]/g;

/**
 * Normalize observed source decimals to a canonical major string (`1234.56`).
 * Does not use IEEE-754 `Number()`. Failed / empty input is `undefined`, never `"0"`.
 */
export function parseDecimalString(raw: string | undefined | null): string | undefined {
  if (raw === undefined || raw === null) return undefined;
  let s = raw.trim().replace(NBSP, ' ');
  if (s.length === 0) return undefined;
  s = s.replace(/\s+/g, '');
  if (s.length === 0) return undefined;

  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (lastComma >= 0) {
    s = s.replace(',', '.');
  }

  if (!isValidDecimalString(s)) return undefined;
  return s;
}

/** Strip a trailing unit token such as `P` / `szt` before parsing a quantity. */
export function parseQuantityString(raw: string | undefined | null): string | undefined {
  if (raw === undefined || raw === null) return undefined;
  const trimmed = raw.trim().replace(NBSP, ' ');
  if (trimmed.length === 0) return undefined;
  const withoutUnit = trimmed.replace(/\s*(P|szt|SZT|jc|JC|rbg|RBG|usl)\s*$/i, '').trim();
  return parseDecimalString(withoutUnit);
}

export function parseSourceMoney(
  currency: string,
  raw: string | undefined | null,
): Money | undefined {
  const major = parseDecimalString(raw);
  if (major === undefined) return undefined;
  try {
    return moneyFromMajorString(currency, major);
  } catch {
    return undefined;
  }
}

/** qty × unitPrice using domain ratios. `undefined` if either side cannot be parsed. */
export function multiplyUnitPriceByQty(
  unitPrice: Money,
  quantityMajor: string,
): Money | undefined {
  if (!isValidDecimalString(quantityMajor)) return undefined;
  try {
    return multiplyMoneyByRatio(unitPrice, ratioFromUnitFraction(quantityMajor, '1'));
  } catch {
    return undefined;
  }
}

export function moneyMatchesProduct(
  unitPrice: Money,
  quantityMajor: string,
  lineNet: Money,
): boolean {
  const product = multiplyUnitPriceByQty(unitPrice, quantityMajor);
  if (!product) return false;
  return moneyEquals(product, lineNet);
}
