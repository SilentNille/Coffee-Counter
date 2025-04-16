/**
 * index.js
 * --------
 * Die Haupteinstiegsdatei der Anwendung.
 * Hier wird die Anwendung initialisiert und gestartet.
 */

// Express Server importieren
const express = require('express');
const path = require('path');
const app = express();
const { app: electronApp } = require('electron');

// Set the Dock icon for macOS
electronApp.dock.setIcon(path.join(__dirname, 'public/assets/icons/coffee-icon.png'));

// Konfiguration
const PORT = process.env.PORT || 3000;

// Statische Dateien bereitstellen
app.use(express.static(path.join(__dirname, 'public')));

// Middleware zum Parsen von JSON
app.use(express.json());

// Beispielroute für die API
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', message: 'Server läuft!' });
});

// Starte den Server
const server = app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});

// Exportiere app für Tests und andere Module
module.exports = { app, server };