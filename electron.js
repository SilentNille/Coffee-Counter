/**
 * electron.js
 * ----------
 * Hauptprozessdatei für die Coffee Tracker Electron-Anwendung
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const CoffeeService = require('./src/services/CoffeeService');

// Server starten
require('./index');

let mainWindow;
let coffeeService;

function createWindow() {
  // Erstelle das Browser-Fenster mit abgerundeten Ecken und modernem Design
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    frame: false, // Keine Standard-Fensterrahmen
    transparent: true, // Transparenz für abgerundete Ecken
    backgroundColor: '#00000000', // Transparent background
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, 'public', 'assets', 'icons', 'coffee-icon.png')
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
  
  // Coffee Service initialisieren
  coffeeService = new CoffeeService();
  
  // Fensterbefehle einrichten
  setupWindowControls();
  
  // Coffee Tracking IPC-Befehle einrichten
  setupCoffeeTracking();
}

// Fensterbefehle für die benutzerdefinierte Titelleiste
function setupWindowControls() {
  ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });
  
  ipcMain.on('window-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });
  
  ipcMain.on('window-close', () => {
    if (mainWindow) mainWindow.close();
  });
}

// Coffee-Tracking IPC-Befehle
function setupCoffeeTracking() {
  // Tracking starten
  ipcMain.handle('start-tracking', () => {
    return coffeeService.startTracking();
  });
  
  // Neuen Kaffee hinzufügen
  ipcMain.handle('add-coffee', () => {
    return coffeeService.addCoffee();
  });
  
  // Statistik für den aktuellen Tag abrufen
  ipcMain.handle('get-today-stats', () => {
    return coffeeService.getStatsForDay();
  });
  
  // Kaffee-Historie abrufen
  ipcMain.handle('get-coffee-history', (event, days) => {
    return coffeeService.getCoffeeHistory(days);
  });
  
  // Einstellungen abrufen
  ipcMain.handle('get-settings', () => {
    return coffeeService.getSettings();
  });
  
  // Einstellungen aktualisieren
  ipcMain.handle('update-settings', (event, settings) => {
    return coffeeService.updateSettings(settings);
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