export const UpdateIpcChannels = {
  GetStatus: 'update:getStatus',
  Check: 'update:check',
  Download: 'update:download',
  Install: 'update:install',
  SetChannel: 'update:setChannel',
  SetAutoCheck: 'update:setAutoCheck',
  OpenReleaseNotes: 'update:openReleaseNotes',
  Event: 'update:event',
} as const;

export type UpdateIpcChannel = (typeof UpdateIpcChannels)[keyof typeof UpdateIpcChannels];

export type UpdateChannelDto = 'stable' | 'beta' | 'alpha' | 'development';
export type UpdatePolicyDto = 'optional' | 'recommended' | 'mandatory';

export type UpdateUiState =
  | 'idle'
  | 'checking'
  | 'available'
  | 'up-to-date'
  | 'offline'
  | 'downloading'
  | 'ready-to-install'
  | 'error'
  | 'unsupported';

export type UpdateStatusSnapshot = {
  currentVersion: string;
  channel: UpdateChannelDto;
  autoCheckEnabled: boolean;
  lastCheckedAt: string | null;
  latestVersion: string | null;
  minimumSupportedVersion: string | null;
  policy: UpdatePolicyDto | null;
  message: string | null;
  releaseNotesUrl: string | null;
  state: UpdateUiState;
  downloadProgress: number | null;
  errorCode: string | null;
  packaged: boolean;
  transportSupported: boolean;
  gate: {
    softBlockWorkSurfaces: boolean;
  };
};

export type UpdateSetChannelRequest = {
  channel: UpdateChannelDto;
};

export type UpdateSetAutoCheckRequest = {
  enabled: boolean;
};

export type UpdateActionResult =
  | { ok: true; status: UpdateStatusSnapshot }
  | { ok: false; code: string; status: UpdateStatusSnapshot };

export type UpdateEventPayload =
  | { type: 'checking' }
  | { type: 'available'; version: string }
  | { type: 'not-available' }
  | { type: 'progress'; percent: number }
  | { type: 'downloaded' }
  | { type: 'offline' }
  | { type: 'error'; code: string; message?: string }
  | { type: 'status'; status: UpdateStatusSnapshot };
