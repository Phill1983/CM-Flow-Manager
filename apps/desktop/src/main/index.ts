import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'node:path';
import { IpcChannels, type AppGetVersionResult } from '@cm-flow-manager/ipc-contracts';

const APP_NAME = 'CM Flow Manager';

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

  // No remote content — load only local Vite/dev or packaged renderer.
  if (process.env['ELECTRON_RENDERER_URL']) {
    void window.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return window;
}

function registerIpcHandlers(): void {
  ipcMain.removeHandler(IpcChannels.AppGetVersion);
  ipcMain.handle(IpcChannels.AppGetVersion, (): AppGetVersionResult => {
    return {
      version: app.getVersion(),
      name: APP_NAME,
    };
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

// Hardening: deny new window / navigation to remote origins.
app.on('web-contents-created', (_event, contents) => {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  contents.on('will-navigate', (event, url) => {
    const allowed =
      url.startsWith('file://') ||
      Boolean(process.env['ELECTRON_RENDERER_URL'] && url.startsWith(process.env['ELECTRON_RENDERER_URL']));
    if (!allowed) {
      event.preventDefault();
    }
  });
});
