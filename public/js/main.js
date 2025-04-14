/**
 * main.js
 * -------
 * Diese Datei enthält die Client-seitige JavaScript-Funktionalität für die öffentlichen Webseiten.
 * Sie kann API-Aufrufe und DOM-Manipulationen durchführen.
 */

// Warte, bis das Dokument vollständig geladen ist
document.addEventListener('DOMContentLoaded', function() {
    console.log('Die Webseite wurde vollständig geladen');
    
    // Status der API überprüfen
    fetchApiStatus();

    // Event-Listener für Buttons hinzufügen
    const actionButtons = document.querySelectorAll('.action-button');
    if (actionButtons) {
        actionButtons.forEach(button => {
            button.addEventListener('click', handleButtonClick);
        });
    }
    
    // Beispiel für API-Status-Abfrage
    async function fetchApiStatus() {
        try {
            const response = await fetch('http://localhost:3000/api/status');
            const data = await response.json();
            
            // Status-Element auf der Seite finden oder erstellen
            let statusElement = document.getElementById('api-status');
            if (!statusElement) {
                statusElement = document.createElement('div');
                statusElement.id = 'api-status';
                document.querySelector('main').appendChild(statusElement);
            }
            
            // Status anzeigen
            statusElement.innerHTML = `
                <h3>API-Status</h3>
                <p>Status: <strong>${data.status}</strong></p>
                <p>Nachricht: ${data.message}</p>
            `;
            statusElement.classList.add('status-online');
        } catch (error) {
            console.error('Fehler beim Abrufen des API-Status:', error);
            
            // Zeige Fehler an
            let statusElement = document.getElementById('api-status');
            if (!statusElement) {
                statusElement = document.createElement('div');
                statusElement.id = 'api-status';
                document.querySelector('main').appendChild(statusElement);
            }
            
            statusElement.innerHTML = `
                <h3>API-Status</h3>
                <p>Status: <strong>offline</strong></p>
                <p>Fehler bei der Verbindung zur API</p>
            `;
            statusElement.classList.add('status-offline');
        }
    }
    
    // Event-Handler für Button-Klicks
    function handleButtonClick(event) {
        const action = event.target.dataset.action;
        console.log(`Button mit Aktion ${action} wurde geklickt`);
        
        // Hier können verschiedene Aktionen basierend auf den Button-Daten ausgeführt werden
    }
});