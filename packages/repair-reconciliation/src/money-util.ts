import {
  addMoney,
  isValidDecimalString,
  moneyFromMajorString,
  multiplyMoneyByRatio,
  ratioFromUnitFraction,
  subtractMoney,
  type Money,
} from '@cm-flow-manager/repair-domain';
import type { MoneyAvailability, MoneyComparison } from './types.js';

/** invoice − estimate when both exist. Missing values stay undefined — never coerced to zero. */
export function moneyDelta(invoice?: Money, estimate?: Money): MoneyComparison {
  if (!invoice && !estimate) {
    return { availability: 'unavailable' };
  }
  if (invoice && !estimate) {
    return { invoice, availability: 'invoice_only' };
  }
  if (!invoice && estimate) {
    return { estimate, availability: 'estimate_only' };
  }
  return {
    invoice,
    estimate,
    delta: subtractMoney(invoice!, estimate!),
    availability: 'both',
  };
}

export function sumMoney(currency: string, values: readonly Money[]): Money | undefined {
  if (values.length === 0) return undefined;
  return values.reduce((acc, m) => addMoney(acc, m));
}

export function multiplyMoneyByQuantity(unitPrice: Money, quantityMajor: string): Money | undefined {
  if (!isValidDecimalString(quantityMajor)) return undefined;
  try {
    return multiplyMoneyByRatio(unitPrice, ratioFromUnitFraction(quantityMajor, '1'));
  } catch {
    return undefined;
  }
}

/**
 * quantityEffect = (invoiceQty − estimateQty) × estimateUnitPrice
 * priceEffect    = invoiceQty × (invoiceUnitPrice − estimateUnitPrice)
 */
export function decomposePartLineDelta(input: {
  currency: string;
  estimateQty?: string;
  invoiceQty?: string;
  estimateUnit?: Money;
  invoiceUnit?: Money;
  lineNetDelta?: Money;
}): { quantityEffect?: Money; priceEffect?: Money } {
  const { estimateQty, invoiceQty, estimateUnit, invoiceUnit } = input;
  if (!estimateQty || !invoiceQty || !estimateUnit || !invoiceUnit) {
    return {};
  }
  if (
    !isValidDecimalString(estimateQty) ||
    !isValidDecimalString(invoiceQty)
  ) {
    return {};
  }

  const qtyDiff = subtractDecimalStrings(invoiceQty, estimateQty);
  if (qtyDiff === undefined) return {};

  const qtyEffect = multiplyMoneyByQuantity(estimateUnit, qtyDiff);
  const unitDiff = subtractMoney(invoiceUnit, estimateUnit);
  const priceEffect = multiplyMoneyByQuantity(unitDiff, invoiceQty);

  if (qtyEffect && priceEffect && input.lineNetDelta) {
    const recomposed = addMoney(qtyEffect, priceEffect);
    if (recomposed.minorUnits !== input.lineNetDelta.minorUnits) {
      return {};
    }
  }

  return { quantityEffect: qtyEffect, priceEffect };
}

export function subtractDecimalStrings(a: string, b: string): string | undefined {
  if (!isValidDecimalString(a) || !isValidDecimalString(b)) return undefined;
  const scale = Math.max(decimalPlaces(a), decimalPlaces(b));
  const ai = toScaledInt(a, scale);
  const bi = toScaledInt(b, scale);
  if (ai === null || bi === null) return undefined;
  const diff = ai - bi;
  return fromScaledInt(diff, scale);
}

function decimalPlaces(value: string): number {
  const idx = value.indexOf('.');
  return idx < 0 ? 0 : value.length - idx - 1;
}

function toScaledInt(value: string, scale: number): bigint | null {
  const trimmed = value.trim();
  const negative = trimmed.startsWith('-');
  const body = negative ? trimmed.slice(1) : trimmed;
  const [wholePart, frac = ''] = body.split('.');
  const whole = wholePart ?? '';
  if (!/^\d+$/.test(whole) || (frac && !/^\d+$/.test(frac))) return null;
  const padded = (frac + '0'.repeat(scale)).slice(0, scale);
  const combined = BigInt(whole + padded);
  return negative ? -combined : combined;
}

function fromScaledInt(value: bigint, scale: number): string {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const s = abs.toString().padStart(scale + 1, '0');
  if (scale === 0) return negative ? `-${s}` : s;
  const whole = s.slice(0, -scale) || '0';
  const frac = s.slice(-scale).replace(/0+$/, '');
  const body = frac.length > 0 ? `${whole}.${frac}` : whole;
  return negative ? `-${body}` : body;
}

export function zeroMoney(currency: string): Money {
  return moneyFromMajorString(currency, '0');
}

export function availabilityFromComparison(c: MoneyComparison): MoneyAvailability {
  return c.availability;
}
