import { describe, expect, it } from 'vitest';
import { ALLOWED_INVOKE_CHANNELS, IpcChannels, isAllowedInvokeChannel, isPdfPreviewToken } from './index';

describe('ipc allowlist', () => {
  it('exposes Phase 3A + 3.6 allowlisted channels', () => {
    expect(ALLOWED_INVOKE_CHANNELS).toEqual([
      IpcChannels.AppGetVersion,
      IpcChannels.DialogOpenPdf,
      IpcChannels.DialogOpenPdfs,
      IpcChannels.DialogSavePdf,
      IpcChannels.PdfInspect,
      IpcChannels.PdfUnlock,
      IpcChannels.PdfPrepareSource,
      IpcChannels.PdfPrepareExtractSource,
      IpcChannels.PdfPrepareMergeFile,
      IpcChannels.PdfExtractPages,
      IpcChannels.PdfMerge,
      IpcChannels.PdfGrantPreview,
      IpcChannels.PdfRevokePreview,
      IpcChannels.ShellOpenFolder,
      IpcChannels.UpdateGetStatus,
      IpcChannels.UpdateCheck,
      IpcChannels.UpdateDownload,
      IpcChannels.UpdateInstall,
      IpcChannels.UpdateSetChannel,
      IpcChannels.UpdateSetAutoCheck,
      IpcChannels.UpdateOpenReleaseNotes,
    ]);
  });

  it('rejects unknown channels', () => {
    expect(isAllowedInvokeChannel('shell:exec')).toBe(false);
    expect(isAllowedInvokeChannel(IpcChannels.ShellOpenFolder)).toBe(true);
    expect(isAllowedInvokeChannel(IpcChannels.PdfPrepareSource)).toBe(true);
    expect(isAllowedInvokeChannel(IpcChannels.UpdateCheck)).toBe(true);
    expect(isAllowedInvokeChannel(IpcChannels.PdfGrantPreview)).toBe(true);
    expect(isAllowedInvokeChannel(IpcChannels.PdfRevokePreview)).toBe(true);
  });

  it('accepts opaque preview tokens only', () => {
    expect(isPdfPreviewToken('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee')).toBe(true);
    expect(isPdfPreviewToken('not-a-token')).toBe(false);
    expect(isPdfPreviewToken('../secret')).toBe(false);
  });
});
