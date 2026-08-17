import type { Certainty, ExtractionOrigin } from './types.js';

/**
 * Traceability handle back to source evidence.
 * Coordinates are optional — formats that cannot provide them omit them.
 */
export type SourceRef = {
  readonly documentId?: string;
  readonly page?: number;
  readonly section?: string;
  readonly lineId?: string;
  readonly position?: number;
  readonly rawText?: string;
  readonly extractionOrigin?: ExtractionOrigin;
};

export type SourceValue<T> = {
  readonly value: T;
  readonly source?: SourceRef;
  readonly certainty?: Certainty;
};

export function sourceValue<T>(
  value: T,
  opts?: { source?: SourceRef; certainty?: Certainty },
): SourceValue<T> {
  return {
    value,
    ...(opts?.source ? { source: opts.source } : {}),
    ...(opts?.certainty ? { certainty: opts.certainty } : {}),
  };
}
