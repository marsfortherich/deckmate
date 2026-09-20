import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // In Produktion: Lade die gebaute App
  if (app.isPackaged) {
    const htmlPath = join(__dirname, 'dist', 'ui', 'index.html');
    win.loadFile(htmlPath);
  } else {
    // In Entwicklung: Lade vom Dev-Server
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  }

  // Log Fehler
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
