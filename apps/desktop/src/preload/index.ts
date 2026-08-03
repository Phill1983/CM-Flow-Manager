import { contextBridge, ipcRenderer } from 'electron';
import {
  IpcChannels,
  type AppGetVersionResult,
  type DialogOpenPdfResult,
  type DialogSavePdfResult,
  type PdfInspectRequest,
  type PdfUnlockRequest,
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
} as const;

export type CmFlowApi = typeof cmFlowApi;

contextBridge.exposeInMainWorld('cmFlow', cmFlowApi);
