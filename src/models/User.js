/**
 * User.js
 * -------
 * Dieses Modell definiert die Struktur eines Benutzers.
 * Modelle repräsentieren die Datenstruktur und enthalten Validierungslogik.
 * In einer echten App würde hier z.B. ein Mongoose-Schema oder Sequelize-Modell stehen.
 */

class User {
  /**
   * Erstellt einen neuen Benutzer
   * @param {Object} userData - Die Benutzerdaten
   */
  constructor(userData) {
    this.id = userData.id;
    this.name = userData.name || '';
    this.email = userData.email || '';
    this.createdAt = userData.createdAt || new Date();
  }

  /**
   * Validiert die Benutzerdaten
   * @returns {boolean} - True, wenn die Daten gültig sind
   */
  validate() {
    if (!this.name) return false;
    if (!this.email || !this.email.includes('@')) return false;
    return true;
  }

  /**
   * Konvertiert das Modell in ein JSON-Objekt
   * @returns {Object} - Das JSON-Objekt
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      createdAt: this.createdAt
    };
  }
}

module.exports = User;