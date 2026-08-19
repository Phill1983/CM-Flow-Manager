import { describe, expect, it } from 'vitest';
import {
  moneyFromMajorString,
  normalizePartNumberDeterministic,
  sourceValue,
  type PartLine,
} from '@cm-flow-manager/repair-domain';
import { matchParts } from './match-parts.js';

function part(lineId: string, raw: string, lineNet?: string): PartLine {
  return {
    lineId,
    rawPartNumber: sourceValue(raw, { certainty: 'observed' }),
    partNumberNormalization: normalizePartNumberDeterministic(raw),
    ...(lineNet
      ? { lineNet: sourceValue(moneyFromMajorString('PLN', lineNet), { certainty: 'observed' }) }
      : {}),
  };
}

describe('human confirmed part overrides', () => {
  it('applies trusted override and computes line net delta', () => {
    const result = matchParts('PLN', [part('e1', '0007271300', '10.00')], [part('i1', 'A0007271300', '12.00')], {
      humanConfirmedOverrides: [
        {
          relationId: 'confirmed:1',
          estimateLineId: 'e1',
          invoiceLineId: 'i1',
          leftNormalizedNumber: '0007271300',
          rightNormalizedNumber: 'A0007271300',
          sourceCandidateId: 'c1',
        },
      ],
    });
    expect(result.matched).toHaveLength(1);
    expect(result.matched[0]?.matchMethod).toBe('human_confirmed');
    expect(result.matched[0]?.lineNetDelta?.minorUnits).toBe(200n);
  });

  it('baseline unchanged when no overrides passed', () => {
    const est = [part('e1', '0007271300')];
    const inv = [part('i1', 'A0007271300')];
    expect(matchParts('PLN', est, inv)).toEqual(matchParts('PLN', est, inv, {}));
  });
});
