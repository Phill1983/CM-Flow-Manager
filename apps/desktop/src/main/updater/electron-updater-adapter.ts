import { autoUpdater, type UpdateDownloadedEvent, type UpdateInfo } from 'electron-updater';
import type {
  AppUpdateTransportPort,
  UpdateCheckTransportResult,
  UpdateDownloadResult,
} from '@cm-flow-manager/app-updater';

export type ElectronUpdaterAdapterOptions = {
  channel: string;
  allowUnsigned: boolean;
  logger?: {
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
  };
};

/**
 * Transport adapter over electron-updater → GitHub Releases.
 * Download path is captured for SHA-256 verification before install.
 */
export class ElectronUpdaterAdapter implements AppUpdateTransportPort {
  private lastDownloadedFilePath: string | null = null;
  private lastUpdateInfo: UpdateInfo | null = null;

  constructor(
    private readonly packaged: boolean,
    private readonly options: ElectronUpdaterAdapterOptions,
  ) {
    if (!packaged) {
      return;
    }
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.channel = options.channel;
    // Unsigned Alpha: disable OS signature gate when allowUnsigned (SHA-256 still required).
    if (options.allowUnsigned) {
      (autoUpdater as unknown as { verifyUpdateCodeSignature?: boolean }).verifyUpdateCodeSignature = false;
    }
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'Phill1983',
      repo: 'CM-Flow-Manager',
    });
    if (options.logger) {
      autoUpdater.logger = {
        info: (m: string) => options.logger?.info(m),
        warn: (m: string) => options.logger?.warn(m),
        error: (m: string) => options.logger?.error(m),
        debug: (m: string) => options.logger?.info(m),
      } as typeof autoUpdater.logger;
    }

    autoUpdater.on('update-downloaded', (event: UpdateDownloadedEvent) => {
      this.lastUpdateInfo = event;
      this.lastDownloadedFilePath = event.downloadedFile || null;
    });
  }

  isSupported(): boolean {
    return this.packaged && this.options.channel !== 'development';
  }

  getCachedUpdateFilePath(): string | null {
    return this.lastDownloadedFilePath;
  }

  getUpdateInfo(): UpdateInfo | null {
    return this.lastUpdateInfo;
  }

  setChannel(channel: string): void {
    this.options.channel = channel;
    if (this.packaged) {
      autoUpdater.channel = channel;
    }
  }

  async checkForUpdates(): Promise<UpdateCheckTransportResult> {
    if (!this.isSupported()) {
      return { status: 'error', message: 'unsupported' };
    }
    try {
      const result = await autoUpdater.checkForUpdates();
      if (!result?.updateInfo?.version) {
        return { status: 'not-available' };
      }
      this.lastUpdateInfo = result.updateInfo;
      return {
        status: 'available',
        version: result.updateInfo.version,
        releaseName: result.updateInfo.releaseName ?? undefined,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'update_check_failed';
      if (/ENOTFOUND|ECONNREFUSED|net::|offline|getaddrinfo/i.test(message)) {
        return { status: 'offline', message };
      }
      return { status: 'error', message };
    }
  }

  async downloadUpdate(): Promise<UpdateDownloadResult> {
    if (!this.isSupported()) {
      return { ok: false, code: 'unsupported' };
    }
    try {
      await autoUpdater.downloadUpdate();
      return { ok: true, filePath: this.lastDownloadedFilePath ?? undefined };
    } catch (error) {
      return {
        ok: false,
        code: 'download_failed',
        message: error instanceof Error ? error.message : 'download_failed',
      };
    }
  }

  quitAndInstall(): void {
    autoUpdater.quitAndInstall(false, true);
  }

  onProgress(handler: (percent: number) => void): void {
    if (!this.packaged) return;
    autoUpdater.on('download-progress', (progress) => {
      handler(Math.max(0, Math.min(100, progress.percent)));
    });
  }
}
