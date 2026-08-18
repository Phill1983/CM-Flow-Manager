/// <reference types="vite/client" />

import type {
  AppGetVersionResult,
  DialogOpenPdfResult,
  DialogOpenPdfsResult,
  DialogSavePdfResult,
  PdfExtractPagesRequest,
  PdfGrantPreviewResult,
  PdfMergeRequest,
  PdfPrepareExtractSourceResult,
  PdfPrepareMergeFileResult,
  PdfPrepareSourceResult,
  PdfRevokePreviewResult,
  PdfUnlockRequest,
  ShellOpenFolderResult,
  UpdateActionResult,
  UpdateEventPayload,
  UpdateSetChannelRequest,
  UpdateStatusSnapshot,
} from '@cm-flow-manager/ipc-contracts';
import type {
  PdfExtractPagesResult,
  PdfInspectionResult,
  PdfMergeResult,
  PdfUnlockResult,
} from '@cm-flow-manager/pdf-engine';

export type CmFlowApi = {
  getVersion: () => Promise<AppGetVersionResult>;
  openPdfDialog: () => Promise<DialogOpenPdfResult>;
  openPdfsDialog: () => Promise<DialogOpenPdfsResult>;
  savePdfDialog: (defaultPath?: string, title?: string) => Promise<DialogSavePdfResult>;
  inspectPdf: (filePath: string) => Promise<PdfInspectionResult>;
  unlockPdf: (input: PdfUnlockRequest) => Promise<PdfUnlockResult>;
  preparePdfSource: (filePath: string) => Promise<PdfPrepareSourceResult>;
  prepareExtractSource: (
    filePath: string,
    pageSelection?: string,
    destinationDirectory?: string,
  ) => Promise<PdfPrepareExtractSourceResult>;
  prepareMergeFile: (filePath: string) => Promise<PdfPrepareMergeFileResult>;
  extractPdfPages: (input: PdfExtractPagesRequest) => Promise<PdfExtractPagesResult>;
  mergePdfs: (input: PdfMergeRequest) => Promise<PdfMergeResult>;
  grantPdfPreview: (filePath: string) => Promise<PdfGrantPreviewResult>;
  revokePdfPreview: (token: string) => Promise<PdfRevokePreviewResult>;
  previewUrlForToken: (token: string) => string | null;
  openFolder: (targetPath: string) => Promise<ShellOpenFolderResult>;
  getUpdateStatus: () => Promise<UpdateStatusSnapshot>;
  checkForUpdates: () => Promise<UpdateActionResult>;
  downloadUpdate: () => Promise<UpdateActionResult>;
  installUpdate: () => Promise<UpdateActionResult>;
  setUpdateChannel: (channel: UpdateSetChannelRequest['channel']) => Promise<UpdateActionResult>;
  setUpdateAutoCheck: (enabled: boolean) => Promise<UpdateActionResult>;
  openReleaseNotes: () => Promise<UpdateActionResult>;
  onUpdateEvent: (listener: (payload: UpdateEventPayload) => void) => () => void;
  getPathForFile: (file: File) => string;
};

declare global {
  interface Window {
    cmFlow: CmFlowApi;
  }
}

export {};
