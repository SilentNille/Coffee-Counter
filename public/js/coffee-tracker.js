/**
 * coffee-tracker.js
 * ----------------
 * Hauptfunktionalität für die Kaffee-Tracking-App mit Timer, Statistiken und Animation
 */

// Electron-Funktionalitäten importieren für IPC-Kommunikation
const { ipcRenderer } = require('electron');

// DOM-Elemente
const startButton = document.getElementById('start-btn');
const coffeeButton = document.getElementById('coffee-btn');
const timerDisplay = document.getElementById('timer-display');
const coffeeCounter = document.getElementById('coffee-counter');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const coworkerNameInput = document.getElementById('coworker-name');
const toast = document.getElementById('toast');

// Statistik-Elemente
const statCount = document.getElementById('stat-count');
const statAvgTime = document.getElementById('stat-avg-time');
const statMinTime = document.getElementById('stat-min-time');
const statMaxTime = document.getElementById('stat-max-time');

// Fensterkontroll-Buttons
const minimizeBtn = document.getElementById('minimize-btn');
const maximizeBtn = document.getElementById('maximize-btn');
const closeBtn = document.getElementById('close-btn');

// Tracking-Status und Zeitvariablen
let isTracking = false;
let startTime = null;
let lastCoffeeTime = null;
let timerInterval = null;
let coffeeCount = 0;
let coworkerName = 'Kollege';
let coffeeHistoryChart = null;

// App initialisieren
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Kaffee Tracker App gestartet');
    
    // Fensterkontrollbuttons einrichten
    setupWindowControls();
    
    // Einstellungen laden
    await loadSettings();
    
    // Statistik für heute laden
    await loadTodayStats();
    
    // Kaffee-Historie-Chart erstellen
    createCoffeeHistoryChart();
    
    // GSAP-Animation für die Kaffeetasse
    animateCoffeeCup();
});

// Fensterkontrollbuttons einrichten
function setupWindowControls() {
    minimizeBtn.addEventListener('click', () => {
        ipcRenderer.send('window-minimize');
    });
    
    maximizeBtn.addEventListener('click', () => {
        ipcRenderer.send('window-maximize');
    });
    
    closeBtn.addEventListener('click', () => {
        ipcRenderer.send('window-close');
    });
}

// Einstellungen laden
async function loadSettings() {
    try {
        const settings = await ipcRenderer.invoke('get-settings');
        coworkerName = settings.coworkerName || 'Kollege';
        coworkerNameInput.value = coworkerName;
    } catch (error) {
        console.error('Fehler beim Laden der Einstellungen:', error);
    }
}

// Heutige Statistik laden
async function loadTodayStats() {
    try {
        const stats = await ipcRenderer.invoke('get-today-stats');
        updateStatsDisplay(stats);
    } catch (error) {
        console.error('Fehler beim Laden der Statistik:', error);
    }
}

// Event-Listener für Buttons
startButton.addEventListener('click', startTracking);
coffeeButton.addEventListener('click', recordCoffee);
saveSettingsBtn.addEventListener('click', saveSettings);

// Tracking starten
async function startTracking() {
    if (isTracking) return;
    
    try {
        const result = await ipcRenderer.invoke('start-tracking');
        startTime = new Date(result.startTime);
        lastCoffeeTime = startTime;
        isTracking = true;
        
        // UI aktualisieren
        startButton.innerHTML = '<i class="fas fa-stopwatch"></i> Tracking läuft...';
        startButton.disabled = true;
        coffeeButton.disabled = false;
        coffeeButton.innerHTML = '<i class="fas fa-mug-hot"></i> Kaffee getrunken!';
        
        // Timer starten
        startTimer();
        
        // Animation und Benachrichtigung
        animateCoffeeButtonPulse();
        showToast(`Tracking für ${coworkerName} gestartet!`);
    } catch (error) {
        console.error('Fehler beim Starten des Trackings:', error);
    }
}

// Timer starten
function startTimer() {
    // Bestehenden Timer löschen, falls vorhanden
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    // Timer alle 1000ms (1 Sekunde) aktualisieren
    timerInterval = setInterval(() => {
        const now = new Date();
        const elapsedMs = now - lastCoffeeTime;
        updateTimerDisplay(elapsedMs);
    }, 1000);
    
    // Initial-Update
    updateTimerDisplay(0);
}

// Timer-Anzeige aktualisieren
function updateTimerDisplay(elapsedMs) {
    const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
    const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((elapsedMs % (1000 * 60)) / 1000);
    
    // Mit führenden Nullen formatieren
    const formattedTime = 
        String(hours).padStart(2, '0') + ':' +
        String(minutes).padStart(2, '0') + ':' +
        String(seconds).padStart(2, '0');
    
    timerDisplay.textContent = formattedTime;
}

// Kaffee aufzeichnen
async function recordCoffee() {
    if (!isTracking) return;
    
    try {
        // Kaffee hinzufügen, aber Rückgabewert nicht verwenden
        await ipcRenderer.invoke('add-coffee');
        
        // Zähler erhöhen und UI aktualisieren
        coffeeCount++;
        coffeeCounter.textContent = `Heute: ${coffeeCount} Kaffee${coffeeCount !== 1 ? 's' : ''}`;
        
        // Letzten Kaffee-Zeitpunkt aktualisieren
        lastCoffeeTime = new Date();
        
        // Statistik aktualisieren
        await loadTodayStats();
        
        // Historie-Chart aktualisieren
        updateCoffeeHistoryChart();
        
        // Animation und Benachrichtigung
        animateCoffeeRecorded();
        showToast(`Kaffee für ${coworkerName} aufgezeichnet!`);
    } catch (error) {
        console.error('Fehler beim Aufzeichnen des Kaffees:', error);
    }
}

// Statistikanzeige aktualisieren
function updateStatsDisplay(stats) {
    coffeeCount = stats.count;
    statCount.textContent = stats.count;
    coffeeCounter.textContent = `Heute: ${stats.count} Kaffee${stats.count !== 1 ? 's' : ''}`;
    
    // Zeit formatieren (HH:MM)
    statAvgTime.textContent = stats.averageIntervalMs ? formatTimeHHMM(stats.averageIntervalMs) : '--:--';
    statMinTime.textContent = stats.minIntervalMs ? formatTimeHHMM(stats.minIntervalMs) : '--:--';
    statMaxTime.textContent = stats.maxIntervalMs ? formatTimeHHMM(stats.maxIntervalMs) : '--:--';
}

// Zeit in HH:MM formatieren
function formatTimeHHMM(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
}

// Einstellungen speichern
async function saveSettings() {
    const newName = coworkerNameInput.value.trim();
    if (!newName) return;
    
    try {
        const settings = await ipcRenderer.invoke('update-settings', { 
            coworkerName: newName 
        });
        
        coworkerName = settings.coworkerName;
        showToast('Einstellungen gespeichert!');
    } catch (error) {
        console.error('Fehler beim Speichern der Einstellungen:', error);
    }
}

// Kaffee-Historie-Chart erstellen
async function createCoffeeHistoryChart() {
    try {
        const history = await ipcRenderer.invoke('get-coffee-history', 7); // 7 Tage Historie
        const ctx = document.getElementById('coffee-history-chart').getContext('2d');
        
        // Daten vorbereiten
        const labels = history.map(day => moment(day.date).format('DD.MM.'));
        const data = history.map(day => day.count);
        
        // Chart erstellen
        coffeeHistoryChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Kaffees pro Tag',
                    data: data,
                    backgroundColor: '#7d4f4a',
                    borderColor: '#4a2c2a',
                    borderWidth: 1,
                    borderRadius: 5,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#4a2c2a',
                        titleFont: {
                            family: "'Segoe UI', sans-serif",
                            size: 14
                        },
                        bodyFont: {
                            family: "'Segoe UI', sans-serif",
                            size: 14
                        },
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                return `${value} Kaffee${value !== 1 ? 's' : ''}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeOutQuart'
                }
            }
        });
    } catch (error) {
        console.error('Fehler beim Erstellen des Charts:', error);
    }
}

// Kaffee-Historie-Chart aktualisieren
async function updateCoffeeHistoryChart() {
    try {
        const history = await ipcRenderer.invoke('get-coffee-history', 7);
        
        // Daten aktualisieren
        const labels = history.map(day => moment(day.date).format('DD.MM.'));
        const data = history.map(day => day.count);
        
        if (coffeeHistoryChart) {
            coffeeHistoryChart.data.labels = labels;
            coffeeHistoryChart.data.datasets[0].data = data;
            coffeeHistoryChart.update();
        }
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Charts:', error);
    }
}

// ===== Animationen =====

// Kaffeetasse animieren
function animateCoffeeCup() {
    gsap.to('.coffee', {
        height: 45,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut'
    });
}

// Pulsierender Kaffee-Button
function animateCoffeeButtonPulse() {
    coffeeButton.classList.add('pulse');
}

// Kaffee-Aufzeichnung animieren
function animateCoffeeRecorded() {
    // Kurze Animation für den Kaffee-Button
    gsap.to(coffeeButton, {
        scale: 1.1,
        duration: 0.2,
        yoyo: true,
        repeat: 1
    });
    
    // Kaffeetasse "trinken" Animation
    gsap.to('.coffee', {
        height: 5,
        duration: 0.5,
        onComplete: () => {
            gsap.to('.coffee', {
                height: 40,
                duration: 1.5
            });
        }
    });
}

// Toast-Benachrichtigung anzeigen
function showToast(message, duration = 3000) {
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}