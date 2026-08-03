/**
 * Explicit IPC allowlist for CM Flow Manager.
 * Renderer may only invoke channels listed here via the typed preload API.
 */

export const IpcChannels = {
  AppGetVersion: 'app:getVersion',
  DialogOpenPdf: 'dialog:openPdf',
  DialogSavePdf: 'dialog:savePdf',
  PdfInspect: 'pdf:inspect',
  PdfUnlock: 'pdf:unlock',
} as const;

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];

export type AppGetVersionResult = {
  version: string;
  name: string;
};

export type DialogOpenPdfResult = {
  canceled: boolean;
  filePath?: string;
};

export type DialogSavePdfResult = {
  canceled: boolean;
  filePath?: string;
};

export type PdfInspectRequest = {
  filePath: string;
};

export type PdfUnlockRequest = {
  sourcePath: string;
  destinationPath: string;
  password: string;
};

/** Expand only with main-process validation. */
export const ALLOWED_INVOKE_CHANNELS: readonly IpcChannel[] = [
  IpcChannels.AppGetVersion,
  IpcChannels.DialogOpenPdf,
  IpcChannels.DialogSavePdf,
  IpcChannels.PdfInspect,
  IpcChannels.PdfUnlock,
];

export function isAllowedInvokeChannel(channel: string): channel is IpcChannel {
  return (ALLOWED_INVOKE_CHANNELS as readonly string[]).includes(channel);
}
