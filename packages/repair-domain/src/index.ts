export {
  CANONICAL_REPAIR_DOCUMENT_SCHEMA_VERSION,
  isCanonicalRepairDocument,
  isExtractionUnavailable,
} from './domain/document.js';
export type {
  CanonicalRepairDocument,
  CaseReference,
  DocumentSourceMeta,
  ExtractionUnavailableDocument,
  RepairDocumentInput,
  VehicleIdentity,
} from './domain/document.js';

export {
  absMoney,
  absoluteDifference,
  addMoney,
  assertSameCurrency,
  assertValidRatio,
  canonicalJsonReplacer,
  compareMoney,
  deserializeMoney,
  isValidDecimalString,
  isValidMoney,
  moneyEquals,
  moneyFromMajorString,
  moneyToMajorString,
  multiplyMoneyByRatio,
  negateMoney,
  ratioFromPercentMajor,
  ratioFromUnitFraction,
  serializeMoney,
  subtractMoney,
} from './domain/money.js';
export type { CurrencyCode, DecimalRatio, Money, RoundingMode, SerializedMoney } from './domain/money.js';

export { sourceValue } from './domain/source.js';
export type { SourceRef, SourceValue } from './domain/source.js';

export type {
  Certainty,
  DocumentSection,
  DocumentType,
  ExtractionOrigin,
  LabourUnit,
  NormalizationStatus,
  SourceFormat,
  TextLayerStatus,
} from './domain/types.js';

export { normalizePartNumberDeterministic } from './domain/part-number.js';
export type { PartNumberNormalization } from './domain/part-number.js';

export type { PartLine } from './domain/parts.js';

export { resolveLabourHours } from './domain/labour.js';
export type {
  LabourLine,
  LabourPresentation,
  LabourUnitConversion,
  NormalizedLabourHours,
} from './domain/labour.js';

export type {
  MaterialLine,
  PaintBlock,
  PaintOperationLine,
} from './domain/paint-materials.js';

export type {
  AdditionalCostLine,
  Normalia,
  NormaliaCalculationMethod,
} from './domain/normalia.js';

export type { DocumentTotals, TaxBreakdown } from './domain/totals.js';

export type { DocumentExtensions, UnknownField } from './domain/extensions.js';

export { validateRepairDocument } from './domain/validate.js';
export type { DocumentValidationResult, ValidationIssue, ValidationSeverity } from './domain/validate.js';

export {
  buildCase4a202Estimate,
  buildCase4a202Invoice,
  buildCase4a203Estimate,
  buildCase4a203Invoice,
  buildUnknownSparseDocument,
  case4a201EstimateUnavailable,
} from './fixtures/sanitized-cases.js';
