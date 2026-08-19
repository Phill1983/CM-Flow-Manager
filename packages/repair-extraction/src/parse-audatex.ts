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
import { allMatches, firstMatch, letterSpacedPhrase, makeRef } from './text-util.js';
import type { ExtractedPage, ExtractionWarning } from './types.js';

const PLN = 'PLN';

const PART_LINE =
  /^([A-Z0-9][A-Z0-9.-]{5,}|\d{3}\s+\d{3}\s+\d{4})\s{2,}(.+?)\s{2,}(\d+(?:[.,]\d+)?)(?:\s*(P|szt))?(?:\s{2,}([\d\s]+[.,]\d{2}))?\s*$/i;

const LABOUR_JC_LINE =
  /^(.{6,80}?)\s{2,}(\d+(?:[.,]\d+)?)\s*JC(?:\s{2,}([\d\s]+[.,]\d{2}))?\s*$/i;

/** PDF.js labour ops: `81125R00 DESC 2 36.00` — no `JC` token on the line. */
const LABOUR_OP_LINE =
  /^([A-Z0-9][A-Z0-9.-]{3,})\s+(.+?)\s+(\d+)\*?\s+([\d\s]+[.,]\d{2})\s*$/;

/** Price at EOL. Must not swallow a trailing all-digit catalog token. */
const AUDATEX_MONEY_EOL = String.raw`(\d{1,3}(?:[ \u00A0]\d{3})+[.,]\d{2}|\d{1,7}[.,]\d{2})`;

/** PDF.js parts table: `0482 14 P KLIPS 8112637010 45.36` (position, optional qty P, desc, catalog, price). */
const AUDATEX_TABLE_PART = new RegExp(
  `^(\\d{3,5})\\s+(?:(\\d+)\\s+(P)\\s+)?(.+?)\\s+${AUDATEX_MONEY_EOL}\\*?\\s*$`,
);

const SKIP_PART_LINE =
  /^(KOD|SYSTEM|RAZEM|NORMALIA|VAT|KALKUL|STRONA|NUMER|CENY|OBJA|NR\s+KATALOG)/i;

function headerRe(phrase: string): RegExp {
  return new RegExp(letterSpacedPhrase(phrase), 'i');
}

function splitAudatexCatalog(middle: string): { catalog?: string; description: string } {
  const tokens = middle.trim().split(/\s+/).filter(Boolean);
  if (tokens.length >= 3) {
    const spaced = `${tokens[tokens.length - 3]} ${tokens[tokens.length - 2]} ${tokens[tokens.length - 1]}`;
    if (/^\d{3}\s+\d{3}\s+\d{4}$/.test(spaced)) {
      return { catalog: spaced, description: tokens.slice(0, -3).join(' ') };
    }
  }
  const last = tokens[tokens.length - 1] ?? '';
  if (/^[A-Z0-9]{8,}$/i.test(last)) {
    return { catalog: last, description: tokens.slice(0, -1).join(' ') };
  }
  return { description: middle.trim() };
}

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

  const estimateNumber =
    firstMatch(text, /KALKULACJA\s+NAPRAWY\s+NR\s+(\S+)/i)
    ?? firstMatch(text, new RegExp(`${letterSpacedPhrase('KALKULACJA NAPRAWY')}\\s+NR\\s+(\\S+)`, 'i'));
  const plate =
    firstMatch(text, /(?:Nr\s+rejestracyjny|Numer\s+rejestracyjny)\s*:\s*(\S+)/i)
    ?? firstMatch(text, /NR\s*REJ\.?\s+(\S+)/i);
  const vin =
    firstMatch(text, /\bVIN\s*:\s*(\S+)/i)
    ?? firstMatch(text, /NUMER\s+VIN\s+(\S+)/i);
  const make = firstMatch(text, /\bMarka\s*:?\s*([A-Za-z0-9-]+)/i);
  const model = firstMatch(text, /\bModel\s*:\s*([A-Za-z0-9-]+)/i);
  const docDate = firstMatch(text, /(?:Data\s+kalkulacji|Data)\s*:\s*([\d.-]+)/i);

  const partsSection = sectionSlice(
    text,
    /NUMER\s+KATALOGOWY|CZ[EĘ][SŚ]CI\s+ZAMIENNE/i,
    new RegExp(`${letterSpacedPhrase('KALKULACJA KONCOWA')}|${letterSpacedPhrase('STRONA KONTROLNA')}`, 'i'),
  );
  const parts: PartLine[] = [];
  for (const line of partsSection.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || /NUMER\s+KATALOGOWY|^---/i.test(trimmed) || SKIP_PART_LINE.test(trimmed)) continue;
    if (/^BRAK\s+NR/i.test(trimmed)) {
      warnings.push({
        code: 'brak_nr_line',
        message: 'Source line has BRAK NR — part number omitted',
        path: 'parts',
      });
      continue;
    }
    const spaced = PART_LINE.exec(trimmed);
    if (spaced) {
      const rawPart = spaced[1]!.replace(/\s+/g, ' ').trim();
      const desc = spaced[2]!.trim();
      const qty = parseQuantityString(spaced[3]);
      const lineNet = parseSourceMoney(PLN, spaced[5]);
      const lineId = `part-${parts.length + 1}`;
      parts.push({
        lineId,
        rawPartNumber: sv(rawPart, 'parts', rawPart),
        partNumberNormalization: normalizePartNumberDeterministic(rawPart),
        description: sv(desc, 'parts', desc),
        ...(qty ? { quantity: sv(qty, 'parts', spaced[3]!) } : {}),
        ...(spaced[4] ? { unit: sv(spaced[4].toLowerCase() === 'p' ? 'P' : spaced[4], 'parts', spaced[4]) } : {}),
        ...(lineNet
          ? { lineNet: sourceValue(lineNet, { certainty: 'observed', source: makeRef(documentId, 'parts', trimmed, pages, { lineId }) }) }
          : {}),
        source: makeRef(documentId, 'parts', trimmed, pages, { lineId }),
      });
      continue;
    }

    const table = AUDATEX_TABLE_PART.exec(trimmed);
    if (!table) continue;
    const { catalog, description } = splitAudatexCatalog(table[4] ?? '');
    if (!description && !catalog) continue;
    const qty = parseQuantityString(table[2]);
    const lineNet = parseSourceMoney(PLN, table[5]);
    const lineId = `part-${parts.length + 1}`;
    const position = table[1]!.trim();
    parts.push({
      lineId,
      position: sv(position, 'parts', position),
      ...(catalog
        ? {
            rawPartNumber: sv(catalog, 'parts', catalog),
            partNumberNormalization: normalizePartNumberDeterministic(catalog),
          }
        : {}),
      description: sv(description || catalog || position, 'parts', description || trimmed),
      ...(qty ? { quantity: sv(qty, 'parts', table[2]!) } : {}),
      ...(table[3] ? { unit: sv('P', 'parts', table[3]) } : {}),
      ...(lineNet
        ? { lineNet: sourceValue(lineNet, { certainty: 'observed', source: makeRef(documentId, 'parts', trimmed, pages, { lineId }) }) }
        : {}),
      source: makeRef(documentId, 'parts', trimmed, pages, { lineId }),
    });
  }

  const labourSection = sectionSlice(
    text,
    headerRe('ROBOCIZNA'),
    new RegExp(
      `KOD\\s+CZ[EĘ]|${letterSpacedPhrase('LAKIEROWANIE')}|${letterSpacedPhrase('CZESCI ZAMIENNE')}|NUMER\\s+KATALOGOWY`,
      'i',
    ),
  );
  const labour: LabourLine[] = [];
  const pushLabour = (desc: string, qty: string, qtyRaw: string, lineNet: ReturnType<typeof parseSourceMoney>, trimmed: string) => {
    if (/^ROBOCIZNA$/i.test(desc) || /JC\s*=\s*1/i.test(desc) || /^NR\s+POZ/i.test(desc)) return;
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
      quantity: sv(qty, 'labour', qtyRaw),
      sourceUnit: sv('JC', 'labour', 'JC'),
      ...(rate && rateRaw
        ? { rate: sourceValue(rate, { certainty: 'observed', source: makeRef(documentId, 'labour', rateRaw, pages) }) }
        : {}),
      ...(lineNet ? { lineNet: sv(lineNet, 'labour', trimmed) } : {}),
      presentation: 'detail',
      normalizedHours: hours,
      source: makeRef(documentId, 'labour', trimmed, pages, { lineId }),
    });
  };
  for (const line of labourSection.split(/\r?\n/)) {
    const trimmed = line.trim();
    const jcLine = LABOUR_JC_LINE.exec(trimmed);
    if (jcLine) {
      const qty = parseDecimalString(jcLine[2]);
      if (qty) pushLabour(jcLine[1]!.trim(), qty, jcLine[2]!, parseSourceMoney(PLN, jcLine[3]), trimmed);
      continue;
    }
    const opLine = LABOUR_OP_LINE.exec(trimmed);
    if (!opLine) continue;
    const qty = parseDecimalString(opLine[3]);
    if (!qty) continue;
    const desc = `${opLine[1]} ${opLine[2]}`.trim();
    pushLabour(desc, qty, opLine[3]!, parseSourceMoney(PLN, opLine[4]), trimmed);
  }

  const finalCalc = sectionSlice(
    text,
    headerRe('KALKULACJA KONCOWA'),
    headerRe('STRONA KONTROLNA'),
  );

  const moneyAfter = (label: RegExp): ReturnType<typeof parseSourceMoney> => {
    const m = label.exec(finalCalc);
    if (!m) return undefined;
    return parseSourceMoney(PLN, m[1]);
  };

  const labourBodyNet =
    moneyAfter(/Robocizna\s+blacharska\s+([\d\s]+[.,]\d{2})/i)
    ?? moneyAfter(/^Robocizna\s+([\d\s]+[.,]\d{2})/im)
    ?? parseSourceMoney(
      PLN,
      firstMatch(finalCalc, /RAZEM\s+\d+\s+JC\s+X\s+[\d\s.,]+\s*PLN\s*\/\s*RBG\s+([\d\s]+[.,]\d{2})/i),
    );
  const paintLabourNet = parseSourceMoney(
    PLN,
    firstMatch(finalCalc, /(?:Lakierowanie|Robocizna\s+lakiernicza|LAKIEROWANIE)\s+([\d\s]+[.,]\d{2})/i)
      ?? firstMatch(text, /JC\s*\/\s*RBG\s*:\s*\d+\s+([\d\s]+[.,]\d{2})/i)
      ?? firstMatch(finalCalc, /KOSZTY\s+ROBOCIZNY\s+([\d\s]+[.,]\d{2})/i),
  );
  const paintMaterialsNet = parseSourceMoney(
    PLN,
    firstMatch(finalCalc, /KOSZTY\s+MATERIA[LŁ]U\s+([\d\s]+[.,]\d{2})/i)
      ?? firstMatch(finalCalc, /Materia[lły]+\s+lakiernicze\s+([\d\s]+[.,]\d{2})/i),
  );
  const partsNet = parseSourceMoney(
    PLN,
    firstMatch(finalCalc, /CZ[EĘ][SŚ]CI(?:\s+ZAMIENNE)?\s+([\d\s]+[.,]\d{2})/i)
      ?? firstMatch(finalCalc, new RegExp(`${letterSpacedPhrase('CZESCI ZAMIENNE')}\\s+([\\d\\s]+[.,]\\d{2})`, 'i')),
  );
  const additionalNet = parseSourceMoney(
    PLN,
    firstMatch(finalCalc, /KOSZTY\s+DODATKOWE\s+([\d\s]+[.,]\d{2})/i),
  );
  const totalNet = parseSourceMoney(
    PLN,
    firstMatch(finalCalc, /RAZEM\s+NETTO\s+([\d\s]+[.,]\d{2})/i)
      ?? firstMatch(
        finalCalc,
        new RegExp(`${letterSpacedPhrase('KOSZTY NAPRAWY')}\\s+BEZ\\s+VAT[.\\s]+([\\d\\s]+[.,]\\d{2})`, 'i'),
      ),
  );
  const totalGross = parseSourceMoney(
    PLN,
    firstMatch(finalCalc, /RAZEM\s+BRUTTO\s+([\d\s]+[.,]\d{2})/i)
      ?? firstMatch(
        finalCalc,
        new RegExp(`${letterSpacedPhrase('KOSZTY NAPRAWY')}\\s+Z\\s+VAT[.\\s]+([\\d\\s]+[.,]\\d{2})`, 'i'),
      ),
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
