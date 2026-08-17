import type { SourceRef } from './source.js';

/** Preserve unrecognized source data without breaking the schema. */
export type UnknownField = {
  readonly key: string;
  readonly rawValue: string;
  readonly source?: SourceRef;
};

export type DocumentExtensions = {
  readonly unknownFields?: readonly UnknownField[];
  /** Free-form bags for future discovery — no comparison semantics. */
  readonly bags?: Readonly<Record<string, unknown>>;
};
