const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  const iconPath = path.join(__dirname, 'assets', 'icon.ico');
  const win = new BrowserWindow({
    width: 1024,
    height: 700,
    icon: iconPath,
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