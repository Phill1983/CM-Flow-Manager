import { describe, expect, it } from 'vitest';
import {
  acceptSinglePdfDrop,
  canChangeSelection,
  canUnlock,
  formatFileSizeBytes,
  getPdfPasswordRemoverModuleInfo,
  hasPdfFileName,
  isBusyState,
  isSafeUserFacingErrorKey,
  mapPrepareFailure,
  mapUnlockResult,
  passwordRequiredFor,
  shouldClearPasswordAfterOutcome,
} from './index';

describe('pdf-password-remover module info', () => {
  it('marks engine available for Phase 3A', () => {
    const info = getPdfPasswordRemoverModuleInfo();
    expect(info.engineAvailable).toBe(true);
    expect(info.route).toBe('/pdf-tools/password-remover');
  });
});

describe('PDF acceptance', () => {
  it('accepts a single PDF', () => {
    expect(acceptSinglePdfDrop([{ name: 'report.PDF' }])).toEqual({ accepted: true });
    expect(hasPdfFileName('a.pdf')).toBe(true);
  });

  it('rejects non-PDF and multiple files', () => {
    expect(acceptSinglePdfDrop([{ name: 'photo.png' }])).toEqual({
      accepted: false,
      reason: 'unsupported_type',
    });
    expect(acceptSinglePdfDrop([{ name: 'a.pdf' }, { name: 'b.pdf' }])).toEqual({
      accepted: false,
      reason: 'multiple_files',
    });
    expect(acceptSinglePdfDrop([])).toEqual({ accepted: false, reason: 'empty' });
  });
});

describe('processing control helpers', () => {
  it('disables selection while busy', () => {
    expect(isBusyState('unlocking')).toBe(true);
    expect(canChangeSelection('unlocking')).toBe(false);
    expect(canChangeSelection('ready')).toBe(true);
  });

  it('requires password only for encrypted PDFs', () => {
    expect(
      passwordRequiredFor({
        filePath: 'C:\\a.pdf',
        fileName: 'a.pdf',
        fileSizeBytes: 1,
        sourceDirectory: 'C:\\',
        encryptionStatus: 'encrypted',
      }),
    ).toBe(true);
    expect(
      passwordRequiredFor({
        filePath: 'C:\\a.pdf',
        fileName: 'a.pdf',
        fileSizeBytes: 1,
        sourceDirectory: 'C:\\',
        encryptionStatus: 'unencrypted',
      }),
    ).toBe(false);
  });

  it('blocks unlock without password when required', () => {
    expect(canUnlock('ready', true, '')).toBe(false);
    expect(canUnlock('ready', true, 'secret')).toBe(true);
    expect(canUnlock('ready', false, '')).toBe(true);
    expect(canUnlock('unlocking', true, 'secret')).toBe(false);
    expect(canUnlock('incorrect_password', true, 'secret')).toBe(true);
  });
});

describe('error mapping', () => {
  it('maps incorrect password without exposing technical details', () => {
    const mapped = mapUnlockResult({ status: 'incorrect_password' });
    expect(mapped.state).toBe('incorrect_password');
    expect(mapped.messageKey).toBe('passwordRemover.error.incorrectPassword');
    expect(isSafeUserFacingErrorKey(mapped.messageKey)).toBe(true);
  });

  it('maps unlock success', () => {
    const mapped = mapUnlockResult({
      status: 'unlocked',
      destinationPath: 'C:\\out_unlocked.pdf',
    });
    expect(mapped.state).toBe('success');
    expect(mapped.messageKey).toBe('passwordRemover.status.success');
  });

  it('maps destination and engine failures to localized keys', () => {
    expect(
      mapUnlockResult({
        status: 'failed',
        category: 'DestinationExists',
        message: 'raw stderr must not leak',
      }),
    ).toEqual({
      state: 'destination_error',
      messageKey: 'passwordRemover.error.destinationCollision',
    });
    expect(
      mapUnlockResult({
        status: 'failed',
        category: 'EngineUnavailable',
        message: 'qpdf missing',
      }).messageKey,
    ).toBe('passwordRemover.error.engineUnavailable');
    expect(mapPrepareFailure('invalid_pdf').state).toBe('invalid_pdf');
    expect(mapPrepareFailure('destination_error').messageKey).toBe(
      'passwordRemover.error.destinationCollision',
    );
  });
});

describe('formatFileSizeBytes', () => {
  it('formats common sizes', () => {
    expect(formatFileSizeBytes(500)).toBe('500 B');
    expect(formatFileSizeBytes(2048)).toBe('2 KB');
    expect(formatFileSizeBytes(5 * 1024 * 1024)).toBe('5 MB');
  });
});

describe('password policy', () => {
  it('clears after success but not incorrect password', () => {
    expect(shouldClearPasswordAfterOutcome('success')).toBe(true);
    expect(shouldClearPasswordAfterOutcome('incorrect_password')).toBe(false);
  });
});
