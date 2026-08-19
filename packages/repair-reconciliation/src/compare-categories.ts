import {
  addMoney,
  multiplyMoneyByRatio,
  ratioFromPercentMajor,
  subtractMoney,
  absoluteDifference,
  type AdditionalCostLine,
  type CanonicalRepairDocument,
  type MaterialLine,
  type Money,
  type Normalia,
} from '@cm-flow-manager/repair-domain';
import { moneyDelta, sumMoney } from './money-util.js';
import type { CategoryDifference, ReconciliationCategory } from './types.js';

function sumNormaliaAmounts(normalia: readonly Normalia[] | undefined): Money | undefined {
  if (!normalia?.length) return undefined;
  const amounts = normalia
    .map((n) => n.amountNet?.value)
    .filter((m): m is Money => Boolean(m));
  if (amounts.length === 0) return undefined;
  return sumMoney(amounts[0]!.currency, amounts);
}

function sumAdditionalCosts(lines: readonly AdditionalCostLine[] | undefined): Money | undefined {
  if (!lines?.length) return undefined;
  const amounts = lines.map((l) => l.lineNet?.value).filter((m): m is Money => Boolean(m));
  if (amounts.length === 0) return undefined;
  return sumMoney(amounts[0]!.currency, amounts);
}

function sumMaterials(lines: readonly MaterialLine[] | undefined): Money | undefined {
  if (!lines?.length) return undefined;
  const amounts = lines.map((l) => l.lineNet?.value).filter((m): m is Money => Boolean(m));
  if (amounts.length === 0) return undefined;
  return sumMoney(amounts[0]!.currency, amounts);
}

function categoryDiff(
  category: ReconciliationCategory,
  level: CategoryDifference['level'],
  estimate?: Money,
  invoice?: Money,
  warnings: readonly string[] = [],
): CategoryDifference {
  const cmp = moneyDelta(invoice, estimate);
  const resolvedLevel =
    cmp.availability === 'both'
      ? level
      : cmp.availability === 'unavailable'
        ? 'unresolved'
        : 'unresolved';
  return {
    category,
    level: resolvedLevel,
    estimateAmount: cmp.estimate,
    invoiceAmount: cmp.invoice,
    delta: cmp.delta,
    explainedContribution: cmp.delta,
    warnings: [...warnings],
  };
}

export function comparePaintAndMaterials(
  estimate: CanonicalRepairDocument,
  invoice: CanonicalRepairDocument,
): CategoryDifference[] {
  const currency = estimate.currency;
  const estPaintLabour =
    estimate.paint?.paintLabourNet?.value ?? estimate.totals?.paintNet?.value;
  const invPaintLines = (invoice.labour ?? [])
    .filter((l) => (l.category?.value ?? '').toLowerCase() === 'paint')
    .map((l) => l.lineNet?.value)
    .filter((m): m is Money => Boolean(m));
  const invPaintFromLabour = invPaintLines.length ? sumMoney(currency, invPaintLines) : undefined;
  const invPaintLabourAmount = invPaintFromLabour ?? invoice.totals?.paintNet?.value;

  const estPaintMaterials =
    estimate.paint?.paintMaterialsNet?.value ?? estimate.totals?.materialsNet?.value;
  const invPaintMaterials = sumMaterials(invoice.materials) ?? invoice.totals?.materialsNet?.value;

  const out: CategoryDifference[] = [];
  if (estPaintLabour || invPaintLabourAmount) {
    out.push(
      categoryDiff('paintLabour', 'category', estPaintLabour, invPaintLabourAmount, [
        'paint_granularity_may_differ_between_estimate_and_invoice',
      ]),
    );
  }
  if (estPaintMaterials || invPaintMaterials) {
    out.push(
      categoryDiff('paintMaterials', 'category', estPaintMaterials, invPaintMaterials, [
        'paint_materials_compared_at_aggregate_level',
      ]),
    );
  }
  return out;
}

export function compareNormalia(
  estimate: CanonicalRepairDocument,
  invoice: CanonicalRepairDocument,
): CategoryDifference {
  const est = sumNormaliaAmounts(estimate.normalia) ?? estimate.totals?.normaliaNet?.value;
  const inv = sumNormaliaAmounts(invoice.normalia) ?? invoice.totals?.normaliaNet?.value;
  return categoryDiff('normalia', 'category', est, inv);
}

export function compareAdditionalCosts(
  estimate: CanonicalRepairDocument,
  invoice: CanonicalRepairDocument,
): CategoryDifference {
  const est = sumAdditionalCosts(estimate.additionalCosts);
  const inv = sumAdditionalCosts(invoice.additionalCosts);
  const level = est || inv ? 'line' : 'unresolved';
  return categoryDiff('additionalCosts', level, est, inv);
}

export function comparePartsCategory(
  currency: string,
  partContributions: readonly Money[],
  estimatePartsNet?: Money,
  invoicePartsNet?: Money,
): CategoryDifference {
  const fromLines = partContributions.length ? sumMoney(currency, partContributions) : undefined;
  const cmp = moneyDelta(invoicePartsNet, estimatePartsNet);
  const explained = fromLines ?? cmp.delta;
  const warnings: string[] = [];
  if (fromLines && cmp.delta && fromLines.minorUnits !== cmp.delta.minorUnits) {
    warnings.push('line_part_deltas_may_not_equal_category_parts_net');
  }
  return {
    category: 'parts',
    level: fromLines ? 'line' : cmp.availability === 'both' ? 'category' : 'unresolved',
    estimateAmount: cmp.estimate,
    invoiceAmount: cmp.invoice,
    delta: explained ?? cmp.delta,
    explainedContribution: explained,
    warnings,
  };
}

/** Source-consistency diagnostic only — not used in reconciliation formula. */
export function normaliaConsistencyWarning(normalia: Normalia): string | undefined {
  const pct = normalia.percent?.value;
  const base = normalia.calculationBase?.value;
  const amount = normalia.amountNet?.value;
  if (!pct || !base || !amount) return undefined;
  try {
    const expected = multiplyMoneyByRatio(base, ratioFromPercentMajor(pct));
    const diff = absoluteDifference(expected, amount);
    if (diff.minorUnits > 1n) {
      return `normalia_source_inconsistent: expected ${expected.minorUnits} minor vs observed ${amount.minorUnits}`;
    }
  } catch {
    return 'normalia_source_consistency_check_failed';
  }
  return undefined;
}

export function sumExplainedContributions(categories: readonly CategoryDifference[]): Money | undefined {
  const contribs = categories
    .map((c) => c.explainedContribution)
    .filter((m): m is Money => Boolean(m));
  if (contribs.length === 0) return undefined;
  return contribs.reduce((a, b) => addMoney(a, b));
}

export function mergeLabourIntoCategories(
  labourCategories: CategoryDifference[],
  paintAndMaterialCategories: CategoryDifference[],
): CategoryDifference[] {
  const paintLabourFromPaintBlock = paintAndMaterialCategories.find(
    (c) => c.category === 'paintLabour',
  );
  const paintMaterials = paintAndMaterialCategories.filter((c) => c.category === 'paintMaterials');
  const labourWithoutPaint = labourCategories.filter((c) => c.category !== 'paintLabour');
  if (paintLabourFromPaintBlock) {
    return [...labourWithoutPaint, paintLabourFromPaintBlock, ...paintMaterials];
  }
  return [...labourCategories, ...paintMaterials];
}

export function vatComparison(
  estimate: CanonicalRepairDocument,
  invoice: CanonicalRepairDocument,
): { vatDelta?: Money; estimateVat?: Money; invoiceVat?: Money } {
  const est = estimate.totals?.tax?.taxAmount?.value;
  const inv = invoice.totals?.tax?.taxAmount?.value;
  const cmp = moneyDelta(inv, est);
  return { estimateVat: cmp.estimate, invoiceVat: cmp.invoice, vatDelta: cmp.delta };
}

export function grossConsistency(
  netDelta?: Money,
  vatDelta?: Money,
  grossDelta?: Money,
): Money | undefined {
  if (!netDelta || !vatDelta || !grossDelta) return undefined;
  const fromParts = addMoney(netDelta, vatDelta);
  return subtractMoney(grossDelta, fromParts);
}
