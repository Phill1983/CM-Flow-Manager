import { describe, expect, it } from 'vitest';
import { ALLOWED_INVOKE_CHANNELS, IpcChannels, isAllowedInvokeChannel } from './index';

describe('ipc allowlist', () => {
  it('exposes Phase 3A allowlisted channels', () => {
    expect(ALLOWED_INVOKE_CHANNELS).toEqual([
      IpcChannels.AppGetVersion,
      IpcChannels.DialogOpenPdf,
      IpcChannels.DialogSavePdf,
      IpcChannels.PdfInspect,
      IpcChannels.PdfUnlock,
      IpcChannels.PdfPrepareSource,
      IpcChannels.ShellOpenFolder,
    ]);
  });

  it('rejects unknown channels', () => {
    expect(isAllowedInvokeChannel('shell:exec')).toBe(false);
    expect(isAllowedInvokeChannel(IpcChannels.ShellOpenFolder)).toBe(true);
    expect(isAllowedInvokeChannel(IpcChannels.PdfPrepareSource)).toBe(true);
  });
});
