import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { basename, dirname, isAbsolute, join } from 'node:path';
import {
  IpcChannels,
  type AppGetVersionResult,
  type DialogOpenPdfResult,
  type DialogSavePdfResult,
  type PdfInspectRequest,
  type PdfUnlockRequest,
} from '@cm-flow-manager/ipc-contracts';
import { createPdfUnlockService } from '@cm-flow-manager/pdf-engine';
import { buildUnlockedFileName, hasPdfExtension } from '@cm-flow-manager/file-utils';

const APP_NAME = 'CM Flow Manager';
const pdfUnlockService = createPdfUnlockService({
  logger: {
    log: (event) => {
      console.info('[pdf-engine]', JSON.stringify(event));
    },
  },
});

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    title: APP_NAME,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
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

function isSafePdfAbsolutePath(filePath: unknown): filePath is string {
  return typeof filePath === 'string' && isAbsolute(filePath) && hasPdfExtension(filePath);
}

function registerIpcHandlers(): void {
  ipcMain.removeHandler(IpcChannels.AppGetVersion);
  ipcMain.handle(IpcChannels.AppGetVersion, (): AppGetVersionResult => ({
    version: app.getVersion(),
    name: APP_NAME,
  }));

  ipcMain.removeHandler(IpcChannels.DialogOpenPdf);
  ipcMain.handle(IpcChannels.DialogOpenPdf, async (event): Promise<DialogOpenPdfResult> => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const result = window
      ? await dialog.showOpenDialog(window, {
          title: 'Select PDF',
          properties: ['openFile'],
          filters: [{ name: 'PDF', extensions: ['pdf'] }],
        })
      : await dialog.showOpenDialog({
          title: 'Select PDF',
          properties: ['openFile'],
          filters: [{ name: 'PDF', extensions: ['pdf'] }],
        });
    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true };
    }
    const filePath = result.filePaths[0];
    if (!filePath || !isSafePdfAbsolutePath(filePath)) {
      return { canceled: true };
    }
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
    return pdfUnlockService.unlock({
      sourcePath: payload.sourcePath,
      destinationPath: payload.destinationPath,
      password: payload.password,
    });
  });
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
