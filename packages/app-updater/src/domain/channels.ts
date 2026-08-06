export const UPDATE_CHANNELS = ['stable', 'beta', 'alpha', 'development'] as const;

export type UpdateChannel = (typeof UPDATE_CHANNELS)[number];

export const DEFAULT_UPDATE_CHANNEL: UpdateChannel = 'alpha';

export function isUpdateChannel(value: unknown): value is UpdateChannel {
  return typeof value === 'string' && (UPDATE_CHANNELS as readonly string[]).includes(value);
}
