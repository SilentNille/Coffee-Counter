/**
 * Coffee.js
 * ---------
 * Dieses Modell definiert die Struktur der Kaffee-Tracking-Daten.
 */

class Coffee {
  /**
   * Erstellt einen neuen Kaffee-Eintrag
   * @param {Object} coffeeData - Die Kaffee-Tracking-Daten
   */
  constructor(coffeeData = {}) {
    this.id = coffeeData.id || Date.now();
    this.timestamp = coffeeData.timestamp || new Date();
    this.intervalMs = coffeeData.intervalMs || 0; // Zeit seit dem letzten Kaffee in Millisekunden
    this.dayId = coffeeData.dayId || this.getDayId(this.timestamp);
  }

  /**
   * Erzeugt eine eindeutige ID für den Tag (Format: YYYY-MM-DD)
   * @param {Date} date - Das Datum
   * @returns {string} - Die Tag-ID
   */
  getDayId(date) {
    return new Date(date).toISOString().split('T')[0];
  }

  /**
   * Konvertiert das Modell in ein JSON-Objekt
   * @returns {Object} - Das JSON-Objekt
   */
  toJSON() {
    return {
      id: this.id,
      timestamp: this.timestamp,
      intervalMs: this.intervalMs,
      dayId: this.dayId
    };
  }
}

module.exports = Coffee;