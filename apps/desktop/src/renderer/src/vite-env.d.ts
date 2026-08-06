/// <reference types="vite/client" />

import type {
  AppGetVersionResult,
  DialogOpenPdfResult,
  DialogSavePdfResult,
  PdfPrepareSourceResult,
  PdfUnlockRequest,
  ShellOpenFolderResult,
  UpdateActionResult,
  UpdateEventPayload,
  UpdateSetChannelRequest,
  UpdateStatusSnapshot,
} from '@cm-flow-manager/ipc-contracts';
import type { PdfInspectionResult, PdfUnlockResult } from '@cm-flow-manager/pdf-engine';

export type CmFlowApi = {
  getVersion: () => Promise<AppGetVersionResult>;
  openPdfDialog: () => Promise<DialogOpenPdfResult>;
  savePdfDialog: (defaultPath?: string) => Promise<DialogSavePdfResult>;
  inspectPdf: (filePath: string) => Promise<PdfInspectionResult>;
  unlockPdf: (input: PdfUnlockRequest) => Promise<PdfUnlockResult>;
  preparePdfSource: (filePath: string) => Promise<PdfPrepareSourceResult>;
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
