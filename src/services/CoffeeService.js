/**
 * CoffeeService.js
 * ---------------
 * Dieser Service verwaltet die Kaffee-Tracking-Daten.
 * Er nutzt lowdb für die lokale Datenspeicherung.
 */

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const { app } = require('electron');
const Coffee = require('../models/Coffee');

class CoffeeService {
  constructor() {
    // Pfad zur Datenbank-Datei bestimmen (im User-Datenverzeichnis)
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'coffee-tracker-db.json');
    
    // Datenbank initialisieren
    const adapter = new FileSync(dbPath);
    this.db = low(adapter);
    
    // Standard-Struktur und -Werte definieren
    this.db.defaults({
      coffees: [],
      settings: {
        coworkerName: 'Kollege',
        theme: 'light'
      },
      stats: {
        lastStartTime: null
      }
    }).write();
  }

  /**
   * Startet eine neue Tracking-Sitzung
   * @returns {Object} - Die aktuelle Uhrzeit als Startzeit
   */
  startTracking() {
    const startTime = new Date();
    this.db.set('stats.lastStartTime', startTime).write();
    return { startTime };
  }

  /**
   * Fügt einen neuen Kaffee-Eintrag hinzu
   * @returns {Object} - Der neue Kaffee-Eintrag
   */
  addCoffee() {
    const lastStartTime = this.db.get('stats.lastStartTime').value();
    const lastCoffeeToday = this.getLastCoffeeOfDay();
    
    let intervalMs = 0;
    const now = new Date();
    
    // Wenn es bereits einen Kaffee heute gibt, Intervall seit diesem berechnen
    if (lastCoffeeToday) {
      intervalMs = now.getTime() - new Date(lastCoffeeToday.timestamp).getTime();
    } 
    // Sonst Intervall seit Arbeitsbeginn berechnen
    else if (lastStartTime) {
      intervalMs = now.getTime() - new Date(lastStartTime).getTime();
    }

    // Neuen Kaffee-Eintrag erstellen
    const coffee = new Coffee({
      timestamp: now,
      intervalMs
    });

    // In die Datenbank schreiben
    this.db.get('coffees').push(coffee.toJSON()).write();
    
    return coffee;
  }

  /**
   * Gibt alle Kaffee-Einträge zurück
   * @returns {Array} - Liste aller Kaffee-Einträge
   */
  getAllCoffees() {
    return this.db.get('coffees').value();
  }

  /**
   * Gibt die Kaffee-Einträge für einen bestimmten Tag zurück
   * @param {string} dayId - Die Tag-ID im Format YYYY-MM-DD (optional, Standard: heute)
   * @returns {Array} - Liste der Kaffee-Einträge für diesen Tag
   */
  getCoffeesByDay(dayId = this.getTodayId()) {
    return this.db.get('coffees')
      .filter({ dayId })
      .value();
  }

  /**
   * Gibt den letzten Kaffee-Eintrag des aktuellen Tages zurück
   * @returns {Object|null} - Der letzte Kaffee-Eintrag oder null
   */
  getLastCoffeeOfDay() {
    const todayCoffees = this.getCoffeesByDay();
    if (todayCoffees.length === 0) return null;
    
    // Nach Zeitstempel sortieren und den neuesten zurückgeben
    return todayCoffees.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    )[0];
  }

  /**
   * Berechnet Statistiken für einen bestimmten Tag
   * @param {string} dayId - Die Tag-ID im Format YYYY-MM-DD (optional, Standard: heute)
   * @returns {Object} - Die Statistiken für diesen Tag
   */
  getStatsForDay(dayId = this.getTodayId()) {
    const coffees = this.getCoffeesByDay(dayId);
    
    // Default-Werte für den Fall, dass keine Kaffees vorhanden sind
    const stats = {
      count: 0,
      averageIntervalMs: 0,
      minIntervalMs: 0,
      maxIntervalMs: 0,
      intervals: []
    };
    
    if (coffees.length === 0) return stats;
    
    // Anzahl der Kaffees
    stats.count = coffees.length;
    
    // Intervalle für die Berechnung (ignoriere Intervall 0 bei nur einem Kaffee)
    const intervals = coffees
      .filter(coffee => coffee.intervalMs > 0)
      .map(coffee => coffee.intervalMs);
    
    if (intervals.length > 0) {
      stats.averageIntervalMs = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
      stats.minIntervalMs = Math.min(...intervals);
      stats.maxIntervalMs = Math.max(...intervals);
      stats.intervals = intervals;
    }
    
    return stats;
  }

  /**
   * Gibt einen Verlauf der Kaffee-Konsumation nach Tagen zurück
   * @param {number} days - Anzahl der Tage in der Vergangenheit
   * @returns {Array} - Liste von Tagesstatistiken
   */
  getCoffeeHistory(days = 7) {
    const result = [];
    const today = new Date();
    
    // Für jeden Tag die Statistik berechnen
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayId = this.formatDayId(date);
      const stats = this.getStatsForDay(dayId);
      
      result.push({
        dayId,
        date,
        ...stats
      });
    }
    
    return result;
  }

  /**
   * Erzeugt eine ID für den aktuellen Tag
   * @returns {string} - Die Tag-ID im Format YYYY-MM-DD
   */
  getTodayId() {
    return this.formatDayId(new Date());
  }

  /**
   * Formatiert ein Datum als Tag-ID
   * @param {Date} date - Das Datum
   * @returns {string} - Die formatierte Tag-ID
   */
  formatDayId(date) {
    return date.toISOString().split('T')[0];
  }

  /**
   * Aktualisiert die App-Einstellungen
   * @param {Object} settings - Die neuen Einstellungen
   * @returns {Object} - Die aktualisierten Einstellungen
   */
  updateSettings(settings) {
    const currentSettings = this.db.get('settings').value();
    const updatedSettings = { ...currentSettings, ...settings };
    
    this.db.set('settings', updatedSettings).write();
    return updatedSettings;
  }

  /**
   * Gibt die aktuellen Einstellungen zurück
   * @returns {Object} - Die aktuellen Einstellungen
   */
  getSettings() {
    return this.db.get('settings').value();
  }
}

module.exports = CoffeeService;