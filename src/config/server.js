/**
 * server.js
 * ---------
 * Diese Datei enthält die Konfiguration für den Server.
 * Hier können Port, Middleware und andere Servereinstellungen definiert werden.
 */

module.exports = {
  // Server-Port, kann über Umgebungsvariablen überschrieben werden
  port: process.env.PORT || 3000,
  
  // API-Basisroute
  apiBase: '/api',
  
  // CORS-Einstellungen (Cross-Origin Resource Sharing)
  cors: {
    origin: '*', // In der Produktion sollte dies eingeschränkt werden
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
};