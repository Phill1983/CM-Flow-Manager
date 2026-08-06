import { app, BrowserWindow, ipcMain, shell } from 'electron';
import {
  evaluateUpdate,
  isOlderThan,
  isUpdateChannel,
  type UpdateChannel,
  type VersionManifest,
} from '@cm-flow-manager/app-updater';
import {
  UpdateIpcChannels,
  type UpdateActionResult,
  type UpdateEventPayload,
  type UpdateSetAutoCheckRequest,
  type UpdateSetChannelRequest,
  type UpdateStatusSnapshot,
  type UpdateUiState,
} from '@cm-flow-manager/ipc-contracts';
import { AuthenticodeStub } from './authenticode-stub';
import { ElectronUpdaterAdapter } from './electron-updater-adapter';
import { GithubManifestFetcher } from './github-manifest-fetcher';
import { defaultPreferencesPath, UpdatePreferencesStore } from './preferences-store';
import { Sha256IntegrityService } from './sha256-integrity';

type UpdaterRuntime = {
  prefs: UpdatePreferencesStore;
  transport: ElectronUpdaterAdapter;
  manifestFetcher: GithubManifestFetcher;
  integrity: Sha256IntegrityService;
  signature: AuthenticodeStub;
  manifest: VersionManifest | null;
  state: UpdateUiState;
  downloadProgress: number | null;
  errorCode: string | null;
  softBlock: boolean;
};

function broadcast(payload: UpdateEventPayload): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(UpdateIpcChannels.Event, payload);
  }
}

function buildSnapshot(runtime: UpdaterRuntime): UpdateStatusSnapshot {
  const prefs = runtime.prefs.load();
  const evaluation = runtime.manifest
    ? evaluateUpdate(app.getVersion(), runtime.manifest)
    : null;

  return {
    currentVersion: app.getVersion(),
    channel: prefs.channel,
    autoCheckEnabled: prefs.autoCheckEnabled,
    lastCheckedAt: prefs.lastCheckedAt,
    latestVersion: runtime.manifest?.latestVersion ?? null,
    minimumSupportedVersion: runtime.manifest?.minimumSupportedVersion ?? null,
    policy: evaluation?.policy ?? runtime.manifest?.policy ?? null,
    message: runtime.manifest?.message || null,
    releaseNotesUrl: runtime.manifest?.releaseNotesUrl ?? null,
    state: runtime.state,
    downloadProgress: runtime.downloadProgress,
    errorCode: runtime.errorCode,
    packaged: app.isPackaged,
    transportSupported: runtime.transport.isSupported(),
    gate: {
      softBlockWorkSurfaces: evaluation?.softBlockWorkSurfaces ?? runtime.softBlock,
    },
  };
}

export function createUpdaterRuntime(): UpdaterRuntime {
  const prefs = new UpdatePreferencesStore(defaultPreferencesPath(app.getPath('userData')));
  const preferences = prefs.load();
  const transport = new ElectronUpdaterAdapter(app.isPackaged, {
    channel: preferences.channel,
    allowUnsigned: true,
    logger: {
      info: (m) => console.info('[updater]', m),
      warn: (m) => console.warn('[updater]', m),
      error: (m) => console.error('[updater]', m),
    },
  });
  transport.onProgress((percent) => {
    // filled after runtime exists via register
    void percent;
  });

  return {
    prefs,
    transport,
    manifestFetcher: new GithubManifestFetcher(),
    integrity: new Sha256IntegrityService(),
    signature: new AuthenticodeStub(),
    manifest: null,
    state: app.isPackaged ? 'idle' : 'unsupported',
    downloadProgress: null,
    errorCode: null,
    softBlock: false,
  };
}

export function registerUpdateIpc(runtime: UpdaterRuntime): void {
  runtime.transport.onProgress((percent) => {
    runtime.downloadProgress = percent;
    runtime.state = 'downloading';
    broadcast({ type: 'progress', percent });
    broadcast({ type: 'status', status: buildSnapshot(runtime) });
  });

  const respond = (): UpdateStatusSnapshot => buildSnapshot(runtime);

  ipcMain.removeHandler(UpdateIpcChannels.GetStatus);
  ipcMain.handle(UpdateIpcChannels.GetStatus, (): UpdateStatusSnapshot => respond());

  ipcMain.removeHandler(UpdateIpcChannels.Check);
  ipcMain.handle(UpdateIpcChannels.Check, async (): Promise<UpdateActionResult> => {
    if (!app.isPackaged) {
      runtime.state = 'unsupported';
      runtime.errorCode = 'dev_build';
      return { ok: false, code: 'dev_build', status: respond() };
    }

    runtime.state = 'checking';
    runtime.errorCode = null;
    broadcast({ type: 'checking' });

    const prefs = runtime.prefs.load();
    const manifest = await runtime.manifestFetcher.fetch(prefs.channel);
    runtime.manifest = manifest;

    const transportResult = await runtime.transport.checkForUpdates();
    prefs.lastCheckedAt = new Date().toISOString();
    runtime.prefs.save(prefs);

    if (transportResult.status === 'offline') {
      runtime.state = 'offline';
      runtime.errorCode = 'offline';
      broadcast({ type: 'offline' });
      return { ok: false, code: 'offline', status: respond() };
    }

    if (manifest) {
      const evaluation = evaluateUpdate(app.getVersion(), manifest);
      runtime.softBlock = evaluation.softBlockWorkSurfaces;
      if (evaluation.hasUpdate) {
        runtime.state = 'available';
        broadcast({ type: 'available', version: manifest.latestVersion });
        return { ok: true, status: respond() };
      }
    }

    if (transportResult.status === 'available') {
      const current = app.getVersion();
      if (isOlderThan(current, transportResult.version)) {
        runtime.state = 'available';
        broadcast({ type: 'available', version: transportResult.version });
        return { ok: true, status: respond() };
      }
    }

    if (transportResult.status === 'error' && !manifest) {
      runtime.state = 'error';
      runtime.errorCode = 'check_failed';
      broadcast({ type: 'error', code: 'check_failed', message: transportResult.message });
      return { ok: false, code: 'check_failed', status: respond() };
    }

    runtime.state = 'up-to-date';
    broadcast({ type: 'not-available' });
    return { ok: true, status: respond() };
  });

  ipcMain.removeHandler(UpdateIpcChannels.Download);
  ipcMain.handle(UpdateIpcChannels.Download, async (): Promise<UpdateActionResult> => {
    if (!app.isPackaged) {
      return { ok: false, code: 'dev_build', status: respond() };
    }
    if (runtime.state !== 'available' && runtime.state !== 'ready-to-install' && runtime.state !== 'error') {
      // allow retry from available primarily
    }

    runtime.state = 'downloading';
    runtime.downloadProgress = 0;
    runtime.errorCode = null;

    const download = await runtime.transport.downloadUpdate();
    if (!download.ok) {
      runtime.state = 'error';
      runtime.errorCode = download.code;
      broadcast({ type: 'error', code: download.code, message: download.message });
      return { ok: false, code: download.code, status: respond() };
    }

    const filePath = download.filePath ?? runtime.transport.getCachedUpdateFilePath();
    const expected =
      runtime.manifest?.artifacts.nsis?.sha256 ?? runtime.manifest?.artifacts.portable?.sha256;

    if (filePath && expected) {
      const verify = await runtime.integrity.verifySha256(filePath, expected);
      if (!verify.ok) {
        runtime.state = 'error';
        runtime.errorCode = `integrity_${verify.code}`;
        broadcast({ type: 'error', code: `integrity_${verify.code}` });
        return { ok: false, code: `integrity_${verify.code}`, status: respond() };
      }
    } else if (runtime.manifest && !expected) {
      runtime.state = 'error';
      runtime.errorCode = 'integrity_missing_hash';
      return { ok: false, code: 'integrity_missing_hash', status: respond() };
    }

    if (runtime.manifest?.signing.authenticodeRequired) {
      const signature = await runtime.signature.verifyAuthenticode(filePath ?? '');
      if (!signature.ok) {
        runtime.state = 'error';
        runtime.errorCode = `signature_${signature.code}`;
        return { ok: false, code: `signature_${signature.code}`, status: respond() };
      }
    }

    runtime.state = 'ready-to-install';
    runtime.downloadProgress = 100;
    broadcast({ type: 'downloaded' });
    return { ok: true, status: respond() };
  });

  ipcMain.removeHandler(UpdateIpcChannels.Install);
  ipcMain.handle(UpdateIpcChannels.Install, async (): Promise<UpdateActionResult> => {
    if (runtime.state !== 'ready-to-install') {
      return { ok: false, code: 'not_ready', status: respond() };
    }
    // quitAndInstall exits the process; return ok first for UI.
    setImmediate(() => runtime.transport.quitAndInstall());
    return { ok: true, status: respond() };
  });

  ipcMain.removeHandler(UpdateIpcChannels.SetChannel);
  ipcMain.handle(
    UpdateIpcChannels.SetChannel,
    async (_event, payload: UpdateSetChannelRequest): Promise<UpdateActionResult> => {
      if (!payload || !isUpdateChannel(payload.channel)) {
        return { ok: false, code: 'invalid_channel', status: respond() };
      }
      const prefs = runtime.prefs.load();
      prefs.channel = payload.channel as UpdateChannel;
      runtime.prefs.save(prefs);
      runtime.transport.setChannel(prefs.channel);
      return { ok: true, status: respond() };
    },
  );

  ipcMain.removeHandler(UpdateIpcChannels.SetAutoCheck);
  ipcMain.handle(
    UpdateIpcChannels.SetAutoCheck,
    async (_event, payload: UpdateSetAutoCheckRequest): Promise<UpdateActionResult> => {
      if (!payload || typeof payload.enabled !== 'boolean') {
        return { ok: false, code: 'invalid_payload', status: respond() };
      }
      const prefs = runtime.prefs.load();
      prefs.autoCheckEnabled = payload.enabled;
      runtime.prefs.save(prefs);
      return { ok: true, status: respond() };
    },
  );

  ipcMain.removeHandler(UpdateIpcChannels.OpenReleaseNotes);
  ipcMain.handle(UpdateIpcChannels.OpenReleaseNotes, async (): Promise<UpdateActionResult> => {
    const url = runtime.manifest?.releaseNotesUrl;
    if (!url || !url.startsWith('https://github.com/')) {
      return { ok: false, code: 'no_notes', status: respond() };
    }
    await shell.openExternal(url);
    return { ok: true, status: respond() };
  });
}

export async function maybeAutoCheckUpdates(runtime: UpdaterRuntime): Promise<void> {
  if (!app.isPackaged) {
    return;
  }
  const prefs = runtime.prefs.load();
  if (!prefs.autoCheckEnabled || prefs.channel === 'development') {
    return;
  }
  // Fire-and-forget background check — failures must not affect app use.
  try {
    const manifest = await runtime.manifestFetcher.fetch(prefs.channel);
    runtime.manifest = manifest;
    prefs.lastCheckedAt = new Date().toISOString();
    runtime.prefs.save(prefs);
    if (manifest) {
      const evaluation = evaluateUpdate(app.getVersion(), manifest);
      runtime.softBlock = evaluation.softBlockWorkSurfaces;
      if (evaluation.hasUpdate) {
        runtime.state = 'available';
        broadcast({ type: 'available', version: manifest.latestVersion });
        broadcast({ type: 'status', status: buildSnapshot(runtime) });
      }
    }
  } catch (error) {
    console.warn('[updater] auto-check skipped', error instanceof Error ? error.message : 'unknown');
  }
}
