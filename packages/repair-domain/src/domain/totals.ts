import type { Money } from './money.js';
import type { SourceValue } from './source.js';

/** Tax is document-local — never hardcode 23%. */
export type TaxBreakdown = {
  readonly taxRate?: SourceValue<string>;
  readonly taxBase?: SourceValue<Money>;
  readonly taxAmount?: SourceValue<Money>;
};

export type DocumentTotals = {
  readonly partsNet?: SourceValue<Money>;
  readonly labourNet?: SourceValue<Money>;
  readonly paintNet?: SourceValue<Money>;
  readonly materialsNet?: SourceValue<Money>;
  readonly normaliaNet?: SourceValue<Money>;
  readonly otherNet?: SourceValue<Money>;
  readonly totalNet?: SourceValue<Money>;
  readonly tax?: TaxBreakdown;
  readonly totalGross?: SourceValue<Money>;
  /**
   * Totals printed on the source document.
   * Distinct from any future recalculated totals.
   */
  readonly sourceProvided?: boolean;
  /** Optional recalculated mirror for disagreement detection (Phase 4D+). */
  readonly calculated?: {
    readonly totalNet?: Money;
    readonly taxAmount?: Money;
    readonly totalGross?: Money;
  };
};
