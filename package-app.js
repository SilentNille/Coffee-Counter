/**
 * package-app.js
 * -------------
 * Dieses Script erstellt eine einfache Windows-Distribution ohne Code-Signierung
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { execSync } = require('child_process');

// Starten des Prozesses
console.log('Starte manuelles Paketieren der Electron-App...');

// Pfade konfigurieren
const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');
const winAppDir = path.join(distDir, 'win-app');
const electronVersion = require('./package.json').devDependencies.electron.replace('^', '');

// Sicherstellen, dass die Ausgabeverzeichnisse existieren
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

if (fs.existsSync(winAppDir)) {
  // Löschen des vorhandenen Verzeichnisses
  console.log('Lösche vorhandenes Ausgabeverzeichnis...');
  fs.rmSync(winAppDir, { recursive: true, force: true });
}
fs.mkdirSync(winAppDir);

// Electron abrufen durch npm
console.log('Installiere Electron-Binärdateien...');
try {
  execSync('npx electron-download --version=' + electronVersion + ' --platform=win32 --arch=x64 --out=' + distDir);
  console.log('Electron-Binärdateien erfolgreich heruntergeladen');
} catch (error) {
  console.error('Fehler beim Herunterladen der Electron-Binärdateien:', error);
  process.exit(1);
}

// Extrahieren (falls es eine ZIP-Datei ist)
const electronZip = path.join(distDir, 'electron-v' + electronVersion + '-win32-x64.zip');
if (fs.existsSync(electronZip)) {
  console.log('Extrahiere Electron-Binärdateien...');
  const extract = require('extract-zip');
  
  try {
    extract(electronZip, { dir: winAppDir }, function (err) {
      if (err) {
        console.error('Fehler beim Extrahieren:', err);
        process.exit(1);
      }
      continuePackaging();
    });
  } catch (error) {
    console.error('Fehler beim Extrahieren:', error);
    process.exit(1);
  }
} else {
  console.log('Keine ZIP-Datei gefunden, kopiere Anwendungsdaten direkt');
  continuePackaging();
}

// Fortsetzen des Paketierungsprozesses
function continuePackaging() {
  console.log('Kopiere Anwendungsdaten...');
  
  // Dateien für die App vorbereiten
  const resourcesDir = path.join(winAppDir, 'resources');
  const appDir = path.join(resourcesDir, 'app');
  
  // Sicherstellen, dass die Verzeichnisse existieren
  if (!fs.existsSync(resourcesDir)) {
    fs.mkdirSync(resourcesDir, { recursive: true });
  }
  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true });
  }
  
  // Kopieren der Anwendungsdateien (ohne node_modules)
  copyFilesRecursively(rootDir, appDir, ['node_modules', 'dist', '.git']);
  
  // Installiere Produktionsabhängigkeiten
  console.log('Installiere Produktionsabhängigkeiten...');
  try {
    execSync('npm install --production', { cwd: appDir });
  } catch (error) {
    console.error('Fehler beim Installieren der Abhängigkeiten:', error);
    process.exit(1);
  }
  
  console.log('Erstelle ZIP-Archiv der App...');
  // Erstelle ZIP-Archiv der App
  const output = fs.createWriteStream(path.join(distDir, 'test-app-win.zip'));
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximale Komprimierung
  });
  
  output.on('close', function() {
    console.log('Paketierung abgeschlossen!');
    console.log('Die App wurde erfolgreich paketiert und unter dist/test-app-win.zip gespeichert.');
    console.log('Außerdem ist die entpackte Version unter dist/win-app verfügbar.');
  });
  
  archive.on('error', function(err) {
    throw err;
  });
  
  archive.pipe(output);
  archive.directory(winAppDir, false);
  archive.finalize();
}

/**
 * Hilfsfunktion zum rekursiven Kopieren von Dateien
 */
function copyFilesRecursively(sourceDir, targetDir, excludeDirs) {
  // Lese Verzeichnisinhalt
  const items = fs.readdirSync(sourceDir);
  
  for (const item of items) {
    const sourcePath = path.join(sourceDir, item);
    const targetPath = path.join(targetDir, item);
    
    // Prüfe, ob es ein ausgeschlossenes Verzeichnis ist
    if (excludeDirs && excludeDirs.includes(item)) {
      continue;
    }
    
    // Stat für die Datei/das Verzeichnis abrufen
    const stat = fs.statSync(sourcePath);
    
    if (stat.isDirectory()) {
      // Für Verzeichnisse: Erstelle Zielverzeichnis und kopiere rekursiv
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath);
      }
      copyFilesRecursively(sourcePath, targetPath, excludeDirs);
    } else {
      // Für Dateien: Direkt kopieren
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}