import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  DEFAULT_UPDATE_CHANNEL,
  isUpdateChannel,
  type UpdateChannel,
} from '@cm-flow-manager/app-updater';

export type UpdatePreferences = {
  channel: UpdateChannel;
  autoCheckEnabled: boolean;
  lastCheckedAt: string | null;
};

const DEFAULTS: UpdatePreferences = {
  channel: DEFAULT_UPDATE_CHANNEL,
  autoCheckEnabled: true,
  lastCheckedAt: null,
};

export class UpdatePreferencesStore {
  constructor(private readonly filePath: string) {}

  load(): UpdatePreferences {
    try {
      if (!existsSync(this.filePath)) {
        return { ...DEFAULTS };
      }
      const raw = JSON.parse(readFileSync(this.filePath, 'utf8')) as Partial<UpdatePreferences>;
      return {
        channel: isUpdateChannel(raw.channel) ? raw.channel : DEFAULTS.channel,
        autoCheckEnabled: typeof raw.autoCheckEnabled === 'boolean' ? raw.autoCheckEnabled : true,
        lastCheckedAt: typeof raw.lastCheckedAt === 'string' ? raw.lastCheckedAt : null,
      };
    } catch {
      return { ...DEFAULTS };
    }
  }

  save(next: UpdatePreferences): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  }
}

export function defaultPreferencesPath(userDataPath: string): string {
  return join(userDataPath, 'update-preferences.json');
}
