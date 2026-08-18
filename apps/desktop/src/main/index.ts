import { existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { app, BrowserWindow, dialog, ipcMain, session } from 'electron';
import {
  IpcChannels,
  type AppGetVersionResult,
  type DialogOpenPdfResult,
  type DialogOpenPdfsResult,
  type DialogSavePdfRequest,
  type DialogSavePdfResult,
  type PdfExtractPagesRequest,
  type PdfGrantPreviewRequest,
  type PdfInspectRequest,
  type PdfMergeRequest,
  type PdfPrepareExtractSourceRequest,
  type PdfPrepareMergeFileRequest,
  type PdfPrepareSourceRequest,
  type PdfPrepareSourceResult,
  type PdfRevokePreviewRequest,
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
  prepareExtractSource,
  prepareMergeFile,
  preparePdfSource,
} from './pdf-ipc-helpers';
import { grantPdfPreview } from './preview-grant';
import { attachPdfPreviewProtocol, registerPdfPreviewScheme } from './preview-protocol';
import { isPreviewToken, pdfPreviewRegistry } from './preview-registry';
import { createUpdaterRuntime, maybeAutoCheckUpdates, registerUpdateIpc } from './updater/update-ipc';

/** Window title (sidebar-aligned). Installer productName remains “CM Flow Manager”. */
const APP_NAME = 'Flow Manager';
const PRODUCT_NAME = 'CM Flow Manager';
const APP_USER_MODEL_ID = 'com.cmflowmanager.desktop';

function resolvePackagedQpdfPath(): string | undefined {
  if (!app.isPackaged) {
    return undefined;
  }
  const candidate = join(process.resourcesPath, 'qpdf', 'qpdf.exe');
  return existsSync(candidate) ? candidate : undefined;
}

function resolveAppIconPath(): string | undefined {
  const candidates = [
    join(process.resourcesPath, 'icon.ico'),
    join(__dirname, '../../resources/icon.ico'),
    join(app.getAppPath(), 'resources/icon.ico'),
  ];
  return candidates.find((candidate) => existsSync(candidate));
}

const pdfUnlockService = createPdfUnlockService({
  qpdfPath: resolvePackagedQpdfPath(),
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
    packaged: app.isPackaged,
  }),
);

function createMainWindow(): BrowserWindow {
  const icon = resolveAppIconPath();
  const captureOut = process.env['CM_CAPTURE_OUT'];
  const window = new BrowserWindow({
    width: captureOut ? 1600 : 1200,
    height: captureOut ? 1000 : 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    title: APP_NAME,
    autoHideMenuBar: true,
    ...(icon ? { icon } : {}),
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
    if (captureOut) {
      void window.webContents
        .executeJavaScript('new Promise((r) => requestAnimationFrame(() => setTimeout(r, 700)))')
        .then(async () => {
          const image = await window.capturePage();
          writeFileSync(captureOut, image.toPNG());
          console.info(`[capture] wrote ${captureOut}`);
          app.quit();
        });
    }
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
    name: PRODUCT_NAME,
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

  ipcMain.removeHandler(IpcChannels.DialogOpenPdfs);
  ipcMain.handle(IpcChannels.DialogOpenPdfs, async (event): Promise<DialogOpenPdfsResult> => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const options = {
      title: 'Select PDFs',
      properties: ['openFile' as const, 'multiSelections' as const],
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    };
    const result = window
      ? await dialog.showOpenDialog(window, options)
      : await dialog.showOpenDialog(options);
    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true };
    }
    const filePaths = result.filePaths.filter((filePath) => isSafePdfAbsolutePath(filePath));
    if (filePaths.length === 0) {
      return { canceled: true };
    }
    return { canceled: false, filePaths };
  });

  ipcMain.removeHandler(IpcChannels.DialogSavePdf);
  ipcMain.handle(
    IpcChannels.DialogSavePdf,
    async (event, payload: DialogSavePdfRequest): Promise<DialogSavePdfResult> => {
      const window = BrowserWindow.fromWebContents(event.sender);
      const defaultPath =
        typeof payload?.defaultPath === 'string' && payload.defaultPath.length > 0
          ? payload.defaultPath
          : undefined;
      const title =
        typeof payload?.title === 'string' && payload.title.trim().length > 0 && payload.title.length <= 120
          ? payload.title.replace(/[\r\n]/g, ' ').trim()
          : 'Save PDF';
      const options = {
        title,
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

  ipcMain.removeHandler(IpcChannels.PdfPrepareExtractSource);
  ipcMain.handle(
    IpcChannels.PdfPrepareExtractSource,
    async (_event, payload: PdfPrepareExtractSourceRequest) => {
      try {
        if (!payload || !isSafePdfAbsolutePath(payload.filePath)) {
          return { ok: false, code: 'bad_path' };
        }
        const pageSelection =
          typeof payload.pageSelection === 'string' && payload.pageSelection.length <= 500
            ? payload.pageSelection
            : undefined;
        const destinationDirectory =
          typeof payload.destinationDirectory === 'string' && isSafeAbsolutePath(payload.destinationDirectory)
            ? payload.destinationDirectory
            : undefined;
        return await prepareExtractSource(
          payload.filePath,
          pdfUnlockService,
          pageSelection,
          destinationDirectory,
        );
      } catch {
        return { ok: false, code: 'not_found' };
      }
    },
  );

  ipcMain.removeHandler(IpcChannels.PdfPrepareMergeFile);
  ipcMain.handle(
    IpcChannels.PdfPrepareMergeFile,
    async (_event, payload: PdfPrepareMergeFileRequest) => {
      try {
        if (!payload || !isSafePdfAbsolutePath(payload.filePath)) {
          return { ok: false, code: 'bad_path' };
        }
        return await prepareMergeFile(payload.filePath, pdfUnlockService);
      } catch {
        return { ok: false, code: 'not_found' };
      }
    },
  );

  ipcMain.removeHandler(IpcChannels.PdfExtractPages);
  ipcMain.handle(IpcChannels.PdfExtractPages, async (_event, payload: PdfExtractPagesRequest) => {
    try {
      if (
        !payload ||
        !isSafePdfAbsolutePath(payload.sourcePath) ||
        !isSafePdfAbsolutePath(payload.destinationPath) ||
        typeof payload.pageSelection !== 'string' ||
        payload.pageSelection.length === 0 ||
        payload.pageSelection.length > 500
      ) {
        return {
          status: 'failed',
          category: 'Internal',
          message: 'Invalid extract request.',
        };
      }
      return await pdfUnlockService.extractPages({
        sourcePath: payload.sourcePath,
        destinationPath: payload.destinationPath,
        pageSelection: payload.pageSelection,
      });
    } catch {
      return {
        status: 'failed',
        category: 'Internal',
        message: 'Unexpected extract failure.',
      };
    }
  });

  ipcMain.removeHandler(IpcChannels.PdfMerge);
  ipcMain.handle(IpcChannels.PdfMerge, async (_event, payload: PdfMergeRequest) => {
    try {
      if (
        !payload ||
        !Array.isArray(payload.sourcePaths) ||
        payload.sourcePaths.length < 2 ||
        payload.sourcePaths.length > 50 ||
        !payload.sourcePaths.every((filePath) => isSafePdfAbsolutePath(filePath)) ||
        !isSafePdfAbsolutePath(payload.destinationPath)
      ) {
        return {
          status: 'failed',
          category: 'Internal',
          message: 'Invalid merge request.',
        };
      }
      return await pdfUnlockService.mergePdfs({
        sourcePaths: payload.sourcePaths,
        destinationPath: payload.destinationPath,
      });
    } catch {
      return {
        status: 'failed',
        category: 'Internal',
        message: 'Unexpected merge failure.',
      };
    }
  });

  ipcMain.removeHandler(IpcChannels.PdfGrantPreview);
  ipcMain.handle(IpcChannels.PdfGrantPreview, async (_event, payload: PdfGrantPreviewRequest) => {
    try {
      if (!payload || !isSafePdfAbsolutePath(payload.filePath)) {
        return { ok: false, code: 'bad_path' };
      }
      return await grantPdfPreview(payload.filePath, pdfUnlockService);
    } catch {
      return { ok: false, code: 'not_found' };
    }
  });

  ipcMain.removeHandler(IpcChannels.PdfRevokePreview);
  ipcMain.handle(IpcChannels.PdfRevokePreview, (_event, payload: PdfRevokePreviewRequest) => {
    if (payload && typeof payload.token === 'string' && isPreviewToken(payload.token)) {
      pdfPreviewRegistry.revoke(payload.token);
    }
    return { ok: true };
  });

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

app.setAppUserModelId(APP_USER_MODEL_ID);
registerPdfPreviewScheme();

const updaterRuntime = createUpdaterRuntime();

app.whenReady().then(() => {
  attachPdfPreviewProtocol(session.defaultSession);
  registerIpcHandlers();
  registerUpdateIpc(updaterRuntime);
  createMainWindow();
  void maybeAutoCheckUpdates(updaterRuntime);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  pdfPreviewRegistry.revokeAll();
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
