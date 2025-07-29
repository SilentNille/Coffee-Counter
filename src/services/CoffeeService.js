const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const { app } = require('electron');
const Coffee = require('../models/Coffee');

class CoffeeService {
  constructor() {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'coffee-tracker-db.json');
    
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
   * Entfernt einen Kaffee-Eintrag anhand seiner ID
   * @param {string} coffeeId - Die ID des zu löschenden Kaffee-Eintrags
   * @returns {boolean} - true, wenn der Eintrag gelöscht wurde, sonst false
   */
  removeCoffee(coffeeId) {
    const beforeCount = this.db.get('coffees').size().value();
    this.db.get('coffees').remove({ id: coffeeId }).write();
    const afterCount = this.db.get('coffees').size().value();
    
    return beforeCount > afterCount;
  }

  /**
   * Gibt alle Kaffee-Einträge zurück
   * @returns {Array} - Liste aller Kaffee-Einträge
   */
  getAllCoffees() {
    return this.db.get('coffees').value();
  }

  /**
   * Berechnet Statistiken für alle erfassten Kaffees
   * @returns {Object} - Detaillierte all-time Statistiken
   */
  getAllTimeStats() {
    const allCoffees = this.getAllCoffees();
    
    if (allCoffees.length === 0) {
      return {
        count: 0,
        averagePerDay: 0,
        firstDate: null,
        lastDate: null,
        totalDays: 0,
        averageIntervalMs: 0,
        popularHour: null,
        maxInOneDay: 0
      };
    }
    
    // Nach Datum sortieren
    allCoffees.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Erster und letzter Kaffee
    const firstCoffee = allCoffees[0];
    const lastCoffee = allCoffees[allCoffees.length - 1];
    
    // Erstes und letztes Datum
    const firstDate = new Date(firstCoffee.timestamp);
    const lastDate = new Date(lastCoffee.timestamp);
    
    // Anzahl der Tage zwischen erstem und letztem Kaffee (+1 für inklusives Zählen)
    const totalDaysMs = lastDate - firstDate;
    const totalDays = Math.max(1, Math.ceil(totalDaysMs / (1000 * 60 * 60 * 24)));
    
    // Durchschnitt Kaffees pro Tag
    const averagePerDay = allCoffees.length / totalDays;
    
    // Durchschnittliches Intervall
    const intervals = allCoffees
      .filter(coffee => coffee.intervalMs > 0)
      .map(coffee => coffee.intervalMs);
    
    const averageIntervalMs = intervals.length > 0
      ? intervals.reduce((sum, val) => sum + val, 0) / intervals.length
      : 0;
    
    // Beliebteste Stunde finden (0-23)
    const hourCounts = Array(24).fill(0);
    allCoffees.forEach(coffee => {
      const hour = new Date(coffee.timestamp).getHours();
      hourCounts[hour]++;
    });
    
    const popularHour = hourCounts.indexOf(Math.max(...hourCounts));
    
    // Maximale Anzahl Kaffees an einem Tag
    const coffeesByDay = {};
    allCoffees.forEach(coffee => {
      if (!coffeesByDay[coffee.dayId]) {
        coffeesByDay[coffee.dayId] = 0;
      }
      coffeesByDay[coffee.dayId]++;
    });
    
    const maxInOneDay = Math.max(...Object.values(coffeesByDay));
    
    return {
      count: allCoffees.length,
      averagePerDay: averagePerDay,
      firstDate: firstDate,
      lastDate: lastDate,
      totalDays: totalDays,
      averageIntervalMs: averageIntervalMs,
      popularHour: popularHour,
      maxInOneDay: maxInOneDay
    };
  }
  
  /**
   * Berechnet Statistiken für einen bestimmten Monat
   * @param {number} year - Das Jahr
   * @param {number} month - Der Monat (0-11)
   * @returns {Object} - Die Statistiken für diesen Monat
   */
  getMonthStats(year = new Date().getFullYear(), month = new Date().getMonth()) {
    // Alle Kaffees bekommen
    const allCoffees = this.getAllCoffees();
    
    // Kaffees des angegebenen Monats filtern
    const monthCoffees = allCoffees.filter(coffee => {
      const date = new Date(coffee.timestamp);
      return date.getFullYear() === year && date.getMonth() === month;
    });
    
    if (monthCoffees.length === 0) {
      return {
        count: 0,
        year,
        month,
        averagePerDay: 0,
        averageIntervalMs: 0,
        mostActiveDay: null,
        mostActiveDayCount: 0,
        dayDistribution: Array(31).fill(0)
      };
    }
    
    // Verteilung nach Tagen
    const dayDistribution = Array(31).fill(0);
    const dayCount = {}; // Hilfsobjekt zur Berechnung des aktivsten Tages
    
    monthCoffees.forEach(coffee => {
      const day = new Date(coffee.timestamp).getDate() - 1; // 0-basiert machen
      dayDistribution[day]++;
      
      const dayKey = new Date(coffee.timestamp).toISOString().split('T')[0];
      dayCount[dayKey] = (dayCount[dayKey] || 0) + 1;
    });
    
    // Aktivster Tag finden
    let mostActiveDay = null;
    let mostActiveDayCount = 0;
    
    for (const [dayKey, count] of Object.entries(dayCount)) {
      if (count > mostActiveDayCount) {
        mostActiveDay = dayKey;
        mostActiveDayCount = count;
      }
    }
    
    // Durchschnitt pro Tag im Monat berechnen
    // Anzahl der Tage im angegebenen Monat
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const averagePerDay = monthCoffees.length / daysInMonth;
    
    // Durchschnittliches Intervall
    const intervals = monthCoffees
      .filter(coffee => coffee.intervalMs > 0)
      .map(coffee => coffee.intervalMs);
    
    const averageIntervalMs = intervals.length > 0
      ? intervals.reduce((sum, val) => sum + val, 0) / intervals.length
      : 0;
    
    return {
      count: monthCoffees.length,
      year,
      month,
      averagePerDay,
      averageIntervalMs,
      mostActiveDay,
      mostActiveDayCount,
      dayDistribution
    };
  }
  
  /**
   * Gibt die verfügbaren Jahre und Monate zurück, für die Kaffee-Daten existieren
   * @returns {Array} - Liste von Jahr/Monat-Objekten
   */
  getAvailableMonths() {
    const allCoffees = this.getAllCoffees();
    const monthsSet = new Set();
    
    allCoffees.forEach(coffee => {
      const date = new Date(coffee.timestamp);
      const yearMonth = `${date.getFullYear()}-${date.getMonth()}`;
      monthsSet.add(yearMonth);
    });
    
    const result = Array.from(monthsSet).map(yearMonth => {
      const [year, month] = yearMonth.split('-').map(Number);
      return { year, month };
    });
    
    // Nach Datum sortieren (neueste zuerst)
    result.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
    
    return result;
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
    return todayCoffees.toSorted((a, b) => 
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