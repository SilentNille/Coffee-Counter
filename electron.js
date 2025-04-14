/**
 * electron.js
 * ----------
 * Hauptprozessdatei für die Electron-Anwendung
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');

// Server starten
require('./index');

let mainWindow;

function createWindow() {
  // Erstelle das Browser-Fenster
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Lade die index.html der App
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'public', 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Öffne die DevTools im Entwicklungsmodus
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Ereignishandler, wenn das Fenster geschlossen wird
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Erstelle ein Fenster, wenn Electron bereit ist
app.on('ready', createWindow);

// Beende die Anwendung, wenn alle Fenster geschlossen sind (außer auf macOS)
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});