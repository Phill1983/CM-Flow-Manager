import {
  normalizePartNumberDeterministic,
  subtractMoney,
  type Money,
  type PartLine,
} from '@cm-flow-manager/repair-domain';
import { decomposePartLineDelta, subtractDecimalStrings } from './money-util.js';
import type {
  AmbiguousPartMatch,
  EstimateOnlyPartLine,
  HumanConfirmedPartOverride,
  InvoiceOnlyPartLine,
  MatchedPartLine,
  PartMatchingResult,
} from './types.js';

function normalizedKey(line: PartLine): string | undefined {
  const fromNorm = line.partNumberNormalization?.normalizedPartNumber;
  if (fromNorm) return fromNorm;
  const raw = line.rawPartNumber?.value;
  if (!raw) return undefined;
  return normalizePartNumberDeterministic(raw).normalizedPartNumber;
}

function scorePair(est: PartLine, inv: PartLine): number {
  let score = 0;
  const eq = est.quantity?.value;
  const iq = inv.quantity?.value;
  if (eq && iq && eq === iq) score += 2;
  const en = est.lineNet?.value;
  const inn = inv.lineNet?.value;
  if (en && inn && en.minorUnits === inn.minorUnits) score += 2;
  const eu = est.unitNetPrice?.value;
  const iu = inv.unitNetPrice?.value;
  if (eu && iu && eu.minorUnits === iu.minorUnits) score += 1;
  const ed = est.description?.value?.trim().toUpperCase();
  const id = inv.description?.value?.trim().toUpperCase();
  if (ed && id && ed === id) score += 1;
  return score;
}

export function matchParts(
  currency: string,
  estimateParts: readonly PartLine[],
  invoiceParts: readonly PartLine[],
  options?: { humanConfirmedOverrides?: readonly HumanConfirmedPartOverride[] },
): PartMatchingResult {
  const overrideWarnings: string[] = [];
  const humanMatched: MatchedPartLine[] = [];
  const usedEst = new Set<string>();
  const usedInv = new Set<string>();

  if (options?.humanConfirmedOverrides?.length) {
    const estById = new Map(estimateParts.map((line) => [line.lineId, line]));
    const invById = new Map(invoiceParts.map((line) => [line.lineId, line]));
    const seenEst = new Set<string>();
    const seenInv = new Set<string>();

    for (const override of options.humanConfirmedOverrides) {
      if (seenEst.has(override.estimateLineId)) {
        overrideWarnings.push(
          `conflicting_human_override: estimate line ${override.estimateLineId} appears in multiple confirmed relations`,
        );
        continue;
      }
      if (seenInv.has(override.invoiceLineId)) {
        overrideWarnings.push(
          `conflicting_human_override: invoice line ${override.invoiceLineId} appears in multiple confirmed relations`,
        );
        continue;
      }

      const est = estById.get(override.estimateLineId);
      const inv = invById.get(override.invoiceLineId);
      if (!est || !inv) {
        overrideWarnings.push(
          `invalid_human_override: line not found for ${override.relationId}`,
        );
        continue;
      }

      const estNorm = normalizedKey(est);
      const invNorm = normalizedKey(inv);
      if (
        estNorm !== override.leftNormalizedNumber ||
        invNorm !== override.rightNormalizedNumber
      ) {
        overrideWarnings.push(
          `invalid_human_override: normalized numbers mismatch for ${override.relationId}`,
        );
        continue;
      }

      seenEst.add(override.estimateLineId);
      seenInv.add(override.invoiceLineId);
      usedEst.add(override.estimateLineId);
      usedInv.add(override.invoiceLineId);

      humanMatched.push(
        toHumanConfirmedMatched(currency, override.leftNormalizedNumber, est, inv),
      );
    }
  }

  const remainingEst = estimateParts.filter((line) => !usedEst.has(line.lineId));
  const remainingInv = invoiceParts.filter((line) => !usedInv.has(line.lineId));
  const baseline = matchPartsBaseline(currency, remainingEst, remainingInv);

  return {
    matched: [...humanMatched, ...baseline.matched],
    estimateOnly: baseline.estimateOnly,
    invoiceOnly: baseline.invoiceOnly,
    ambiguous: baseline.ambiguous,
    ...(overrideWarnings.length > 0 ? { overrideWarnings } : {}),
  };
}

function toHumanConfirmedMatched(
  currency: string,
  key: string,
  est: PartLine,
  inv: PartLine,
): MatchedPartLine {
  const base = toMatched(currency, key, est, inv, 'human_confirmed');
  return {
    ...base,
    certainty: 'observed',
    matchMethod: 'human_confirmed',
  };
}

function matchPartsBaseline(
  currency: string,
  estimateParts: readonly PartLine[],
  invoiceParts: readonly PartLine[],
): PartMatchingResult {
  const matched: MatchedPartLine[] = [];
  const estimateOnly: EstimateOnlyPartLine[] = [];
  const invoiceOnly: InvoiceOnlyPartLine[] = [];
  const ambiguous: AmbiguousPartMatch[] = [];

  const estByKey = groupByKey(estimateParts);
  const invByKey = groupByKey(invoiceParts);
  const allKeys = new Set([...estByKey.keys(), ...invByKey.keys()]);

  const usedEst = new Set<string>();
  const usedInv = new Set<string>();

  for (const key of allKeys) {
    const estLines = estByKey.get(key) ?? [];
    const invLines = invByKey.get(key) ?? [];

    if (estLines.length === 0) {
      for (const inv of invLines) {
        invoiceOnly.push(toInvoiceOnly(inv));
        usedInv.add(inv.lineId);
      }
      continue;
    }
    if (invLines.length === 0) {
      for (const est of estLines) {
        estimateOnly.push(toEstimateOnly(est));
        usedEst.add(est.lineId);
      }
      continue;
    }

    if (estLines.length === 1 && invLines.length === 1) {
      matched.push(toMatched(currency, key, estLines[0]!, invLines[0]!, 'unique_normalized_oem'));
      usedEst.add(estLines[0]!.lineId);
      usedInv.add(invLines[0]!.lineId);
      continue;
    }

    const pairs: Array<{ est: PartLine; inv: PartLine; score: number }> = [];
    for (const est of estLines) {
      for (const inv of invLines) {
        pairs.push({ est, inv, score: scorePair(est, inv) });
      }
    }
    pairs.sort((a, b) => b.score - a.score);

    const localUsedEst = new Set<string>();
    const localUsedInv = new Set<string>();
    let blocked = false;

    for (const est of estLines) {
      const candidates = pairs
        .filter((p) => p.est.lineId === est.lineId && !localUsedInv.has(p.inv.lineId))
        .filter((p) => p.score >= 2);
      if (candidates.length === 0) continue;
      const best = candidates[0]!;
      const tied = candidates.filter((p) => p.score === best.score);
      if (tied.length > 1) {
        blocked = true;
        break;
      }
      localUsedEst.add(est.lineId);
      localUsedInv.add(best.inv.lineId);
      const method =
        best.score >= 4 && est.quantity?.value === best.inv.quantity?.value && est.lineNet?.value
          ? 'disambiguated_quantity_net'
          : 'disambiguated_quantity';
      matched.push(toMatched(currency, key, est, best.inv, method));
    }

    if (blocked) {
      ambiguous.push({
        kind: 'ambiguous',
        normalizedPartNumber: key,
        estimateLineIds: estLines.map((l) => l.lineId),
        invoiceLineIds: invLines.map((l) => l.lineId),
        reason: 'multiple_equally_scored_duplicate_oem_candidates',
      });
      continue;
    }

    for (const est of estLines) {
      if (localUsedEst.has(est.lineId)) {
        usedEst.add(est.lineId);
      } else {
        estimateOnly.push(toEstimateOnly(est));
        usedEst.add(est.lineId);
      }
    }
    for (const inv of invLines) {
      if (localUsedInv.has(inv.lineId)) {
        usedInv.add(inv.lineId);
      } else {
        invoiceOnly.push(toInvoiceOnly(inv));
        usedInv.add(inv.lineId);
      }
    }
  }

  for (const est of estimateParts) {
    if (!usedEst.has(est.lineId) && !normalizedKey(est)) {
      estimateOnly.push(toEstimateOnly(est));
    }
  }
  for (const inv of invoiceParts) {
    if (!usedInv.has(inv.lineId) && !normalizedKey(inv)) {
      invoiceOnly.push(toInvoiceOnly(inv));
    }
  }

  return { matched, estimateOnly, invoiceOnly, ambiguous };
}

function groupByKey(lines: readonly PartLine[]): Map<string, PartLine[]> {
  const map = new Map<string, PartLine[]>();
  for (const line of lines) {
    const key = normalizedKey(line);
    if (!key) continue;
    const bucket = map.get(key) ?? [];
    bucket.push(line);
    map.set(key, bucket);
  }
  return map;
}

function toMatched(
  currency: string,
  key: string,
  est: PartLine,
  inv: PartLine,
  method: MatchedPartLine['matchMethod'],
): MatchedPartLine {
  const en = est.lineNet?.value;
  const inn = inv.lineNet?.value;
  let lineNetDelta: Money | undefined;
  if (en && inn) {
    lineNetDelta = subtractMoney(inn, en);
  }
  const qtyDelta =
    est.quantity?.value && inv.quantity?.value
      ? subtractQty(inv.quantity.value, est.quantity.value)
      : undefined;
  const decomposed = decomposePartLineDelta({
    currency,
    estimateQty: est.quantity?.value,
    invoiceQty: inv.quantity?.value,
    estimateUnit: est.unitNetPrice?.value,
    invoiceUnit: inv.unitNetPrice?.value,
    lineNetDelta,
  });
  return {
    kind: 'matched',
    estimateLineId: est.lineId,
    invoiceLineId: inv.lineId,
    normalizedPartNumber: key,
    matchMethod: method,
    certainty: method === 'unique_normalized_oem' ? 'observed' : 'derived',
    lineNetDelta,
    quantityDelta: qtyDelta,
    quantityEffect: decomposed.quantityEffect,
    priceEffect: decomposed.priceEffect,
    estimateSource: est.source,
    invoiceSource: inv.source,
  };
}

function subtractQty(a: string, b: string): string | undefined {
  return subtractDecimalStrings(a, b);
}

function toEstimateOnly(est: PartLine): EstimateOnlyPartLine {
  const net = est.lineNet?.value;
  return {
    kind: 'estimate_only',
    estimateLineId: est.lineId,
    normalizedPartNumber: normalizedKey(est),
    lineNetContribution: net ? { ...net, minorUnits: -net.minorUnits } : undefined,
    estimateSource: est.source,
  };
}

function toInvoiceOnly(inv: PartLine): InvoiceOnlyPartLine {
  return {
    kind: 'invoice_only',
    invoiceLineId: inv.lineId,
    normalizedPartNumber: normalizedKey(inv),
    lineNetContribution: inv.lineNet?.value,
    invoiceSource: inv.source,
  };
}

export function partsExplainedContribution(result: PartMatchingResult): Money[] {
  const out: Money[] = [];
  for (const m of result.matched) {
    if (m.lineNetDelta) out.push(m.lineNetDelta);
  }
  for (const e of result.estimateOnly) {
    if (e.lineNetContribution) out.push(e.lineNetContribution);
  }
  for (const i of result.invoiceOnly) {
    if (i.lineNetContribution) out.push(i.lineNetContribution);
  }
  return out;
}
