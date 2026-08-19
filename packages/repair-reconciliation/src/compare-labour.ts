import {
  subtractMoney,
  type LabourLine,
  type Money,
} from '@cm-flow-manager/repair-domain';
import { moneyDelta, subtractDecimalStrings, sumMoney } from './money-util.js';
import type {
  CategoryDifference,
  LabourComparisonResult,
  LabourHoursComparison,
  MatchedLabourLine,
} from './types.js';

function categoryOf(line: LabourLine): string {
  return line.category?.value?.toLowerCase() ?? 'unknown';
}

function isLumpUsł(line: LabourLine): boolean {
  const unit = line.sourceUnit?.value?.toLowerCase() ?? '';
  return line.presentation === 'lump' || unit === 'usl' || unit === 'usł';
}

function hoursComparison(est: LabourLine, inv: LabourLine): LabourHoursComparison {
  if (isLumpUsł(inv) || isLumpUsł(est)) {
    return {
      status: 'value_only',
      reason: 'lump_usl_presentation_without_comparable_hours',
    };
  }
  const eh = est.normalizedHours;
  const ih = inv.normalizedHours;
  if (eh?.status === 'resolved' && ih?.status === 'resolved' && eh.hours && ih.hours) {
    return {
      status: 'comparable',
      estimateHours: eh.hours,
      invoiceHours: ih.hours,
      hoursDelta: subtractDecimalStrings(ih.hours, eh.hours),
    };
  }
  return {
    status: 'unresolved',
    reason: eh?.reason ?? ih?.reason ?? 'hours_not_resolved_on_one_or_both_sides',
  };
}

function matchByCategorySingleton(
  estLines: LabourLine[],
  invLines: LabourLine[],
): MatchedLabourLine[] {
  const group = (lines: LabourLine[]) => {
    const map = new Map<string, LabourLine[]>();
    for (const l of lines) {
      const c = categoryOf(l);
      const bucket = map.get(c) ?? [];
      bucket.push(l);
      map.set(c, bucket);
    }
    return map;
  };
  const estMap = group(estLines);
  const invMap = group(invLines);
  const matched: MatchedLabourLine[] = [];
  for (const [cat, estBucket] of estMap) {
    const invBucket = invMap.get(cat) ?? [];
    if (estBucket.length !== 1 || invBucket.length !== 1) continue;
    const est = estBucket[0]!;
    const inv = invBucket[0]!;
    const en = est.lineNet?.value;
    const inn = inv.lineNet?.value;
    matched.push({
      kind: 'matched',
      category: cat,
      estimateLineId: est.lineId,
      invoiceLineId: inv.lineId,
      matchMethod: 'category_singleton',
      lineNetDelta: en && inn ? subtractMoney(inn, en) : undefined,
      hours: hoursComparison(est, inv),
      estimateSource: est.source,
      invoiceSource: inv.source,
    });
  }
  return matched;
}

function sumCategoryLineNet(lines: readonly LabourLine[], category: string): Money | undefined {
  const nets = lines
    .filter((l) => categoryOf(l) === category)
    .map((l) => l.lineNet?.value)
    .filter((m): m is Money => Boolean(m));
  return sumMoney(nets[0]?.currency ?? 'PLN', nets);
}

export function compareLabour(
  currency: string,
  estimateLabour: readonly LabourLine[],
  invoiceLabour: readonly LabourLine[],
  estimateTotalsLabourNet?: Money,
  invoiceTotalsLabourNet?: Money,
): LabourComparisonResult {
  const matched = matchByCategorySingleton([...estimateLabour], [...invoiceLabour]);
  const matchedEstIds = new Set(matched.map((m) => m.estimateLineId));
  const matchedInvIds = new Set(matched.map((m) => m.invoiceLineId));

  const estimateOnly = estimateLabour
    .filter((l) => !matchedEstIds.has(l.lineId))
    .map((l) => ({
      lineId: l.lineId,
      category: categoryOf(l),
      lineNetContribution: l.lineNet?.value
        ? { ...l.lineNet.value, minorUnits: -l.lineNet.value.minorUnits }
        : undefined,
    }));

  const invoiceOnly = invoiceLabour
    .filter((l) => !matchedInvIds.has(l.lineId))
    .map((l) => ({
      lineId: l.lineId,
      category: categoryOf(l),
      lineNetContribution: l.lineNet?.value,
    }));

  const categoryFallback: CategoryDifference[] = [];
  const warnings: string[] = [];

  if (estimateLabour.some(isLumpUsł) || invoiceLabour.some(isLumpUsł)) {
    warnings.push('lump_usl_labour_present_value_only_hours');
  }

  const categories = new Set([
    ...estimateLabour.map(categoryOf),
    ...invoiceLabour.map(categoryOf),
  ]);

  for (const cat of categories) {
    const catMatched = matched.filter((m) => m.category === cat);
    if (catMatched.length > 0) continue;

    const estAmt =
      sumCategoryLineNet(estimateLabour, cat) ??
      (cat === 'body' ? estimateTotalsLabourNet : undefined);
    const invAmt =
      sumCategoryLineNet(invoiceLabour, cat) ??
      (cat === 'body' ? invoiceTotalsLabourNet : undefined);
    if (!estAmt && !invAmt) continue;

    const reconCategory = cat === 'paint' ? 'paintLabour' : cat === 'body' ? 'labourBody' : 'other';
    const cmp = moneyDelta(invAmt, estAmt);
    categoryFallback.push({
      category: reconCategory,
      level: cmp.availability === 'both' ? 'category' : 'unresolved',
      estimateAmount: cmp.estimate,
      invoiceAmount: cmp.invoice,
      delta: cmp.delta,
      explainedContribution: cmp.delta,
      warnings: ['category_level_labour_fallback'],
    });
  }

  return { matched, estimateOnly, invoiceOnly, categoryFallback, warnings };
}

export function labourCategoryDifferences(result: LabourComparisonResult): CategoryDifference[] {
  const out: CategoryDifference[] = [];
  const categories = new Set(result.matched.map((m) => m.category));

  for (const cat of categories) {
    const lines = result.matched.filter((m) => m.category === cat);
    const deltas = lines.map((m) => m.lineNetDelta).filter((d): d is Money => Boolean(d));
    const delta = deltas.length ? sumMoney(deltas[0]!.currency, deltas) : undefined;
    const reconCategory = cat === 'paint' ? 'paintLabour' : cat === 'body' ? 'labourBody' : 'other';
    out.push({
      category: reconCategory,
      level: 'line',
      delta,
      explainedContribution: delta,
      warnings: cat === 'body' ? result.warnings : [],
    });
  }

  for (const fb of result.categoryFallback) {
    if (!out.some((c) => c.category === fb.category)) {
      out.push(fb);
    }
  }

  return out;
}
