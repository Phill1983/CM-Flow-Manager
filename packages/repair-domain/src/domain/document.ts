import type { Money } from './money.js';
import type { LabourLine, LabourUnitConversion } from './labour.js';
import type { PartLine } from './parts.js';
import type { PaintBlock, MaterialLine } from './paint-materials.js';
import type { AdditionalCostLine, Normalia } from './normalia.js';
import type { DocumentTotals } from './totals.js';
import type { DocumentExtensions } from './extensions.js';
import type { SourceRef, SourceValue } from './source.js';
import type {
  DocumentType,
  NormalizationStatus,
  SourceFormat,
  TextLayerStatus,
} from './types.js';

export const CANONICAL_REPAIR_DOCUMENT_SCHEMA_VERSION = 1 as const;

export type VehicleIdentity = {
  readonly plate?: SourceValue<string>;
  readonly vin?: SourceValue<string>;
  readonly make?: SourceValue<string>;
  readonly model?: SourceValue<string>;
  readonly year?: SourceValue<number | string>;
};

export type CaseReference = {
  readonly claimId?: SourceValue<string>;
  readonly shopCaseId?: SourceValue<string>;
  readonly estimateNumber?: SourceValue<string>;
  readonly invoiceNumber?: SourceValue<string>;
  readonly ksefNumber?: SourceValue<string>;
  readonly documentDates?: Readonly<Record<string, SourceValue<string>>>;
};

export type DocumentSourceMeta = {
  readonly documentId: string;
  readonly documentType: DocumentType;
  readonly sourceFormat?: SourceFormat;
  readonly textLayerStatus?: TextLayerStatus;
  readonly language?: string;
  readonly pageCount?: number;
  /** Opaque hint only — engines must not switch business logic on this. */
  readonly originalFormatHint?: string;
};

/**
 * Canonical internal representation shared by Process A and Process B.
 * Process membership is NOT stored here. Parsers map any source into this shape.
 */
export type CanonicalRepairDocument = {
  readonly schemaVersion: typeof CANONICAL_REPAIR_DOCUMENT_SCHEMA_VERSION | number;
  readonly source: DocumentSourceMeta;
  readonly currency: string;
  readonly identity?: {
    readonly internalCaseId?: string;
  };
  readonly vehicle?: VehicleIdentity;
  readonly caseReference?: CaseReference;
  readonly parts?: readonly PartLine[];
  readonly labour?: readonly LabourLine[];
  /** Document-local conversions observed on this document (may be empty). */
  readonly labourUnitConversions?: readonly LabourUnitConversion[];
  readonly paint?: PaintBlock;
  readonly materials?: readonly MaterialLine[];
  readonly normalia?: readonly Normalia[];
  readonly additionalCosts?: readonly AdditionalCostLine[];
  readonly totals?: DocumentTotals;
  readonly extensions?: DocumentExtensions;
  readonly normalizationStatus?: NormalizationStatus;
  readonly warnings?: readonly string[];
  readonly rootSource?: SourceRef;
};

export type ExtractionUnavailableDocument = {
  readonly schemaVersion: typeof CANONICAL_REPAIR_DOCUMENT_SCHEMA_VERSION | number;
  readonly status: 'extraction_unavailable';
  readonly reason: 'ocr_required' | 'text_layer_missing' | 'unsupported' | string;
  readonly source: DocumentSourceMeta;
  readonly currency?: string;
  readonly warnings?: readonly string[];
};

export type RepairDocumentInput = CanonicalRepairDocument | ExtractionUnavailableDocument;

export function isExtractionUnavailable(
  doc: RepairDocumentInput,
): doc is ExtractionUnavailableDocument {
  return 'status' in doc && doc.status === 'extraction_unavailable';
}

export function isCanonicalRepairDocument(
  doc: RepairDocumentInput,
): doc is CanonicalRepairDocument {
  return !isExtractionUnavailable(doc);
}

/** Helper re-export for fixtures constructing money consistently. */
export type { Money };
