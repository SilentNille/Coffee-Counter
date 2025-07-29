const express = require('express');
const path = require('path');
const app = express();
const { app: electronApp } = require('electron');

if (process.platform === 'darwin') {
  electronApp.dock.setIcon(path.join(__dirname, 'public/assets/icons/coffee-icon.png'));
}

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());

app.get('/api/status', (req, res) => {
  res.json({ status: 'online', message: 'Server läuft!' });
});

const server = app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});

module.exports = { app, server };