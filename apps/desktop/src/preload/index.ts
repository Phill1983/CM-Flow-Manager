import { contextBridge, ipcRenderer, webUtils } from 'electron';
import {
  IpcChannels,
  UpdateIpcChannels,
  type AppGetVersionResult,
  type DialogOpenPdfResult,
  type DialogOpenPdfsResult,
  type DialogSavePdfResult,
  type PdfExtractPagesRequest,
  type PdfGrantPreviewRequest,
  type PdfGrantPreviewResult,
  type PdfInspectRequest,
  type PdfMergeRequest,
  type PdfPrepareExtractSourceRequest,
  type PdfPrepareExtractSourceResult,
  type PdfPrepareMergeFileRequest,
  type PdfPrepareMergeFileResult,
  type PdfPrepareSourceRequest,
  type PdfPrepareSourceResult,
  type PdfRevokePreviewRequest,
  type PdfRevokePreviewResult,
  type PdfUnlockRequest,
  isPdfPreviewToken,
  type ShellOpenFolderRequest,
  type ShellOpenFolderResult,
  type UpdateActionResult,
  type UpdateEventPayload,
  type UpdateSetAutoCheckRequest,
  type UpdateSetChannelRequest,
  type UpdateStatusSnapshot,
} from '@cm-flow-manager/ipc-contracts';
import type {
  PdfExtractPagesResult,
  PdfInspectionResult,
  PdfMergeResult,
  PdfUnlockResult,
} from '@cm-flow-manager/pdf-engine';

/**
 * Minimal typed bridge. Do not expose ipcRenderer, fs, or shell.
 */
const cmFlowApi = {
  getVersion(): Promise<AppGetVersionResult> {
    return ipcRenderer.invoke(IpcChannels.AppGetVersion) as Promise<AppGetVersionResult>;
  },
  openPdfDialog(): Promise<DialogOpenPdfResult> {
    return ipcRenderer.invoke(IpcChannels.DialogOpenPdf) as Promise<DialogOpenPdfResult>;
  },
  openPdfsDialog(): Promise<DialogOpenPdfsResult> {
    return ipcRenderer.invoke(IpcChannels.DialogOpenPdfs) as Promise<DialogOpenPdfsResult>;
  },
  savePdfDialog(defaultPath?: string, title?: string): Promise<DialogSavePdfResult> {
    return ipcRenderer.invoke(IpcChannels.DialogSavePdf, { defaultPath, title }) as Promise<DialogSavePdfResult>;
  },
  inspectPdf(filePath: string): Promise<PdfInspectionResult> {
    const payload: PdfInspectRequest = { filePath };
    return ipcRenderer.invoke(IpcChannels.PdfInspect, payload) as Promise<PdfInspectionResult>;
  },
  unlockPdf(input: PdfUnlockRequest): Promise<PdfUnlockResult> {
    return ipcRenderer.invoke(IpcChannels.PdfUnlock, input) as Promise<PdfUnlockResult>;
  },
  preparePdfSource(filePath: string): Promise<PdfPrepareSourceResult> {
    const payload: PdfPrepareSourceRequest = { filePath };
    return ipcRenderer.invoke(IpcChannels.PdfPrepareSource, payload) as Promise<PdfPrepareSourceResult>;
  },
  prepareExtractSource(
    filePath: string,
    pageSelection?: string,
    destinationDirectory?: string,
  ): Promise<PdfPrepareExtractSourceResult> {
    const payload: PdfPrepareExtractSourceRequest = { filePath, pageSelection, destinationDirectory };
    return ipcRenderer.invoke(IpcChannels.PdfPrepareExtractSource, payload) as Promise<PdfPrepareExtractSourceResult>;
  },
  prepareMergeFile(filePath: string): Promise<PdfPrepareMergeFileResult> {
    const payload: PdfPrepareMergeFileRequest = { filePath };
    return ipcRenderer.invoke(IpcChannels.PdfPrepareMergeFile, payload) as Promise<PdfPrepareMergeFileResult>;
  },
  extractPdfPages(input: PdfExtractPagesRequest): Promise<PdfExtractPagesResult> {
    return ipcRenderer.invoke(IpcChannels.PdfExtractPages, input) as Promise<PdfExtractPagesResult>;
  },
  mergePdfs(input: PdfMergeRequest): Promise<PdfMergeResult> {
    return ipcRenderer.invoke(IpcChannels.PdfMerge, input) as Promise<PdfMergeResult>;
  },
  grantPdfPreview(filePath: string): Promise<PdfGrantPreviewResult> {
    const payload: PdfGrantPreviewRequest = { filePath };
    return ipcRenderer.invoke(IpcChannels.PdfGrantPreview, payload) as Promise<PdfGrantPreviewResult>;
  },
  revokePdfPreview(token: string): Promise<PdfRevokePreviewResult> {
    const payload: PdfRevokePreviewRequest = { token };
    return ipcRenderer.invoke(IpcChannels.PdfRevokePreview, payload) as Promise<PdfRevokePreviewResult>;
  },
  previewUrlForToken(token: string): string | null {
    if (!isPdfPreviewToken(token)) {
      return null;
    }
    return `cmflow-pdf://preview/${token}`;
  },
  openFolder(targetPath: string): Promise<ShellOpenFolderResult> {
    const payload: ShellOpenFolderRequest = { targetPath };
    return ipcRenderer.invoke(IpcChannels.ShellOpenFolder, payload) as Promise<ShellOpenFolderResult>;
  },
  getUpdateStatus(): Promise<UpdateStatusSnapshot> {
    return ipcRenderer.invoke(IpcChannels.UpdateGetStatus) as Promise<UpdateStatusSnapshot>;
  },
  checkForUpdates(): Promise<UpdateActionResult> {
    return ipcRenderer.invoke(IpcChannels.UpdateCheck) as Promise<UpdateActionResult>;
  },
  downloadUpdate(): Promise<UpdateActionResult> {
    return ipcRenderer.invoke(IpcChannels.UpdateDownload) as Promise<UpdateActionResult>;
  },
  installUpdate(): Promise<UpdateActionResult> {
    return ipcRenderer.invoke(IpcChannels.UpdateInstall) as Promise<UpdateActionResult>;
  },
  setUpdateChannel(channel: UpdateSetChannelRequest['channel']): Promise<UpdateActionResult> {
    const payload: UpdateSetChannelRequest = { channel };
    return ipcRenderer.invoke(IpcChannels.UpdateSetChannel, payload) as Promise<UpdateActionResult>;
  },
  setUpdateAutoCheck(enabled: boolean): Promise<UpdateActionResult> {
    const payload: UpdateSetAutoCheckRequest = { enabled };
    return ipcRenderer.invoke(IpcChannels.UpdateSetAutoCheck, payload) as Promise<UpdateActionResult>;
  },
  openReleaseNotes(): Promise<UpdateActionResult> {
    return ipcRenderer.invoke(IpcChannels.UpdateOpenReleaseNotes) as Promise<UpdateActionResult>;
  },
  onUpdateEvent(listener: (payload: UpdateEventPayload) => void): () => void {
    const handler = (_event: Electron.IpcRendererEvent, payload: UpdateEventPayload): void => {
      listener(payload);
    };
    ipcRenderer.on(UpdateIpcChannels.Event, handler);
    return () => {
      ipcRenderer.removeListener(UpdateIpcChannels.Event, handler);
    };
  },
  /**
   * Resolve a dropped File to an absolute path (Electron webUtils).
   * Does not expose arbitrary filesystem APIs.
   */
  getPathForFile(file: File): string {
    return webUtils.getPathForFile(file);
  },
} as const;

export type CmFlowApi = typeof cmFlowApi;

contextBridge.exposeInMainWorld('cmFlow', cmFlowApi);
