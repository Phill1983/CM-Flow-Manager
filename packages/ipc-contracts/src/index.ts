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
  DialogOpenPdfs: 'dialog:openPdfs',
  DialogSavePdf: 'dialog:savePdf',
  PdfInspect: 'pdf:inspect',
  PdfUnlock: 'pdf:unlock',
  PdfPrepareSource: 'pdf:prepareSource',
  PdfPrepareExtractSource: 'pdf:prepareExtractSource',
  PdfPrepareMergeFile: 'pdf:prepareMergeFile',
  PdfExtractPages: 'pdf:extractPages',
  PdfMerge: 'pdf:merge',
  PdfGrantPreview: 'pdf:grantPreview',
  PdfRevokePreview: 'pdf:revokePreview',
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

export type DialogOpenPdfsResult = {
  canceled: boolean;
  filePaths?: string[];
};

export type DialogSavePdfResult = {
  canceled: boolean;
  filePath?: string;
};

export type DialogSavePdfRequest = {
  defaultPath?: string;
  title?: string;
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

export type PdfPrepareExtractSourceRequest = {
  filePath: string;
  pageSelection?: string;
  destinationDirectory?: string;
};

export type PdfPrepareExtractSourceResult =
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

export type PdfPrepareMergeFileRequest = {
  filePath: string;
};

export type PdfPrepareMergeFileResult =
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
      code: 'invalid_pdf' | 'unavailable' | 'not_found' | 'bad_path' | 'encrypted_pdf' | 'destination_error';
      reason?: string;
      fileName?: string;
    };

export type PdfExtractPagesRequest = {
  sourcePath: string;
  destinationPath: string;
  pageSelection: string;
};

export type PdfMergeRequest = {
  sourcePaths: string[];
  destinationPath: string;
};

export type PdfGrantPreviewRequest = {
  filePath: string;
};

export type PdfGrantPreviewResult =
  | { ok: true; token: string }
  | {
      ok: false;
      code: 'invalid_pdf' | 'unavailable' | 'not_found' | 'bad_path' | 'encrypted_pdf';
    };

export type PdfRevokePreviewRequest = {
  token: string;
};

export type PdfRevokePreviewResult = { ok: true };

const PREVIEW_TOKEN_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isPdfPreviewToken(value: string): boolean {
  return PREVIEW_TOKEN_RE.test(value);
}

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
];

export const ALLOWED_PUSH_CHANNELS: readonly UpdateIpcChannel[] = [UpdateIpcChannels.Event];

export function isAllowedInvokeChannel(channel: string): channel is IpcChannel {
  return (ALLOWED_INVOKE_CHANNELS as readonly string[]).includes(channel);
}
