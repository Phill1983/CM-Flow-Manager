import { basename, dirname, join } from 'node:path';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import {
  IpcChannels,
  type AppGetVersionResult,
  type DialogOpenPdfResult,
  type DialogSavePdfResult,
  type PdfInspectRequest,
  type PdfPrepareSourceRequest,
  type PdfPrepareSourceResult,
  type PdfUnlockRequest,
  type ShellOpenFolderRequest,
  type ShellOpenFolderResult,
} from '@cm-flow-manager/ipc-contracts';
import { createPdfUnlockService } from '@cm-flow-manager/pdf-engine';
import { buildUnlockedFileName } from '@cm-flow-manager/file-utils';
import {
  isSafeAbsolutePath,
  isSafePdfAbsolutePath,
  openValidatedFolder,
  preparePdfSource,
} from './pdf-ipc-helpers';

const APP_NAME = 'Flow Manager';
const pdfUnlockService = createPdfUnlockService({
  logger: {
    log: (event) => {
      console.info('[pdf-engine]', JSON.stringify(event));
    },
  },
});
console.info(
  '[pdf-engine]',
  JSON.stringify({
    level: 'info',
    message: 'PDF unlock service initialized',
    category: pdfUnlockService.constructor.name,
  }),
);

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    title: APP_NAME,
    autoHideMenuBar: true,
    icon: join(__dirname, '../../resources/icon.ico'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  window.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.info(`[renderer:${level}] ${message} (${sourceId}:${line})`);
  });

  window.once('ready-to-show', () => {
    window.show();
  });

  if (process.env['ELECTRON_RENDERER_URL']) {
    void window.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return window;
}

function registerIpcHandlers(): void {
  ipcMain.removeHandler(IpcChannels.AppGetVersion);
  ipcMain.handle(IpcChannels.AppGetVersion, (): AppGetVersionResult => ({
    version: app.getVersion(),
    name: APP_NAME,
  }));

  ipcMain.removeHandler(IpcChannels.DialogOpenPdf);
  ipcMain.handle(IpcChannels.DialogOpenPdf, async (event): Promise<DialogOpenPdfResult> => {
    console.info('[ipc] dialog:openPdf start');
    const window = BrowserWindow.fromWebContents(event.sender);
    const options = {
      title: 'Select PDF',
      properties: ['openFile' as const],
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    };
    const result = window
      ? await dialog.showOpenDialog(window, options)
      : await dialog.showOpenDialog(options);
    if (result.canceled || result.filePaths.length === 0) {
      console.info('[ipc] dialog:openPdf canceled');
      return { canceled: true };
    }
    const filePath = result.filePaths[0];
    if (!filePath || !isSafePdfAbsolutePath(filePath)) {
      console.info('[ipc] dialog:openPdf rejected path', filePath ?? '(empty)');
      return { canceled: true };
    }
    console.info('[ipc] dialog:openPdf ok', basename(filePath));
    return { canceled: false, filePath };
  });

  ipcMain.removeHandler(IpcChannels.DialogSavePdf);
  ipcMain.handle(
    IpcChannels.DialogSavePdf,
    async (event, payload: { defaultPath?: string }): Promise<DialogSavePdfResult> => {
      const window = BrowserWindow.fromWebContents(event.sender);
      const defaultPath =
        typeof payload?.defaultPath === 'string' && payload.defaultPath.length > 0
          ? payload.defaultPath
          : undefined;
      const options = {
        title: 'Save unlocked PDF',
        defaultPath,
        filters: [{ name: 'PDF', extensions: ['pdf'] as string[] }],
      };
      const result = window
        ? await dialog.showSaveDialog(window, options)
        : await dialog.showSaveDialog(options);
      if (result.canceled || !result.filePath) {
        return { canceled: true };
      }
      if (!isSafePdfAbsolutePath(result.filePath)) {
        return { canceled: true };
      }
      return { canceled: false, filePath: result.filePath };
    },
  );

  ipcMain.removeHandler(IpcChannels.PdfInspect);
  ipcMain.handle(IpcChannels.PdfInspect, async (_event, payload: PdfInspectRequest) => {
    if (!isSafePdfAbsolutePath(payload?.filePath)) {
      return { status: 'invalid', reason: 'Invalid PDF path.' };
    }
    return pdfUnlockService.inspect(payload.filePath);
  });

  ipcMain.removeHandler(IpcChannels.PdfUnlock);
  ipcMain.handle(IpcChannels.PdfUnlock, async (_event, payload: PdfUnlockRequest) => {
    try {
      if (!payload || typeof payload.password !== 'string') {
        return {
          status: 'failed',
          category: 'Internal',
          message: 'Invalid unlock request.',
        };
      }
      if (!isSafePdfAbsolutePath(payload.sourcePath) || !isSafePdfAbsolutePath(payload.destinationPath)) {
        return {
          status: 'failed',
          category: 'Internal',
          message: 'Invalid PDF paths.',
        };
      }
      return await pdfUnlockService.unlock({
        sourcePath: payload.sourcePath,
        destinationPath: payload.destinationPath,
        password: payload.password,
      });
    } catch (error) {
      console.error('[pdf-engine]', JSON.stringify({
        level: 'error',
        message: 'Unlock handler failed',
        category: 'Internal',
        detail: error instanceof Error ? error.name : 'unknown',
      }));
      return {
        status: 'failed',
        category: 'Internal',
        message: 'Unexpected unlock failure.',
      };
    }
  });

  ipcMain.removeHandler(IpcChannels.PdfPrepareSource);
  ipcMain.handle(
    IpcChannels.PdfPrepareSource,
    async (_event, payload: PdfPrepareSourceRequest): Promise<PdfPrepareSourceResult> => {
      console.info('[ipc] pdf:prepareSource', payload?.filePath ? basename(payload.filePath) : '(missing)');
      try {
        if (!payload || !isSafePdfAbsolutePath(payload.filePath)) {
          console.info('[ipc] pdf:prepareSource bad_path');
          return { ok: false, code: 'bad_path' };
        }
        const prepared = await preparePdfSource(payload.filePath, pdfUnlockService);
        console.info('[ipc] pdf:prepareSource result', prepared.ok ? 'ok' : prepared.code);
        return prepared;
      } catch (error) {
        console.error('[ipc] pdf:prepareSource threw', error instanceof Error ? error.message : 'unknown');
        return { ok: false, code: 'not_found' };
      }
    },
  );

  ipcMain.removeHandler(IpcChannels.ShellOpenFolder);
  ipcMain.handle(
    IpcChannels.ShellOpenFolder,
    async (_event, payload: ShellOpenFolderRequest): Promise<ShellOpenFolderResult> => {
      if (!payload || !isSafeAbsolutePath(payload.targetPath)) {
        return { ok: false, code: 'invalid_path' };
      }
      return openValidatedFolder(payload.targetPath);
    },
  );
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('web-contents-created', (_event, contents) => {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  contents.on('will-navigate', (navEvent, url) => {
    const allowed =
      url.startsWith('file://') ||
      Boolean(process.env['ELECTRON_RENDERER_URL'] && url.startsWith(process.env['ELECTRON_RENDERER_URL']));
    if (!allowed) {
      navEvent.preventDefault();
    }
  });
});

export function defaultUnlockedPathFor(sourcePath: string): string {
  return join(dirname(sourcePath), buildUnlockedFileName(basename(sourcePath)));
}
