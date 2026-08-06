import { contextBridge, ipcRenderer, webUtils } from 'electron';
import {
  IpcChannels,
  UpdateIpcChannels,
  type AppGetVersionResult,
  type DialogOpenPdfResult,
  type DialogSavePdfResult,
  type PdfInspectRequest,
  type PdfPrepareSourceRequest,
  type PdfPrepareSourceResult,
  type PdfUnlockRequest,
  type ShellOpenFolderRequest,
  type ShellOpenFolderResult,
  type UpdateActionResult,
  type UpdateEventPayload,
  type UpdateSetAutoCheckRequest,
  type UpdateSetChannelRequest,
  type UpdateStatusSnapshot,
} from '@cm-flow-manager/ipc-contracts';
import type { PdfInspectionResult, PdfUnlockResult } from '@cm-flow-manager/pdf-engine';

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
  savePdfDialog(defaultPath?: string): Promise<DialogSavePdfResult> {
    return ipcRenderer.invoke(IpcChannels.DialogSavePdf, { defaultPath }) as Promise<DialogSavePdfResult>;
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
