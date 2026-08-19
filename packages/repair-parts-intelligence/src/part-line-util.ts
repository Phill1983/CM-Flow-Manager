import {
  normalizePartNumberDeterministic,
  type CanonicalRepairDocument,
  type PartLine,
} from '@cm-flow-manager/repair-domain';

export function findPartLine(
  document: CanonicalRepairDocument,
  lineId: string,
): PartLine | undefined {
  return document.parts?.find((line) => line.lineId === lineId);
}

export function resolvedNormalizedPartNumber(line: PartLine): string | undefined {
  const fromLine = line.partNumberNormalization?.normalizedPartNumber;
  if (fromLine && fromLine.length > 0) {
    return fromLine;
  }
  const raw = line.rawPartNumber?.value;
  if (!raw) {
    return undefined;
  }
  const normalized = normalizePartNumberDeterministic(raw);
  if (normalized.status === 'invalid') {
    return undefined;
  }
  return normalized.normalizedPartNumber;
}

export function resolvedRawPartNumber(line: PartLine): string | undefined {
  return line.rawPartNumber?.value ?? line.partNumberNormalization?.rawPartNumber;
}

export function partLineSource(line: PartLine) {
  return line.rawPartNumber?.source ?? line.source;
}
