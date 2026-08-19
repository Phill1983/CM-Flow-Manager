import { moneyEquals, type Money, type PartLine } from '@cm-flow-manager/repair-domain';

export type SecondaryEvidence = {
  readonly quantityEqual: boolean;
  readonly unitCompatible: boolean;
  readonly lineNetSimilar: boolean;
  readonly unitPriceSimilar: boolean;
};

function unitsCompatible(estimate?: string, invoice?: string): boolean {
  if (!estimate || !invoice) {
    return false;
  }
  return normalizeUnit(estimate) === normalizeUnit(invoice);
}

function normalizeUnit(value: string): string {
  return value.trim().toLowerCase();
}

function moneySimilar(a?: Money, b?: Money): boolean {
  if (!a || !b) {
    return false;
  }
  if (!moneyEquals(a, b)) {
    return false;
  }
  return true;
}

function unitPricesSimilar(estimate: PartLine, invoice: PartLine): boolean {
  const estPrice = estimate.unitNetPrice?.value ?? estimate.basePrice?.value;
  const invPrice = invoice.unitNetPrice?.value ?? invoice.basePrice?.value;
  if (!estPrice || !invPrice) {
    return false;
  }
  return moneyEquals(estPrice, invPrice);
}

export function collectSecondaryEvidence(
  estimateLine: PartLine,
  invoiceLine: PartLine,
): SecondaryEvidence {
  const estQty = estimateLine.quantity?.value;
  const invQty = invoiceLine.quantity?.value;

  return {
    quantityEqual: Boolean(estQty && invQty && estQty === invQty),
    unitCompatible: unitsCompatible(estimateLine.unit?.value, invoiceLine.unit?.value),
    lineNetSimilar: moneySimilar(estimateLine.lineNet?.value, invoiceLine.lineNet?.value),
    unitPriceSimilar: unitPricesSimilar(estimateLine, invoiceLine),
  };
}

export function hasMeaningfulSecondarySupport(
  secondary: SecondaryEvidence,
  descriptionStrong: boolean,
): boolean {
  return (
    descriptionStrong ||
    secondary.quantityEqual ||
    secondary.unitCompatible ||
    secondary.lineNetSimilar ||
    secondary.unitPriceSimilar
  );
}
