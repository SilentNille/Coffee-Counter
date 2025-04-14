# Test App

## Über das Projekt
Diese App wurde als Grundgerüst für eine Node.js-Anwendung erstellt.

## Installation
```bash
# Abhängigkeiten installieren
npm install
```

## Verwendung
```bash
# Anwendung starten
npm start

# Anwendung als Desktop-App starten
npm run electron

# Entwicklungsmodus mit DevTools
npm run electron-dev
```

## Paketierung
```bash
# Windows-Desktop-App erstellen (als ZIP-Datei)
npm run package-manual

# Alternative Paketierungsoptionen
npm run package-win    # Windows-Installer (benötigt Administratorrechte)
npm run package-mac    # macOS-App erstellen
npm run package-linux  # Linux-App erstellen
```

## Projektstruktur
- `index.js`: Haupteinstiegspunkt der Anwendung
- `electron.js`: Einstiegspunkt für die Electron Desktop-App
- `package-app.js`: Build-Script für die Windows-App
- `src/`: Quellcode-Ordner
  - `controllers/`: Controller-Dateien
  - `models/`: Datenmodelle
  - `routes/`: API-Routen
  - `config/`: Konfigurationsdateien
- `public/`: Statische Dateien
- `tests/`: Tests