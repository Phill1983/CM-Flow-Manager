import { contextBridge, ipcRenderer } from 'electron';
import {
  IpcChannels,
  type AppGetVersionResult,
} from '@cm-flow-manager/ipc-contracts';

/**
 * Minimal typed bridge. Do not expose ipcRenderer, fs, or shell.
 */
const cmFlowApi = {
  getVersion(): Promise<AppGetVersionResult> {
    return ipcRenderer.invoke(IpcChannels.AppGetVersion) as Promise<AppGetVersionResult>;
  },
} as const;

export type CmFlowApi = typeof cmFlowApi;

contextBridge.exposeInMainWorld('cmFlow', cmFlowApi);
