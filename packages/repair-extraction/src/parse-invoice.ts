import {
  CANONICAL_REPAIR_DOCUMENT_SCHEMA_VERSION,
  normalizePartNumberDeterministic,
  sourceValue,
  type CanonicalRepairDocument,
  type AdditionalCostLine,
  type LabourLine,
  type MaterialLine,
  type Normalia,
  type PartLine,
} from '@cm-flow-manager/repair-domain';
import {
  moneyMatchesProduct,
  parseDecimalString,
  parseSourceMoney,
} from './money-parse.js';
import { firstMatch, makeRef } from './text-util.js';
import type { ExtractedPage, ExtractionWarning } from './types.js';

const PLN = 'PLN';

const LINE_START = /^(\d+)\s+(.*)$/;
/** `usł` is not a JS `\w` character, so it cannot use `\\b`. */
const UNIT_RE = /\b(szt|rbg|usl)\b|(?<![A-Za-z0-9])(usł)(?![A-Za-z0-9])/i;
const MONEY_TOKEN = /\d{1,3}(?:[ \u00A0\u202F.]\d{3})*[.,]\d{2}|\d+[.,]\d{2}/g;
const PCT_TOKEN = /(\d+[.,]?\d*)\s*%/g;

function normalizeInvoiceUnit(raw: string): string {
  const unit = raw.toLowerCase();
  return unit === 'usł' ? 'usl' : unit;
}

export type InvoiceParseOutcome = {
  readonly document: CanonicalRepairDocument;
  readonly warnings: ExtractionWarning[];
};

type MoneyAssignment = {
  unitNetPrice?: ReturnType<typeof parseSourceMoney>;
  lineNet?: ReturnType<typeof parseSourceMoney>;
  taxRate?: string;
  discountPercent?: string;
  unresolved: boolean;
};

function classifyKind(
  description: string,
  unit: string | undefined,
): 'labour' | 'normalia' | 'paint_materials' | 'additional' | 'part' | 'other' {
  const d = description.toLowerCase();
  if (/normalia/i.test(d)) return 'normalia';
  if (/materi[ae]\w*\s+lakier/i.test(d) || /materia[lły]+\s+lakiernicze/i.test(d)) {
    return 'paint_materials';
  }
  if (/materia[lły]+\s+dodatk/i.test(d)) return 'additional';
  if (unit === 'rbg' || /robocizna|konserwacja\s+robocizna/i.test(d)) {
    return 'labour';
  }
  if (looksLikePartCode(description)) return 'part';
  return 'other';
}

function looksLikePartCode(description: string): boolean {
  const lead = (description.trim().split(/\s+/)[0] ?? '').replace(/,$/, '');
  return /^(?=[A-Z0-9]*\d)[A-Z0-9]{8,}$/i.test(lead) || /^\d{3}\s+\d{3}\s+\d{4}/.test(description);
}

function splitCodeAndDescription(description: string): { code?: string; rest: string } {
  const trimmed = description.trim();
  const spaced = /^(\d{3}\s+\d{3}\s+\d{4})\s+(.*)$/.exec(trimmed);
  if (spaced) return { code: spaced[1], rest: spaced[2]!.trim() };
  const compact = /^([A-Z0-9]{8,}),?\s+(.*)$/i.exec(trimmed);
  if (compact) return { code: compact[1], rest: compact[2]!.trim() };
  return { rest: trimmed };
}

function assignMoney(
  qty: string | undefined,
  remainder: string,
): MoneyAssignment {
  const percents: string[] = [];
  let m: RegExpExecArray | null;
  const pctRe = new RegExp(PCT_TOKEN.source, 'g');
  while ((m = pctRe.exec(remainder)) !== null) {
    const p = parseDecimalString(m[1]);
    if (p) percents.push(p);
  }

  const taxRate = percents.find((p) => p === '23');
  const discountPercent = percents.find((p) => p !== taxRate);

  const moneyRaws = remainder.match(MONEY_TOKEN) ?? [];
  const moneys = moneyRaws
    .map((raw) => ({ raw, money: parseSourceMoney(PLN, raw) }))
    .filter((x): x is { raw: string; money: NonNullable<typeof x.money> } => x.money !== undefined);

  if (moneys.length === 0) {
    return { taxRate, discountPercent, unresolved: remainder.trim().length > 0 };
  }

  if (qty && moneys.length >= 2) {
    const unit = moneys[0]!.money;
    const net = moneys[1]!.money;
    if (moneyMatchesProduct(unit, qty, net)) {
      return {
        unitNetPrice: unit,
        lineNet: net,
        taxRate,
        discountPercent,
        unresolved: false,
      };
    }
    // Swapped unit/net columns
    if (moneyMatchesProduct(net, qty, unit)) {
      return {
        unitNetPrice: net,
        lineNet: unit,
        taxRate,
        discountPercent,
        unresolved: false,
      };
    }
    return { taxRate, discountPercent, unresolved: true };
  }

  if (moneys.length === 1) {
    return {
      lineNet: moneys[0]!.money,
      taxRate,
      discountPercent,
      unresolved: false,
    };
  }

  return { taxRate, discountPercent, unresolved: true };
}

function labourCategory(description: string): string | undefined {
  const d = description.toLowerCase();
  if (/lakier/i.test(d)) return 'paint';
  if (/blach/i.test(d)) return 'body';
  if (/konserw/i.test(d)) return 'conservation';
  return undefined;
}

export function parseInvoiceDocument(
  documentId: string,
  text: string,
  pages?: readonly ExtractedPage[],
  pageCount?: number,
): InvoiceParseOutcome {
  const warnings: ExtractionWarning[] = [];
  const sv = <T>(value: T, section: string, raw: string) =>
    sourceValue(value, { certainty: 'observed', source: makeRef(documentId, section, raw, pages) });

  const invoiceNumber = firstMatch(text, /\b(FV\/BL\/[A-Za-z0-9*]+\/\d+)\b/);
  const ksefNumber = firstMatch(text, /(?:Numer\s+KSeF|KSeF)\s*:\s*(\S+)/i);
  const shopCaseId = firstMatch(text, /Numer\s+sprawy\s*:\s*(\S+)/i);
  const claimId = firstMatch(text, /(?:Numer\s+szkody|Sygnatura)\s*:\s*(\S+)/i);
  const plate = firstMatch(text, /(?:Nr\s+rejestracyjny|Numer\s+rejestracyjny)\s*:\s*(\S+)/i);
  const vin = firstMatch(text, /\bVIN\s*:\s*(\S+)/i);
  const make = firstMatch(text, /\bMarka\s*:\s*([A-Za-z0-9-]+)/i);
  const model = firstMatch(text, /\bModel\s*:\s*([A-Za-z0-9-]+)/i);
  const issueDate = firstMatch(text, /Data\s+wystawienia\s*:\s*([\d.-]+)/i);
  const saleDate = firstMatch(text, /Data\s+sprzeda[zż]y\s*:\s*([\d.-]+)/i);

  const linesBlockStart = text.search(/^\s*Lp\b/im);
  const linesBlockEndRel = linesBlockStart >= 0
    ? text.slice(linesBlockStart).search(/Razem\s+(netto|do\s+zap[lł]aty)|Podsumowanie|GTU\s*:/i)
    : -1;
  const linesBlock =
    linesBlockStart >= 0
      ? text.slice(
          linesBlockStart,
          linesBlockEndRel > 0 ? linesBlockStart + linesBlockEndRel : undefined,
        )
      : '';

  const physicalLines = linesBlock.split(/\r?\n/);
  const logical: string[] = [];
  for (let i = 0; i < physicalLines.length; i += 1) {
    const row = physicalLines[i]!.trimEnd();
    if (!row.trim() || /^Lp\b/i.test(row.trim())) continue;
    if (LINE_START.test(row.trim())) {
      logical.push(row.trim());
    } else if (logical.length > 0 && /[\d.,]/.test(row) && !/Faktura|Strona\s+\d/i.test(row)) {
      logical[logical.length - 1] = `${logical[logical.length - 1]} ${row.trim()}`;
    }
  }

  const parts: PartLine[] = [];
  const labour: LabourLine[] = [];
  const materials: MaterialLine[] = [];
  const additional: AdditionalCostLine[] = [];
  const normalia: Normalia[] = [];

  for (const rawLine of logical) {
    const start = LINE_START.exec(rawLine);
    if (!start) continue;
    const lp = start[1]!;
    const rest = start[2]!;
    const unitMatch = UNIT_RE.exec(rest);
    const unitRaw = unitMatch?.[1] ?? unitMatch?.[2];
    const unit = unitRaw ? normalizeInvoiceUnit(unitRaw) : undefined;
    let description = rest;
    let qty: string | undefined;
    let remainder = '';
    if (unitMatch && unitMatch.index !== undefined) {
      const before = rest.slice(0, unitMatch.index).trim();
      remainder = rest.slice(unitMatch.index + unitMatch[0].length);
      const qtyBefore = before.match(/(\d+[.,]\d+|\d+)\s*$/);
      const qtyAfter = remainder.match(/^\s*(\d+[.,]\d+|\d+)/);
      // 4C.1 pdftotext: qty before unit. PDF.js shop invoices: unit then qty.
      if (qtyBefore) {
        qty = parseDecimalString(qtyBefore[1]);
        description = before.slice(0, qtyBefore.index).replace(/,\s*$/, '').trim();
      } else if (qtyAfter) {
        qty = parseDecimalString(qtyAfter[1]);
        remainder = remainder.slice(qtyAfter[0].length);
        description = before.replace(/,\s*$/, '').trim();
      } else {
        description = before.replace(/,\s*$/, '').trim();
      }
    }

    const kind = classifyKind(description, unit);
    const money = assignMoney(qty, remainder);
    if (money.unresolved) {
      warnings.push({
        code: 'column_bleed_unresolved',
        message: `Line ${lp} monetary columns could not be assigned confidently`,
        path: `lines[${lp}]`,
      });
    }

    const lineId = `inv-${lp}`;
    const { code, rest: descRest } = splitCodeAndDescription(description);
    const displayDesc = descRest || description;

    if (kind === 'labour') {
      const presentation = unit === 'usl' ? 'lump' : 'detail';
      const hours =
        unit === 'rbg' && qty
          ? { status: 'resolved' as const, hours: qty }
          : unit === 'usl'
            ? { status: 'unresolved' as const, reason: 'lump_presentation_without_hours' }
            : { status: 'unresolved' as const, reason: 'labour_unit_conversion_unavailable' };
      const cat = labourCategory(displayDesc);
      labour.push({
        lineId,
        description: sv(displayDesc, 'labour', displayDesc),
        ...(cat ? { category: sourceValue(cat, { certainty: 'derived', source: makeRef(documentId, 'labour', displayDesc, pages) }) } : {}),
        ...(qty ? { quantity: sv(qty, 'labour', qty) } : {}),
        ...(unit ? { sourceUnit: sv(unit, 'labour', unit) } : {}),
        ...(!money.unresolved && money.unitNetPrice
          ? { rate: sv(money.unitNetPrice, 'labour', remainder) }
          : {}),
        ...(!money.unresolved && money.lineNet
          ? { lineNet: sv(money.lineNet, 'labour', remainder) }
          : {}),
        presentation,
        normalizedHours: hours,
        source: makeRef(documentId, 'labour', rawLine, pages, { lineId }),
      });
      continue;
    }

    if (kind === 'normalia') {
      normalia.push({
        lineId,
        ...(!money.unresolved && money.lineNet
          ? { amountNet: sv(money.lineNet, 'normalia', rawLine) }
          : {}),
        calculationMethod: money.unresolved || !money.lineNet ? 'unknown' : 'explicit_amount_only',
        certainty: money.unresolved || !money.lineNet ? 'unknown' : 'observed',
        notes: money.unresolved
          ? 'Normalia line present; amount ambiguous in extract — not fabricated.'
          : 'Invoice printed amount only; percentage not present on this invoice family.',
        source: makeRef(documentId, 'normalia', rawLine, pages, { lineId }),
      });
      continue;
    }

    if (kind === 'paint_materials') {
      materials.push({
        lineId,
        kind: sv('paint_materials', 'materials', displayDesc),
        description: sv(displayDesc, 'materials', displayDesc),
        ...(qty ? { quantity: sv(qty, 'materials', qty) } : {}),
        ...(unit ? { unit: sv(unit, 'materials', unit) } : {}),
        ...(!money.unresolved && money.lineNet
          ? { lineNet: sv(money.lineNet, 'materials', remainder) }
          : {}),
        source: makeRef(documentId, 'materials', rawLine, pages, { lineId }),
      });
      continue;
    }

    if (kind === 'additional') {
      additional.push({
        lineId,
        kind: sv('additional', 'additional', displayDesc),
        description: sv(displayDesc, 'additional', displayDesc),
        ...(!money.unresolved && money.lineNet
          ? { lineNet: sv(money.lineNet, 'additional', remainder) }
          : {}),
        source: makeRef(documentId, 'additional', rawLine, pages, { lineId }),
      });
      continue;
    }

    if (kind === 'part') {
      parts.push({
        lineId,
        position: sv(lp, 'parts', lp),
        ...(code
          ? {
              rawPartNumber: sv(code, 'parts', code),
              partNumberNormalization: normalizePartNumberDeterministic(code),
            }
          : {}),
        description: sv(displayDesc, 'parts', displayDesc),
        ...(qty ? { quantity: sv(qty, 'parts', qty) } : {}),
        ...(unit ? { unit: sv(unit, 'parts', unit) } : {}),
        ...(!money.unresolved && money.unitNetPrice
          ? { unitNetPrice: sv(money.unitNetPrice, 'parts', remainder) }
          : {}),
        ...(!money.unresolved && money.lineNet
          ? { lineNet: sv(money.lineNet, 'parts', remainder) }
          : {}),
        ...(!money.unresolved && money.discountPercent
          ? { discountPercent: sv(money.discountPercent, 'parts', money.discountPercent) }
          : {}),
        ...(!money.unresolved && money.taxRate
          ? { taxRate: sv(money.taxRate, 'tax', money.taxRate) }
          : {}),
        ...(money.unresolved ? { normalizationStatus: 'unresolved' as const } : {}),
        source: makeRef(documentId, 'parts', rawLine, pages, { lineId }),
      });
      continue;
    }

    warnings.push({
      code: 'unclassified_line',
      message: `Line ${lp} is not classified as part, labour, normalia, or paint materials`,
      path: `lines[${lp}]`,
    });
  }

  const totalsRegion = text.slice(Math.max(0, text.search(/Razem\s+netto|Razem\s+do\s+zap[lł]aty|Razem:/i)));
  const footerTriple = /Razem:\s*([\d\s]+[.,]\d{2})(?:\s*(?:zł|zl))?\s+([\d\s]+[.,]\d{2})(?:\s*(?:zł|zl))?\s+([\d\s]+[.,]\d{2})/i.exec(
    totalsRegion,
  );
  const totalNet = parseSourceMoney(
    PLN,
    firstMatch(totalsRegion, /Razem\s+netto\s*:?\s*([\d\s]+[.,]\d{2})/i) ?? footerTriple?.[1],
  );
  const vatAmount = parseSourceMoney(
    PLN,
    firstMatch(totalsRegion, /(?:^|\s)(?:VAT|Kwota\s+VAT)\s*:?\s*([\d\s]+[.,]\d{2})/im) ?? footerTriple?.[2],
  );
  const totalGross = parseSourceMoney(
    PLN,
    firstMatch(totalsRegion, /(?:Razem\s+brutto|Razem\s+do\s+zap[lł]aty)\s*:?\s*([\d\s]+[.,]\d{2})/i)
      ?? footerTriple?.[3],
  );
  const vatRate = parseDecimalString(firstMatch(text, /VAT\s+([\d.,]+)\s*%/i));

  const unknownFields: { key: string; rawValue: string }[] = [];
  if (/MPP|podzielonej\s+p[lł]atno/i.test(text)) {
    unknownFields.push({ key: 'invoice.mpp', rawValue: 'MPP (metoda podzielonej platnosci)' });
  }

  const document: CanonicalRepairDocument = {
    schemaVersion: CANONICAL_REPAIR_DOCUMENT_SCHEMA_VERSION,
    source: {
      documentId,
      documentType: 'invoice',
      sourceFormat: 'shop_faktura_vat',
      textLayerStatus: 'yes',
      language: 'pl',
      ...(pageCount !== undefined ? { pageCount } : {}),
      originalFormatHint: 'shop_faktura_vat_ksef_pdf',
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
    caseReference: {
      ...(invoiceNumber ? { invoiceNumber: sv(invoiceNumber, 'case', invoiceNumber) } : {}),
      ...(ksefNumber ? { ksefNumber: sv(ksefNumber, 'case', ksefNumber) } : {}),
      ...(shopCaseId ? { shopCaseId: sv(shopCaseId, 'case', shopCaseId) } : {}),
      ...(claimId ? { claimId: sv(claimId, 'case', claimId) } : {}),
      ...(issueDate || saleDate
        ? {
            documentDates: {
              ...(issueDate ? { issue: sv(issueDate, 'header', issueDate) } : {}),
              ...(saleDate ? { sale: sv(saleDate, 'header', saleDate) } : {}),
            },
          }
        : {}),
    },
    ...(parts.length > 0 ? { parts } : {}),
    ...(labour.length > 0 ? { labour } : {}),
    ...(materials.length > 0 ? { materials } : {}),
    ...(additional.length > 0 ? { additionalCosts: additional } : {}),
    ...(normalia.length > 0 ? { normalia } : {}),
    totals: {
      sourceProvided: true,
      ...(totalNet ? { totalNet: sv(totalNet, 'totals', 'Razem netto') } : {}),
      ...(vatAmount || vatRate
        ? {
            tax: {
              ...(vatRate ? { taxRate: sv(vatRate, 'tax', `VAT ${vatRate}%`) } : {}),
              ...(totalNet ? { taxBase: sv(totalNet, 'tax', 'Razem netto') } : {}),
              ...(vatAmount ? { taxAmount: sv(vatAmount, 'tax', 'VAT') } : {}),
            },
          }
        : {}),
      ...(totalGross ? { totalGross: sv(totalGross, 'totals', 'Razem brutto') } : {}),
    },
    ...(unknownFields.length > 0 ? { extensions: { unknownFields } } : {}),
    normalizationStatus: 'partial',
    warnings: warnings.map((w) => w.message),
    rootSource: { documentId, extractionOrigin: 'parser' },
  };

  return { document, warnings };
}
