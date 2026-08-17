import {
  isCanonicalRepairDocument,
  isExtractionUnavailable,
  type CanonicalRepairDocument,
  type ExtractionUnavailableDocument,
  type RepairDocumentInput,
  CANONICAL_REPAIR_DOCUMENT_SCHEMA_VERSION,
} from './document.js';
import { isValidDecimalString, isValidMoney, type Money } from './money.js';
import type { LabourUnitConversion } from './labour.js';

export type ValidationSeverity = 'error' | 'warning';

export type ValidationIssue = {
  readonly path: string;
  readonly code: string;
  readonly message: string;
  readonly severity: ValidationSeverity;
};

export type DocumentValidationResult = {
  readonly ok: boolean;
  readonly issues: readonly ValidationIssue[];
};

function err(path: string, code: string, message: string): ValidationIssue {
  return { path, code, message, severity: 'error' };
}

function warn(path: string, code: string, message: string): ValidationIssue {
  return { path, code, message, severity: 'warning' };
}

function validateMoneyField(path: string, money: Money | undefined, issues: ValidationIssue[]): void {
  if (money === undefined) return;
  if (!isValidMoney(money)) {
    issues.push(err(path, 'invalid_money', 'Money must have currency string and bigint minorUnits'));
  }
  if (money.currency.length === 0) {
    issues.push(err(path, 'empty_currency', 'Currency must be non-empty'));
  }
}

function validateConversion(
  path: string,
  conversion: LabourUnitConversion,
  issues: ValidationIssue[],
): void {
  if (!conversion.sourceUnit || !conversion.targetUnit) {
    issues.push(err(path, 'conversion_units_required', 'Labour conversion requires source and target units'));
  }
  if (conversion.sourceUnitsPerTargetUnit.denominator === 0n) {
    issues.push(err(path, 'conversion_denominator_zero', 'JC/RBG conversion denominator must be > 0'));
  }
  if (conversion.sourceUnitsPerTargetUnit.numerator <= 0n) {
    issues.push(err(path, 'conversion_numerator_invalid', 'JC/RBG conversion numerator must be > 0'));
  }
}

function validateCanonical(doc: CanonicalRepairDocument): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (doc.schemaVersion !== CANONICAL_REPAIR_DOCUMENT_SCHEMA_VERSION) {
    issues.push(
      warn(
        'schemaVersion',
        'schema_version_mismatch',
        `Expected schemaVersion ${CANONICAL_REPAIR_DOCUMENT_SCHEMA_VERSION}, got ${doc.schemaVersion}`,
      ),
    );
  }

  if (!doc.source?.documentId) {
    issues.push(err('source.documentId', 'document_id_required', 'documentId is required'));
  }

  if (doc.source?.documentType !== 'estimate' && doc.source?.documentType !== 'invoice') {
    issues.push(
      warn(
        'source.documentType',
        'document_type_nonstandard',
        `Document type "${String(doc.source?.documentType)}" is outside estimate|invoice`,
      ),
    );
  }

  if (!doc.currency || doc.currency.trim() === '') {
    issues.push(err('currency', 'currency_required', 'Currency is required'));
  }

  for (const [i, part] of (doc.parts ?? []).entries()) {
    if (!part.lineId) {
      issues.push(err(`parts[${i}].lineId`, 'line_id_required', 'Part lineId is required'));
    }
    validateMoneyField(`parts[${i}].lineNet`, part.lineNet?.value, issues);
    if (part.quantity?.value !== undefined) {
      if (!isValidDecimalString(part.quantity.value)) {
        issues.push(err(`parts[${i}].quantity`, 'quantity_invalid', 'Quantity must be a decimal string'));
      } else if (part.quantity.value.trim().startsWith('-')) {
        issues.push(err(`parts[${i}].quantity`, 'quantity_negative', 'Negative quantity is not supported'));
      }
    }
  }

  for (const [i, line] of (doc.labour ?? []).entries()) {
    if (!line.lineId) {
      issues.push(err(`labour[${i}].lineId`, 'line_id_required', 'Labour lineId is required'));
    }
    validateMoneyField(`labour[${i}].lineNet`, line.lineNet?.value, issues);
    if (line.quantity?.value !== undefined) {
      if (!isValidDecimalString(line.quantity.value)) {
        issues.push(err(`labour[${i}].quantity`, 'quantity_invalid', 'Quantity must be a decimal string'));
      } else if (line.quantity.value.trim().startsWith('-')) {
        issues.push(err(`labour[${i}].quantity`, 'quantity_negative', 'Negative quantity is not supported'));
      }
    }
  }

  for (const [i, conversion] of (doc.labourUnitConversions ?? []).entries()) {
    validateConversion(`labourUnitConversions[${i}]`, conversion, issues);
  }

  for (const [i, n] of (doc.normalia ?? []).entries()) {
    validateMoneyField(`normalia[${i}].amountNet`, n.amountNet?.value, issues);
    validateMoneyField(`normalia[${i}].calculationBase`, n.calculationBase?.value, issues);
  }

  validateMoneyField('totals.totalNet', doc.totals?.totalNet?.value, issues);
  validateMoneyField('totals.totalGross', doc.totals?.totalGross?.value, issues);
  validateMoneyField('totals.tax.taxAmount', doc.totals?.tax?.taxAmount?.value, issues);
  validateMoneyField('totals.tax.taxBase', doc.totals?.tax?.taxBase?.value, issues);

  return issues;
}

function validateUnavailable(doc: ExtractionUnavailableDocument): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!doc.source?.documentId) {
    issues.push(err('source.documentId', 'document_id_required', 'documentId is required'));
  }
  if (!doc.reason) {
    issues.push(err('reason', 'reason_required', 'Unavailable extraction requires a reason'));
  }
  return issues;
}

/** Structural invariants only — no business comparison rules. */
export function validateRepairDocument(doc: RepairDocumentInput): DocumentValidationResult {
  const issues = isExtractionUnavailable(doc)
    ? validateUnavailable(doc)
    : isCanonicalRepairDocument(doc)
      ? validateCanonical(doc)
      : [err('$', 'unknown_document_shape', 'Unrecognized document shape')];

  const errors = issues.filter((i) => i.severity === 'error');
  return { ok: errors.length === 0, issues };
}
