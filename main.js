import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import isDev from 'electron-is-dev';
import { setupIpcHandlers } from './src/ipc-handlers.js'; 

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createWindow() {
  const win = new BrowserWindow({
    width: 1200, 
    height: 800,
    show: false, // Keep hidden until Vite server responds
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
    },
  });

  win.maximize();

  // 1. Load the URL target first
  win.loadURL(isDev ? 'http://localhost:5174' : `file://${path.join(__dirname, 'dist/index.html')}`);

  // 2. FIXED: Wait for Vite to actually respond with content before rendering the frame
  win.once('ready-to-show', () => {
    win.show();
  });

  // 3. FALLBACK: If Vite lags on startup, force a reload instead of staying white
  if (isDev) {
    win.webContents.on('did-fail-load', () => {
      console.log('Vite server loading delayed... retrying connection in 1 second.');
      setTimeout(() => {
        win.loadURL('http://localhost:5174');
      }, 1000);
    });
  }
}

// Initialize our IPC bridge
setupIpcHandlers(ipcMain, dialog);

// App Lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => { 
  if (process.platform !== 'darwin') app.quit(); 
});