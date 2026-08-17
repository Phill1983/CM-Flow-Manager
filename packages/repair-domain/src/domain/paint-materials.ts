import type { Money } from './money.js';
import type { SourceRef, SourceValue } from './source.js';
import type { LabourLine } from './labour.js';

/** Preserve source granularity — detailed ops and aggregates may coexist. */
export type PaintOperationLine = {
  readonly lineId: string;
  readonly code?: SourceValue<string>;
  readonly description?: SourceValue<string>;
  readonly quantity?: SourceValue<string>;
  readonly sourceUnit?: SourceValue<string>;
  readonly lineNet?: SourceValue<Money>;
  readonly source?: SourceRef;
};

export type PaintBlock = {
  readonly operations?: readonly PaintOperationLine[];
  /** May duplicate labour category lines; kept for source fidelity. */
  readonly labourLines?: readonly LabourLine[];
  readonly paintLabourNet?: SourceValue<Money>;
  readonly paintMaterialsNet?: SourceValue<Money>;
  readonly rawCategory?: SourceValue<string>;
  readonly source?: SourceRef;
};

export type MaterialLine = {
  readonly lineId: string;
  readonly kind?: SourceValue<string>;
  readonly description?: SourceValue<string>;
  readonly quantity?: SourceValue<string>;
  readonly unit?: SourceValue<string>;
  readonly lineNet?: SourceValue<Money>;
  readonly source?: SourceRef;
};
