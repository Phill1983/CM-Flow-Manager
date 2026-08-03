/**
 * Explicit IPC allowlist for CM Flow Manager.
 * Renderer may only invoke channels listed here via the typed preload API.
 */

export const IpcChannels = {
  AppGetVersion: 'app:getVersion',
} as const;

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];

export type AppGetVersionResult = {
  version: string;
  name: string;
};

/** Phase 1 allowlist — expand only with main-process validation. */
export const ALLOWED_INVOKE_CHANNELS: readonly IpcChannel[] = [IpcChannels.AppGetVersion];

export function isAllowedInvokeChannel(channel: string): channel is IpcChannel {
  return (ALLOWED_INVOKE_CHANNELS as readonly string[]).includes(channel);
}
