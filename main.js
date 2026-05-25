import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import isDev from 'electron-is-dev';
import { setupIpcHandlers } from './src/ipc-handlers.js'; // Import our new handlers

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createWindow() {
  const win = new BrowserWindow({
    width: 1200, height: 800,
    show: false, // Don't show the window until it's ready and maximized
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
    },
  });
  win.maximize();
  win.loadURL(isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, 'dist/index.html')}`);
}

// Initialize our IPC bridge
setupIpcHandlers(ipcMain, dialog);

// App Lifecycle
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });