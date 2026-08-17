/** Provenance classification — not a fake percentage score. */
export type Certainty = 'observed' | 'derived' | 'inferred' | 'unknown';

export type NormalizationStatus =
  | 'raw'
  | 'normalized'
  | 'partial'
  | 'unresolved'
  | 'invalid';

/**
 * Business document type. Independent of source format.
 * `estimate` is NOT Audatex. `invoice` is NOT a shop template.
 * Process A vs B is how engines *use* documents — not a field on the model.
 */
export type DocumentType = 'estimate' | 'invoice' | (string & {});

/** How the bytes arrived. Independent of DocumentType. Open for future formats. */
export type SourceFormat =
  | 'audatex'
  | 'shop_faktura_vat'
  | 'ksef'
  | 'scan_ocr'
  | 'unknown'
  | (string & {});

export type ExtractionOrigin = 'parser' | 'ocr' | 'manual' | 'unknown' | (string & {});

/** Source labour unit. Lump `usl` is not hours. */
export type LabourUnit = 'JC' | 'RBG' | 'usl' | 'unknown' | (string & {});

export type TextLayerStatus = 'yes' | 'no' | 'partial' | 'unknown';

export type DocumentSection =
  | 'header'
  | 'vehicle'
  | 'case'
  | 'parts'
  | 'labour'
  | 'paint'
  | 'materials'
  | 'normalia'
  | 'additional'
  | 'totals'
  | 'tax'
  | 'other'
  | (string & {});
