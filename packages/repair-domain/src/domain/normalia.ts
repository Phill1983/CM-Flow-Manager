import type { Money } from './money.js';
import type { SourceRef, SourceValue } from './source.js';
import type { Certainty } from './types.js';

/**
 * First-class normalia / consumables concept.
 * Do NOT encode normalia = parts × 2% as a business rule.
 * Percentage / base / method remain optional and evidence-tagged.
 */
export type NormaliaCalculationMethod =
  | 'explicit_amount_only'
  | 'explicit_percent_of_base'
  | 'unknown';

export type Normalia = {
  readonly lineId?: string;
  readonly amountNet?: SourceValue<Money>;
  /** Present only when the source printed a percentage. */
  readonly percent?: SourceValue<string>;
  readonly calculationBase?: SourceValue<Money>;
  readonly calculationMethod?: NormaliaCalculationMethod;
  readonly certainty: Certainty;
  readonly notes?: string;
  readonly source?: SourceRef;
};

export type AdditionalCostLine = {
  readonly lineId: string;
  readonly kind?: SourceValue<string>;
  readonly description?: SourceValue<string>;
  readonly lineNet?: SourceValue<Money>;
  readonly source?: SourceRef;
};
