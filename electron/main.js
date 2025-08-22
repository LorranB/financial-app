const { app, BrowserWindow } = require("electron")
const path = require("path")

const isDev = !app.isPackaged // true quando rodando "npm run dev"

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // opcional, só se você usar
    },
  })

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173") // Vite rodando
    mainWindow.webContents.openDevTools() // abre console
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html")) // build pronto
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})
