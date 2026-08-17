import type { Money } from './money.js';
import type { SourceRef, SourceValue } from './source.js';
import type { NormalizationStatus } from './types.js';
import type { PartNumberNormalization } from './part-number.js';

/**
 * One physical line. Duplicate part numbers are separate PartLine rows.
 * Part number is NEVER a unique line id.
 */
export type PartLine = {
  readonly lineId: string;
  readonly position?: SourceValue<number | string>;
  readonly rawPartNumber?: SourceValue<string>;
  readonly partNumberNormalization?: PartNumberNormalization;
  readonly description?: SourceValue<string>;
  readonly quantity?: SourceValue<string>;
  readonly unit?: SourceValue<string>;
  readonly basePrice?: SourceValue<Money>;
  readonly discountPercent?: SourceValue<string>;
  readonly discountAmount?: SourceValue<Money>;
  readonly unitNetPrice?: SourceValue<Money>;
  readonly lineNet?: SourceValue<Money>;
  readonly taxRate?: SourceValue<string>;
  readonly taxAmount?: SourceValue<Money>;
  readonly flags?: readonly string[];
  readonly normalizationStatus?: NormalizationStatus;
  readonly source?: SourceRef;
};
