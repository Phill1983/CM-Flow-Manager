import type { ConfirmedPartRelation } from './human-review-types.js';
import { toHumanConfirmedPartOverride } from './human-review.js';

/** Trusted human-confirmed overrides accepted by 4D reconciliation. */
export type HumanConfirmedPartOverrideInput = ReturnType<typeof toHumanConfirmedPartOverride>;

export function mapConfirmedRelationsForReconciliation(
  confirmed: readonly ConfirmedPartRelation[],
): HumanConfirmedPartOverrideInput[] {
  return confirmed.map(toHumanConfirmedPartOverride);
}
