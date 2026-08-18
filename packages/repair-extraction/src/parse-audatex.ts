import {
  CANONICAL_REPAIR_DOCUMENT_SCHEMA_VERSION,
  normalizePartNumberDeterministic,
  resolveLabourHours,
  sourceValue,
  type CanonicalRepairDocument,
  type LabourLine,
  type LabourUnitConversion,
  type PartLine,
} from '@cm-flow-manager/repair-domain';
import { parseDecimalString, parseQuantityString, parseSourceMoney } from './money-parse.js';
import { allMatches, firstMatch, makeRef } from './text-util.js';
import type { ExtractedPage, ExtractionWarning } from './types.js';

const PLN = 'PLN';

const PART_LINE =
  /^([A-Z0-9][A-Z0-9.-]{5,}|\d{3}\s+\d{3}\s+\d{4})\s{2,}(.+?)\s{2,}(\d+(?:[.,]\d+)?)(?:\s*(P|szt))?(?:\s{2,}([\d\s]+[.,]\d{2}))?\s*$/i;

const LABOUR_JC_LINE =
  /^(.{6,80}?)\s{2,}(\d+(?:[.,]\d+)?)\s*JC(?:\s{2,}([\d\s]+[.,]\d{2}))?\s*$/i;

export type AudatexParseOutcome = {
  readonly document: CanonicalRepairDocument;
  readonly warnings: ExtractionWarning[];
};

function uniqueInts(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

function sectionSlice(text: string, startRe: RegExp, endRe: RegExp): string {
  const start = text.search(startRe);
  if (start < 0) return '';
  const rest = text.slice(start);
  const endLocal = rest.search(endRe);
  return endLocal > 0 ? rest.slice(0, endLocal) : rest;
}

export function parseAudatexDocument(
  documentId: string,
  text: string,
  pages?: readonly ExtractedPage[],
  pageCount?: number,
): AudatexParseOutcome {
  const warnings: ExtractionWarning[] = [];
  const sv = <T>(value: T, section: string, raw: string) =>
    sourceValue(value, { certainty: 'observed', source: makeRef(documentId, section, raw, pages) });

  const eqNs = uniqueInts(allMatches(text, /(\d+)\s*JC\s*=\s*1\s*RBG/i));
  const slashNs = uniqueInts(allMatches(text, /(\d+)\s*JC\s*\/\s*RBG/i));
  const eqRaw = firstMatch(text, /(\d+\s*JC\s*=\s*1\s*RBG)/i);

  const conversions: LabourUnitConversion[] = [];
  if (eqNs.length === 1) {
    const n = eqNs[0]!;
    conversions.push({
      sourceUnit: 'JC',
      targetUnit: 'RBG',
      sourceUnitsPerTargetUnit: { numerator: BigInt(n), denominator: 1n },
      certainty: 'observed',
      source: makeRef(documentId, 'labour', eqRaw ?? `${n} JC = 1 RBG`, pages),
    });
  } else if (eqNs.length > 1) {
    warnings.push({
      code: 'conflicting_jc_eq_labels',
      message: `Multiple document-local JC=1 RBG values observed: ${eqNs.join(', ')}`,
      path: 'labourUnitConversions',
    });
  }

  if (slashNs.length > 1) {
    warnings.push({
      code: 'conflicting_jc_labels',
      message: `Paint/control block lists multiple JC/RBG labels: ${slashNs.join(', ')}`,
      path: 'paint',
    });
  }

  const conversion = conversions[0];
  const rateRaw = firstMatch(text, /(\d+[.,]\d{2})\s*PLN\s*\/\s*RBG/i)
    ?? firstMatch(text, /PLN\s*\/\s*RBG\s*(\d+[.,]\d{2})/i);
  const rate = parseSourceMoney(PLN, rateRaw);

  const estimateNumber = firstMatch(text, /KALKULACJA\s+NAPRAWY\s+NR\s+(\S+)/i);
  const plate = firstMatch(text, /(?:Nr\s+rejestracyjny|Numer\s+rejestracyjny)\s*:\s*(\S+)/i);
  const vin = firstMatch(text, /\bVIN\s*:\s*(\S+)/i);
  const make = firstMatch(text, /\bMarka\s*:\s*([A-Za-z0-9-]+)/i);
  const model = firstMatch(text, /\bModel\s*:\s*([A-Za-z0-9-]+)/i);
  const docDate = firstMatch(text, /(?:Data\s+kalkulacji|Data)\s*:\s*([\d.-]+)/i);

  const partsSection = sectionSlice(
    text,
    /CZ[EĘ][SŚ]CI\s+ZAMIENNE|NUMER\s+KATALOGOWY/i,
    /KALKULACJA\s+KO[NŃ]COWA|STRONA\s+KONTROLNA/i,
  );
  const parts: PartLine[] = [];
  for (const line of partsSection.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || /NUMER\s+KATALOGOWY|^---/i.test(trimmed)) continue;
    if (/^BRAK\s+NR/i.test(trimmed)) {
      warnings.push({
        code: 'brak_nr_line',
        message: 'Source line has BRAK NR — part number omitted',
        path: 'parts',
      });
      continue;
    }
    const m = PART_LINE.exec(trimmed);
    if (!m) continue;
    const rawPart = m[1]!.replace(/\s+/g, ' ').trim();
    const desc = m[2]!.trim();
    const qty = parseQuantityString(m[3]);
    const lineNet = parseSourceMoney(PLN, m[5]);
    const lineId = `part-${parts.length + 1}`;
    const row: PartLine = {
      lineId,
      rawPartNumber: sv(rawPart, 'parts', rawPart),
      partNumberNormalization: normalizePartNumberDeterministic(rawPart),
      description: sv(desc, 'parts', desc),
      ...(qty ? { quantity: sv(qty, 'parts', m[3]!) } : {}),
      ...(m[4] ? { unit: sv(m[4].toLowerCase() === 'p' ? 'P' : m[4], 'parts', m[4]) } : {}),
      ...(lineNet
        ? { lineNet: sourceValue(lineNet, { certainty: 'observed', source: makeRef(documentId, 'parts', trimmed, pages, { lineId }) }) }
        : {}),
      source: makeRef(documentId, 'parts', trimmed, pages, { lineId }),
    };
    parts.push(row);
  }

  const labourSection = sectionSlice(text, /ROBOCIZNA\b/i, /LAKIEROWANIE|CZ[EĘ][SŚ]CI\s+ZAMIENNE/i);
  const labour: LabourLine[] = [];
  for (const line of labourSection.split(/\r?\n/)) {
    const trimmed = line.trim();
    const m = LABOUR_JC_LINE.exec(trimmed);
    if (!m) continue;
    const desc = m[1]!.trim();
    if (/^ROBOCIZNA$/i.test(desc) || /JC\s*=\s*1/i.test(desc)) continue;
    const qty = parseDecimalString(m[2]);
    if (!qty) continue;
    const lineNet = parseSourceMoney(PLN, m[3]);
    const lineId = `lab-${labour.length + 1}`;
    const lower = desc.toLowerCase();
    const category = /lakier/i.test(lower)
      ? 'paint'
      : /blach|nadwoz/i.test(lower)
        ? 'body'
        : undefined;
    const hours = resolveLabourHours({
      quantityMajor: qty,
      sourceUnit: 'JC',
      conversion,
    });
    labour.push({
      lineId,
      description: sv(desc, 'labour', desc),
      ...(category ? { category: sourceValue(category, { certainty: 'derived', source: makeRef(documentId, 'labour', desc, pages) }) } : {}),
      quantity: sv(qty, 'labour', m[2]!),
      sourceUnit: sv('JC', 'labour', 'JC'),
      ...(rate && rateRaw
        ? { rate: sourceValue(rate, { certainty: 'observed', source: makeRef(documentId, 'labour', rateRaw, pages) }) }
        : {}),
      ...(lineNet ? { lineNet: sv(lineNet, 'labour', m[3]!) } : {}),
      presentation: 'detail',
      normalizedHours: hours,
      source: makeRef(documentId, 'labour', trimmed, pages, { lineId }),
    });
  }

  const finalCalc = sectionSlice(text, /KALKULACJA\s+KO[NŃ]COWA/i, /STRONA\s+KONTROLNA|$/i);

  const moneyAfter = (label: RegExp): ReturnType<typeof parseSourceMoney> => {
    const m = label.exec(finalCalc);
    if (!m) return undefined;
    return parseSourceMoney(PLN, m[1]);
  };

  const labourBodyNet =
    moneyAfter(/Robocizna\s+blacharska\s+([\d\s]+[.,]\d{2})/i)
    ?? moneyAfter(/^Robocizna\s+([\d\s]+[.,]\d{2})/im);
  const paintLabourNet = parseSourceMoney(
    PLN,
    firstMatch(finalCalc, /(?:Lakierowanie|Robocizna\s+lakiernicza|LAKIEROWANIE)\s+([\d\s]+[.,]\d{2})/i),
  );
  const paintMaterialsNet = parseSourceMoney(
    PLN,
    firstMatch(finalCalc, /KOSZTY\s+MATERIA[LŁ]U\s+([\d\s]+[.,]\d{2})/i)
      ?? firstMatch(finalCalc, /Materia[lły]+\s+lakiernicze\s+([\d\s]+[.,]\d{2})/i),
  );
  const partsNet = parseSourceMoney(
    PLN,
    firstMatch(finalCalc, /CZ[EĘ][SŚ]CI(?:\s+ZAMIENNE)?\s+([\d\s]+[.,]\d{2})/i),
  );
  const additionalNet = parseSourceMoney(
    PLN,
    firstMatch(finalCalc, /KOSZTY\s+DODATKOWE\s+([\d\s]+[.,]\d{2})/i),
  );
  const totalNet = parseSourceMoney(
    PLN,
    firstMatch(finalCalc, /RAZEM\s+NETTO\s+([\d\s]+[.,]\d{2})/i),
  );
  const totalGross = parseSourceMoney(
    PLN,
    firstMatch(finalCalc, /RAZEM\s+BRUTTO\s+([\d\s]+[.,]\d{2})/i),
  );
  const vatAmount = parseSourceMoney(
    PLN,
    firstMatch(finalCalc, /VAT\s+[\d.,]+\s*%\s+([\d\s]+[.,]\d{2})/i),
  );
  const vatRate = parseDecimalString(firstMatch(finalCalc, /VAT\s+([\d.,]+)\s*%/i));

  const normaliaPct = parseDecimalString(
    firstMatch(finalCalc, /NORMALIA\s*\(\s*([\d.,]+)\s*%\s*\)/i),
  );
  const normaliaAmt = parseSourceMoney(
    PLN,
    firstMatch(finalCalc, /NORMALIA\s*\([^)]*\)\s+([\d\s]+[.,]\d{2})/i),
  );

  const paintHoursUnresolved = slashNs.length > 1;
  if (paintHoursUnresolved) {
    for (let i = 0; i < labour.length; i += 1) {
      const line = labour[i]!;
      if (line.category?.value === 'paint') {
        labour[i] = {
          ...line,
          normalizedHours: {
            status: 'unresolved',
            reason: 'conflicting_paint_jc_labels_on_source',
          },
        };
      }
    }
  }

  const unknownFields: { key: string; rawValue: string }[] = [];
  const eurRate = firstMatch(text, /(1\s*EURO\s*=\s*[\d.,]+\s*PLN)/i);
  if (eurRate) unknownFields.push({ key: 'audatex.eur_pln_rate', rawValue: eurRate });
  if (slashNs.length > 1) {
    unknownFields.push({
      key: 'audatex.paint_jc_labels',
      rawValue: slashNs.map((n) => `${n} JC/RBG`).join(' and '),
    });
  }

  const document: CanonicalRepairDocument = {
    schemaVersion: CANONICAL_REPAIR_DOCUMENT_SCHEMA_VERSION,
    source: {
      documentId,
      documentType: 'estimate',
      sourceFormat: 'audatex',
      textLayerStatus: 'yes',
      language: 'pl',
      ...(pageCount !== undefined ? { pageCount } : {}),
      originalFormatHint: 'audatex_kalkulacja_pdf',
    },
    currency: PLN,
    ...(plate || vin || make || model
      ? {
          vehicle: {
            ...(plate ? { plate: sv(plate, 'vehicle', plate) } : {}),
            ...(vin ? { vin: sv(vin, 'vehicle', vin) } : {}),
            ...(make ? { make: sv(make, 'vehicle', make) } : {}),
            ...(model ? { model: sv(model, 'vehicle', model) } : {}),
          },
        }
      : {}),
    ...(estimateNumber || docDate
      ? {
          caseReference: {
            ...(estimateNumber
              ? {
                  estimateNumber: sv(estimateNumber, 'case', estimateNumber),
                  claimId: sv(estimateNumber, 'case', estimateNumber),
                }
              : {}),
            ...(docDate
              ? { documentDates: { calculation: sv(docDate, 'header', docDate) } }
              : {}),
          },
        }
      : {}),
    ...(parts.length > 0 ? { parts } : {}),
    ...(labour.length > 0 ? { labour } : {}),
    ...(conversions.length > 0 ? { labourUnitConversions: conversions } : {}),
    ...(paintLabourNet || paintMaterialsNet
      ? {
          paint: {
            ...(paintLabourNet ? { paintLabourNet: sv(paintLabourNet, 'paint', 'LAKIEROWANIE') } : {}),
            ...(paintMaterialsNet
              ? { paintMaterialsNet: sv(paintMaterialsNet, 'paint', 'KOSZTY MATERIALU') }
              : {}),
            rawCategory: sv('LAKIEROWANIE (AZT)', 'paint', 'LAKIEROWANIE (AZT)'),
          },
        }
      : {}),
    ...(normaliaAmt || normaliaPct
      ? {
          normalia: [
            {
              ...(normaliaAmt ? { amountNet: sv(normaliaAmt, 'normalia', 'NORMALIA') } : {}),
              ...(normaliaPct ? { percent: sv(normaliaPct, 'normalia', `${normaliaPct}%`) } : {}),
              ...(partsNet ? { calculationBase: sv(partsNet, 'normalia', 'CZESCI') } : {}),
              calculationMethod: normaliaPct && partsNet ? 'explicit_percent_of_base' : 'explicit_amount_only',
              certainty: normaliaPct && partsNet ? 'inferred' : 'observed',
              notes: normaliaPct && partsNet
                ? 'Percent and amount printed; base taken from parts subtotal on this document — not a universal formula.'
                : undefined,
              source: makeRef(documentId, 'normalia', 'NORMALIA', pages),
            },
          ],
        }
      : {}),
    ...(additionalNet
      ? {
          additionalCosts: [
            {
              lineId: 'add-1',
              kind: sv('additional', 'additional', 'KOSZTY DODATKOWE'),
              lineNet: sv(additionalNet, 'additional', 'KOSZTY DODATKOWE'),
            },
          ],
        }
      : {}),
    totals: {
      sourceProvided: true,
      ...(partsNet ? { partsNet: sv(partsNet, 'totals', 'CZESCI') } : {}),
      ...(normaliaAmt ? { normaliaNet: sv(normaliaAmt, 'totals', 'NORMALIA') } : {}),
      ...(labourBodyNet ? { labourNet: sv(labourBodyNet, 'totals', 'Robocizna') } : {}),
      ...(paintLabourNet || paintMaterialsNet
        ? {
            paintNet:
              paintLabourNet && paintMaterialsNet
                ? sourceValue(
                    {
                      currency: PLN,
                      minorUnits: paintLabourNet.minorUnits + paintMaterialsNet.minorUnits,
                    },
                    {
                      certainty: 'derived',
                      source: makeRef(documentId, 'totals', 'paint labour + materials', pages),
                    },
                  )
                : paintLabourNet
                  ? sv(paintLabourNet, 'totals', 'LAKIEROWANIE')
                  : undefined,
          }
        : {}),
      ...(totalNet ? { totalNet: sv(totalNet, 'totals', 'RAZEM NETTO') } : {}),
      ...(vatAmount || vatRate
        ? {
            tax: {
              ...(vatRate ? { taxRate: sv(vatRate, 'tax', `VAT ${vatRate}%`) } : {}),
              ...(totalNet ? { taxBase: sv(totalNet, 'tax', 'RAZEM NETTO') } : {}),
              ...(vatAmount ? { taxAmount: sv(vatAmount, 'tax', 'VAT') } : {}),
            },
          }
        : {}),
      ...(totalGross ? { totalGross: sv(totalGross, 'totals', 'RAZEM BRUTTO') } : {}),
    },
    ...(unknownFields.length > 0 ? { extensions: { unknownFields } } : {}),
    normalizationStatus: 'partial',
    warnings: warnings.map((w) => w.message),
    rootSource: { documentId, extractionOrigin: 'parser' },
  };

  return { document, warnings };
}
