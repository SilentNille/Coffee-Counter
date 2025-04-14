/**
 * userController.js
 * ----------------
 * Dieser Controller enthält die Logik für Benutzeraktionen.
 * Controller sind für die Verarbeitung von Anfragen und Antworten zuständig.
 */

/**
 * Alle Benutzer abrufen
 * @param {Object} req - Express Request-Objekt
 * @param {Object} res - Express Response-Objekt
 */
const getAllUsers = (req, res) => {
  // In einer realen App würden hier Daten aus der Datenbank abgerufen
  res.json({
    success: true,
    message: 'Benutzer abgerufen',
    data: [
      { id: 1, name: 'Max Mustermann' },
      { id: 2, name: 'Erika Musterfrau' }
    ]
  });
};

/**
 * Benutzer anhand ID abrufen
 * @param {Object} req - Express Request-Objekt
 * @param {Object} res - Express Response-Objekt
 */
const getUserById = (req, res) => {
  const userId = req.params.id;
  // In einer realen App würde hier eine Datenbankabfrage erfolgen
  res.json({
    success: true,
    message: `Benutzer mit ID ${userId} abgerufen`,
    data: { id: userId, name: 'Beispielbenutzer' }
  });
};

module.exports = {
  getAllUsers,
  getUserById
};