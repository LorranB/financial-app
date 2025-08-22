const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  const win = new BrowserWindow({
    width: 1024,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  win.setMenu(null);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});