import { moneyFromMajorString } from '../domain/money.js';
import { sourceValue } from '../domain/source.js';
import { normalizePartNumberDeterministic } from '../domain/part-number.js';
import { resolveLabourHours } from '../domain/labour.js';
import {
  CANONICAL_REPAIR_DOCUMENT_SCHEMA_VERSION,
  type CanonicalRepairDocument,
  type ExtractionUnavailableDocument,
} from '../domain/document.js';

const PLN = 'PLN';
const pln = (major: string) => moneyFromMajorString(PLN, major);

/** CASE-4A2-01 estimate — OCR-required; no fabricated fields. */
export const case4a201EstimateUnavailable: ExtractionUnavailableDocument = {
  schemaVersion: CANONICAL_REPAIR_DOCUMENT_SCHEMA_VERSION,
  status: 'extraction_unavailable',
  reason: 'ocr_required',
  source: {
    documentId: 'CASE-4A2-01-estimate',
    documentType: 'estimate',
    sourceFormat: 'scan_ocr',
    textLayerStatus: 'no',
    pageCount: 5,
    originalFormatHint: 'image_pdf',
  },
  warnings: [
    'Estimate content is OCR-required / not field-confirmed. Do not invent line items.',
  ],
};

export function buildCase4a202Estimate(): CanonicalRepairDocument {
  const conversion = {
    sourceUnit: 'JC',
    targetUnit: 'RBG',
    sourceUnitsPerTargetUnit: { numerator: 10n, denominator: 1n },
    certainty: 'observed' as const,
    source: {
      documentId: 'CASE-4A2-02-estimate',
      page: 2,
      section: 'labour',
      rawText: '10 JC=1 RBG',
    },
  };

  const bodyHours = resolveLabourHours({
    quantityMajor: '66',
    sourceUnit: 'JC',
    conversion,
  });
  const paintHours = resolveLabourHours({
    quantityMajor: '58',
    sourceUnit: 'JC',
    conversion,
  });

  const p1 = normalizePartNumberDeterministic('96001A2000');
  const p2 = normalizePartNumberDeterministic('86130N7000');
  const p3 = normalizePartNumberDeterministic('8112637010');

  return {
    schemaVersion: CANONICAL_REPAIR_DOCUMENT_SCHEMA_VERSION,
    source: {
      documentId: 'CASE-4A2-02-estimate',
      documentType: 'estimate',
      sourceFormat: 'audatex',
      textLayerStatus: 'yes',
      language: 'pl',
      pageCount: 6,
    },
    currency: PLN,
    identity: { internalCaseId: 'CASE-4A2-02' },
    vehicle: {
      plate: sourceValue('[REDACTED]', { certainty: 'observed' }),
      vin: sourceValue('[REDACTED]', { certainty: 'observed' }),
      make: sourceValue('Hyundai', { certainty: 'observed' }),
      model: sourceValue('Tucson', { certainty: 'observed' }),
    },
    caseReference: {
      claimId: sourceValue('[REDACTED]', { certainty: 'observed' }),
      estimateNumber: sourceValue('[REDACTED]', { certainty: 'observed' }),
    },
    labourUnitConversions: [conversion],
    labour: [
      {
        lineId: 'lab-body',
        category: sourceValue('body', { certainty: 'derived' }),
        description: sourceValue('Robocizna blacharska (aggregate)', { certainty: 'derived' }),
        quantity: sourceValue('66', { certainty: 'observed' }),
        sourceUnit: sourceValue('JC', { certainty: 'observed' }),
        rate: sourceValue(pln('180.00'), { certainty: 'observed' }),
        lineNet: sourceValue(pln('1188.00'), { certainty: 'observed' }),
        presentation: 'detail',
        normalizedHours: bodyHours,
      },
      {
        lineId: 'lab-paint',
        category: sourceValue('paint', { certainty: 'derived' }),
        quantity: sourceValue('58', { certainty: 'observed' }),
        sourceUnit: sourceValue('JC', { certainty: 'observed' }),
        rate: sourceValue(pln('180.00'), { certainty: 'observed' }),
        lineNet: sourceValue(pln('1044.00'), { certainty: 'observed' }),
        presentation: 'detail',
        normalizedHours: paintHours,
      },
    ],
    parts: [
      {
        lineId: 'part-1',
        rawPartNumber: sourceValue('96001A2000', { certainty: 'observed' }),
        partNumberNormalization: p1,
        description: sourceValue('FOLIA KLEJ CZUJ DESZ', { certainty: 'observed' }),
        quantity: sourceValue('1', { certainty: 'observed' }),
        unit: sourceValue('szt', { certainty: 'inferred' }),
        lineNet: sourceValue(pln('177.22'), {
          certainty: 'observed',
          source: { documentId: 'CASE-4A2-02-estimate', section: 'parts', rawText: '177.22' },
        }),
      },
      {
        lineId: 'part-2',
        rawPartNumber: sourceValue('86130N7000', { certainty: 'observed' }),
        partNumberNormalization: p2,
        description: sourceValue('LIST OZD', { certainty: 'observed' }),
        quantity: sourceValue('1', { certainty: 'observed' }),
      },
      {
        lineId: 'part-3',
        rawPartNumber: sourceValue('8112637010', { certainty: 'observed' }),
        partNumberNormalization: p3,
        description: sourceValue('KLIPS MOCOWANIA', { certainty: 'observed' }),
        quantity: sourceValue('14', { certainty: 'observed' }),
      },
    ],
    paint: {
      paintLabourNet: sourceValue(pln('1044.00'), { certainty: 'observed' }),
      paintMaterialsNet: sourceValue(pln('1213.95'), { certainty: 'observed' }),
      rawCategory: sourceValue('LAKIEROWANIE (AZT)', { certainty: 'observed' }),
    },
    normalia: [
      {
        amountNet: sourceValue(pln('11.78'), { certainty: 'observed' }),
        percent: sourceValue('2.0', { certainty: 'observed' }),
        calculationBase: sourceValue(pln('589.04'), { certainty: 'observed' }),
        calculationMethod: 'explicit_percent_of_base',
        certainty: 'inferred',
        notes:
          'Phase 4A.2: amount consistent with round(parts×0.02,2) on this sample — not a universal rule.',
      },
    ],
    totals: {
      sourceProvided: true,
      partsNet: sourceValue(pln('589.04'), { certainty: 'observed' }),
      normaliaNet: sourceValue(pln('11.78'), { certainty: 'observed' }),
      labourNet: sourceValue(pln('1188.00'), { certainty: 'observed' }),
      paintNet: sourceValue(pln('2257.95'), { certainty: 'observed' }),
      totalNet: sourceValue(pln('4046.77'), { certainty: 'observed' }),
      tax: {
        taxRate: sourceValue('23', { certainty: 'observed' }),
        taxBase: sourceValue(pln('4046.77'), { certainty: 'observed' }),
        taxAmount: sourceValue(pln('930.76'), { certainty: 'observed' }),
      },
      totalGross: sourceValue(pln('4977.53'), { certainty: 'observed' }),
    },
    extensions: {
      unknownFields: [
        {
          key: 'audatex.eur_pln_rate',
          rawValue: '1 EURO = 4.28720 PLN',
          source: { documentId: 'CASE-4A2-02-estimate', section: 'totals' },
        },
      ],
    },
    normalizationStatus: 'partial',
    warnings: ['Sanitized fixture — identifiers redacted.'],
  };
}

export function buildCase4a202Invoice(): CanonicalRepairDocument {
  return {
    schemaVersion: CANONICAL_REPAIR_DOCUMENT_SCHEMA_VERSION,
    source: {
      documentId: 'CASE-4A2-02-invoice',
      documentType: 'invoice',
      sourceFormat: 'shop_faktura_vat',
      textLayerStatus: 'yes',
      language: 'pl',
      pageCount: 2,
    },
    currency: PLN,
    identity: { internalCaseId: 'CASE-4A2-02' },
    vehicle: {
      plate: sourceValue('[REDACTED]', { certainty: 'observed' }),
      vin: sourceValue('[REDACTED]', { certainty: 'observed' }),
      make: sourceValue('Hyundai', { certainty: 'observed' }),
      model: sourceValue('Tucson', { certainty: 'observed' }),
    },
    caseReference: {
      claimId: sourceValue('[REDACTED]', { certainty: 'observed' }),
      shopCaseId: sourceValue('BL/****/**/26', { certainty: 'observed' }),
      invoiceNumber: sourceValue('FV/BL/****/26', { certainty: 'observed' }),
      ksefNumber: sourceValue('[REDACTED]', { certainty: 'observed' }),
    },
    // Invoice already in RBG — no JC conversion required for these lines
    labourUnitConversions: [],
    labour: [
      {
        lineId: 'inv-lab-1',
        description: sourceValue('Robocizna blacharska', { certainty: 'observed' }),
        category: sourceValue('body', { certainty: 'derived' }),
        quantity: sourceValue('6.60', { certainty: 'observed' }),
        sourceUnit: sourceValue('rbg', { certainty: 'observed' }),
        rate: sourceValue(pln('180.00'), { certainty: 'observed' }),
        lineNet: sourceValue(pln('1188.00'), {
          certainty: 'observed',
          source: {
            documentId: 'CASE-4A2-02-invoice',
            page: 1,
            section: 'labour',
            lineId: '1',
            rawText: '6,60 rbg',
          },
        }),
        presentation: 'detail',
        normalizedHours: { status: 'resolved', hours: '6.60' },
      },
      {
        lineId: 'inv-lab-2',
        description: sourceValue('Robocizna lakiernicza', { certainty: 'observed' }),
        category: sourceValue('paint', { certainty: 'derived' }),
        quantity: sourceValue('5.80', { certainty: 'observed' }),
        sourceUnit: sourceValue('rbg', { certainty: 'observed' }),
        rate: sourceValue(pln('180.00'), { certainty: 'observed' }),
        lineNet: sourceValue(pln('1044.00'), { certainty: 'observed' }),
        presentation: 'detail',
        normalizedHours: { status: 'resolved', hours: '5.80' },
      },
    ],
    parts: [
      {
        lineId: 'inv-p1',
        rawPartNumber: sourceValue('96001A2000', { certainty: 'observed' }),
        partNumberNormalization: normalizePartNumberDeterministic('96001A2000'),
        description: sourceValue('WKLADKA CZUJNIKA', { certainty: 'observed' }),
        quantity: sourceValue('1', { certainty: 'observed' }),
        unit: sourceValue('szt', { certainty: 'observed' }),
        lineNet: sourceValue(pln('177.23'), { certainty: 'observed' }),
      },
      {
        lineId: 'inv-p2',
        rawPartNumber: sourceValue('86130N7000', { certainty: 'observed' }),
        partNumberNormalization: normalizePartNumberDeterministic('86130N7000'),
        quantity: sourceValue('1', { certainty: 'observed' }),
        lineNet: sourceValue(pln('178.24'), { certainty: 'observed' }),
      },
      {
        lineId: 'inv-p3',
        rawPartNumber: sourceValue('8112637010', { certainty: 'observed' }),
        partNumberNormalization: normalizePartNumberDeterministic('8112637010'),
        quantity: sourceValue('14', { certainty: 'observed' }),
        lineNet: sourceValue(pln('45.22'), { certainty: 'inferred' }),
      },
    ],
    materials: [
      {
        lineId: 'inv-mat-paint',
        kind: sourceValue('paint_materials', { certainty: 'observed' }),
        description: sourceValue('Materialy lakiernicze', { certainty: 'observed' }),
        lineNet: sourceValue(pln('1213.95'), { certainty: 'observed' }),
      },
    ],
    normalia: [
      {
        amountNet: sourceValue(pln('8.01'), { certainty: 'observed' }),
        calculationMethod: 'explicit_amount_only',
        certainty: 'observed',
        notes: 'Invoice printed amount only; percentage not present on invoice.',
      },
    ],
    totals: {
      sourceProvided: true,
      totalNet: sourceValue(pln('3854.65'), { certainty: 'observed' }),
      tax: {
        taxRate: sourceValue('23', { certainty: 'observed' }),
        taxBase: sourceValue(pln('3854.65'), { certainty: 'observed' }),
        taxAmount: sourceValue(pln('886.57'), { certainty: 'observed' }),
      },
      totalGross: sourceValue(pln('4741.22'), { certainty: 'observed' }),
    },
    normalizationStatus: 'partial',
  };
}

export function buildCase4a203Estimate(): CanonicalRepairDocument {
  const conversion = {
    sourceUnit: 'JC',
    targetUnit: 'RBG',
    sourceUnitsPerTargetUnit: { numerator: 12n, denominator: 1n },
    certainty: 'observed' as const,
    source: {
      documentId: 'CASE-4A2-03-estimate',
      section: 'labour',
      rawText: '12 JC=1 RBG',
    },
  };

  const hours = resolveLabourHours({
    quantityMajor: '230',
    sourceUnit: 'JC',
    conversion,
  });

  return {
    schemaVersion: CANONICAL_REPAIR_DOCUMENT_SCHEMA_VERSION,
    source: {
      documentId: 'CASE-4A2-03-estimate',
      documentType: 'estimate',
      sourceFormat: 'audatex',
      textLayerStatus: 'yes',
      language: 'pl',
      pageCount: 8,
    },
    currency: PLN,
    identity: { internalCaseId: 'CASE-4A2-03' },
    vehicle: {
      plate: sourceValue('[REDACTED]', { certainty: 'observed' }),
      vin: sourceValue('[REDACTED]', { certainty: 'observed' }),
      make: sourceValue('Mercedes', { certainty: 'observed' }),
      model: sourceValue('GLC', { certainty: 'observed' }),
    },
    labourUnitConversions: [conversion],
    labour: [
      {
        lineId: 'lab-body-agg',
        category: sourceValue('body', { certainty: 'derived' }),
        quantity: sourceValue('230', { certainty: 'derived' }),
        sourceUnit: sourceValue('JC', { certainty: 'observed' }),
        lineNet: sourceValue(pln('3450.00'), { certainty: 'observed' }),
        presentation: 'detail',
        normalizedHours: hours,
      },
      {
        lineId: 'lab-paint-agg',
        category: sourceValue('paint', { certainty: 'derived' }),
        lineNet: sourceValue(pln('1746.00'), { certainty: 'observed' }),
        presentation: 'detail',
        normalizedHours: {
          status: 'unresolved',
          reason: 'conflicting_paint_jc_labels_on_source',
        },
      },
    ],
    parts: [
      {
        lineId: 'part-door-f',
        rawPartNumber: sourceValue('254 720 1700', { certainty: 'observed' }),
        partNumberNormalization: normalizePartNumberDeterministic('254 720 1700'),
        description: sourceValue('DRZWI PRZ L', { certainty: 'observed' }),
        quantity: sourceValue('1', { certainty: 'observed' }),
        lineNet: sourceValue(pln('4601.30'), { certainty: 'observed' }),
      },
      {
        lineId: 'part-seal-f',
        rawPartNumber: sourceValue('000 727 1300', { certainty: 'observed' }),
        partNumberNormalization: normalizePartNumberDeterministic('000 727 1300'),
        description: sourceValue('USZCZELKA DRZWI P L', { certainty: 'observed' }),
        quantity: sourceValue('1', { certainty: 'observed' }),
      },
      {
        lineId: 'part-seal-r',
        rawPartNumber: sourceValue('000 727 1300', { certainty: 'observed' }),
        partNumberNormalization: normalizePartNumberDeterministic('000 727 1300'),
        description: sourceValue('USZCZELKA DRZWI T L', { certainty: 'observed' }),
        quantity: sourceValue('1', { certainty: 'observed' }),
      },
    ],
    paint: {
      paintLabourNet: sourceValue(pln('1746.00'), { certainty: 'observed' }),
      paintMaterialsNet: sourceValue(pln('2787.07'), { certainty: 'observed' }),
    },
    normalia: [
      {
        amountNet: sourceValue(pln('294.15'), { certainty: 'observed' }),
        percent: sourceValue('2.0', { certainty: 'observed' }),
        calculationBase: sourceValue(pln('14707.72'), { certainty: 'observed' }),
        calculationMethod: 'explicit_percent_of_base',
        certainty: 'inferred',
        notes: 'Inferred consistency with 2% on this Audatex sample only.',
      },
    ],
    additionalCosts: [
      {
        lineId: 'add-cons',
        kind: sourceValue('conservation', { certainty: 'observed' }),
        lineNet: sourceValue(pln('150.00'), { certainty: 'observed' }),
      },
    ],
    totals: {
      sourceProvided: true,
      totalNet: sourceValue(pln('23134.94'), { certainty: 'observed' }),
      tax: {
        taxRate: sourceValue('23', { certainty: 'observed' }),
        taxAmount: sourceValue(pln('5321.04'), { certainty: 'observed' }),
      },
      totalGross: sourceValue(pln('28455.98'), { certainty: 'observed' }),
    },
    extensions: {
      unknownFields: [
        {
          key: 'audatex.paint_jc_labels',
          rawValue: '10 JC/RBG and 12 JC/RBG both printed on paint block',
        },
      ],
    },
    normalizationStatus: 'partial',
  };
}

export function buildCase4a203Invoice(): CanonicalRepairDocument {
  const oemA = normalizePartNumberDeterministic('A0007271300');
  return {
    schemaVersion: CANONICAL_REPAIR_DOCUMENT_SCHEMA_VERSION,
    source: {
      documentId: 'CASE-4A2-03-invoice',
      documentType: 'invoice',
      sourceFormat: 'shop_faktura_vat',
      textLayerStatus: 'yes',
      language: 'pl',
      pageCount: 2,
    },
    currency: PLN,
    identity: { internalCaseId: 'CASE-4A2-03' },
    labour: [
      {
        lineId: 'inv-body',
        description: sourceValue('ROBOCIZNA BLACHARSKA', { certainty: 'observed' }),
        category: sourceValue('body', { certainty: 'derived' }),
        quantity: sourceValue('1', { certainty: 'observed' }),
        sourceUnit: sourceValue('usl', { certainty: 'observed' }),
        lineNet: sourceValue(pln('3450.00'), { certainty: 'observed' }),
        presentation: 'lump',
        normalizedHours: {
          status: 'unresolved',
          reason: 'lump_presentation_without_hours',
        },
      },
      {
        lineId: 'inv-paint',
        description: sourceValue('ROBOCIZNA LAKIERNICZA', { certainty: 'observed' }),
        category: sourceValue('paint', { certainty: 'derived' }),
        quantity: sourceValue('1', { certainty: 'observed' }),
        sourceUnit: sourceValue('usl', { certainty: 'observed' }),
        lineNet: sourceValue(pln('1746.00'), { certainty: 'observed' }),
        presentation: 'lump',
        normalizedHours: {
          status: 'unresolved',
          reason: 'lump_presentation_without_hours',
        },
      },
    ],
    parts: [
      {
        lineId: 'inv-seal-1',
        rawPartNumber: sourceValue('A0007271300', { certainty: 'observed' }),
        partNumberNormalization: oemA,
        description: sourceValue('USZCZELKA DRZWI', { certainty: 'observed' }),
        quantity: sourceValue('1', { certainty: 'observed' }),
      },
      {
        lineId: 'inv-seal-2',
        rawPartNumber: sourceValue('A0007271300', { certainty: 'observed' }),
        partNumberNormalization: oemA,
        description: sourceValue('USZCZELKA DRZWI', { certainty: 'observed' }),
        quantity: sourceValue('1', { certainty: 'observed' }),
      },
    ],
    materials: [
      {
        lineId: 'inv-paint-mat',
        kind: sourceValue('paint_materials', { certainty: 'observed' }),
        lineNet: sourceValue(pln('2787.07'), { certainty: 'observed' }),
      },
    ],
    normalia: [
      {
        calculationMethod: 'unknown',
        certainty: 'unknown',
        notes: 'Normalia line present on invoice; exact amount ambiguous in extract — formula unknown.',
      },
    ],
    totals: {
      sourceProvided: true,
      totalNet: sourceValue(pln('23417.52'), { certainty: 'observed' }),
      tax: {
        taxRate: sourceValue('23', { certainty: 'observed' }),
        taxAmount: sourceValue(pln('5386.03'), { certainty: 'observed' }),
      },
      totalGross: sourceValue(pln('28803.55'), { certainty: 'observed' }),
    },
    extensions: {
      unknownFields: [
        { key: 'invoice.mpp', rawValue: 'MPP (metoda podzielonej platnosci)' },
      ],
    },
    normalizationStatus: 'partial',
    warnings: ['Duplicate OEM lines retained as separate PartLine rows.'],
  };
}

/** Fixture E — missing/unknown fields stay absent, not zero. */
export function buildUnknownSparseDocument(): CanonicalRepairDocument {
  return {
    schemaVersion: CANONICAL_REPAIR_DOCUMENT_SCHEMA_VERSION,
    source: {
      documentId: 'sparse-unknown',
      documentType: 'estimate',
      sourceFormat: 'unknown',
    },
    currency: PLN,
    parts: [
      {
        lineId: 'sparse-part',
        rawPartNumber: sourceValue('BRAK NR', { certainty: 'observed' }),
        partNumberNormalization: normalizePartNumberDeterministic('BRAK NR'),
        description: sourceValue('Unpriced line', { certainty: 'observed' }),
      },
    ],
    labour: [
      {
        lineId: 'sparse-lab',
        description: sourceValue('Hours unknown', { certainty: 'unknown' }),
        sourceUnit: sourceValue('unknown', { certainty: 'unknown' }),
        presentation: 'unknown',
        normalizedHours: { status: 'unresolved', reason: 'labour_unit_conversion_unavailable' },
      },
    ],
    warnings: ['Sparse fixture — omitted amounts are unknown, not zero.'],
  };
}
