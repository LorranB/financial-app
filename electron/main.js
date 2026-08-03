const { app, BrowserWindow } = require('electron');
const path = require('path');

const isDev = !app.isPackaged; // true quando rodando "npm run dev:electron"

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 700,
    icon: path.join(__dirname, '..', 'assets', 'icone.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.setMenu(null);

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
