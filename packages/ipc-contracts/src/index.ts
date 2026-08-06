/**
 * Explicit IPC allowlist for CM Flow Manager.
 * Renderer may only invoke channels listed here via the typed preload API.
 */

export {
  UpdateIpcChannels,
  type UpdateActionResult,
  type UpdateEventPayload,
  type UpdateIpcChannel,
  type UpdateSetAutoCheckRequest,
  type UpdateSetChannelRequest,
  type UpdateStatusSnapshot,
  type UpdateUiState,
} from './update.js';

import { UpdateIpcChannels, type UpdateIpcChannel } from './update.js';

export const IpcChannels = {
  AppGetVersion: 'app:getVersion',
  DialogOpenPdf: 'dialog:openPdf',
  DialogSavePdf: 'dialog:savePdf',
  PdfInspect: 'pdf:inspect',
  PdfUnlock: 'pdf:unlock',
  PdfPrepareSource: 'pdf:prepareSource',
  ShellOpenFolder: 'shell:openFolder',
  UpdateGetStatus: UpdateIpcChannels.GetStatus,
  UpdateCheck: UpdateIpcChannels.Check,
  UpdateDownload: UpdateIpcChannels.Download,
  UpdateInstall: UpdateIpcChannels.Install,
  UpdateSetChannel: UpdateIpcChannels.SetChannel,
  UpdateSetAutoCheck: UpdateIpcChannels.SetAutoCheck,
  UpdateOpenReleaseNotes: UpdateIpcChannels.OpenReleaseNotes,
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

export type PdfPrepareSourceRequest = {
  filePath: string;
};

export type PdfPrepareSourceResult =
  | {
      ok: true;
      filePath: string;
      fileName: string;
      fileSizeBytes: number;
      sourceDirectory: string;
      suggestedDestinationPath: string;
      encryptionStatus: 'encrypted' | 'unencrypted';
      pageCount?: number;
    }
  | {
      ok: false;
      code: 'invalid_pdf' | 'unavailable' | 'not_found' | 'bad_path' | 'destination_error';
      reason?: string;
    };

export type ShellOpenFolderRequest = {
  targetPath: string;
};

export type ShellOpenFolderResult =
  | { ok: true }
  | { ok: false; code: 'invalid_path' | 'not_found' | 'open_failed' };

/** Expand only with main-process validation. */
export const ALLOWED_INVOKE_CHANNELS: readonly IpcChannel[] = [
  IpcChannels.AppGetVersion,
  IpcChannels.DialogOpenPdf,
  IpcChannels.DialogSavePdf,
  IpcChannels.PdfInspect,
  IpcChannels.PdfUnlock,
  IpcChannels.PdfPrepareSource,
  IpcChannels.ShellOpenFolder,
  IpcChannels.UpdateGetStatus,
  IpcChannels.UpdateCheck,
  IpcChannels.UpdateDownload,
  IpcChannels.UpdateInstall,
  IpcChannels.UpdateSetChannel,
  IpcChannels.UpdateSetAutoCheck,
  IpcChannels.UpdateOpenReleaseNotes,
];

export const ALLOWED_PUSH_CHANNELS: readonly UpdateIpcChannel[] = [UpdateIpcChannels.Event];

export function isAllowedInvokeChannel(channel: string): channel is IpcChannel {
  return (ALLOWED_INVOKE_CHANNELS as readonly string[]).includes(channel);
}
