import { contextBridge, ipcRenderer, webUtils } from 'electron';
import {
  IpcChannels,
  type AppGetVersionResult,
  type DialogOpenPdfResult,
  type DialogSavePdfResult,
  type PdfInspectRequest,
  type PdfPrepareSourceRequest,
  type PdfPrepareSourceResult,
  type PdfUnlockRequest,
  type ShellOpenFolderRequest,
  type ShellOpenFolderResult,
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
