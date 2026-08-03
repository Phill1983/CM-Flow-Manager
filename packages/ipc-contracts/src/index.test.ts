import { describe, expect, it } from 'vitest';
import { ALLOWED_INVOKE_CHANNELS, IpcChannels, isAllowedInvokeChannel } from './index';

describe('ipc allowlist', () => {
  it('exposes only Phase 1 channels', () => {
    expect(ALLOWED_INVOKE_CHANNELS).toEqual([IpcChannels.AppGetVersion]);
  });

  it('rejects unknown channels', () => {
    expect(isAllowedInvokeChannel('shell:exec')).toBe(false);
    expect(isAllowedInvokeChannel(IpcChannels.AppGetVersion)).toBe(true);
  });
});
