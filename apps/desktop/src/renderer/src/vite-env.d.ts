import type { AppGetVersionResult } from '@cm-flow-manager/ipc-contracts';

export type CmFlowApi = {
  getVersion: () => Promise<AppGetVersionResult>;
};

declare global {
  interface Window {
    cmFlow: CmFlowApi;
  }
}

export {};
