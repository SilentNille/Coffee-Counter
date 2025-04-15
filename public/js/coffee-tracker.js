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
const dateFilter = document.getElementById('date-filter');
const coffeeEntriesList = document.getElementById('coffee-entries-list');

// Statistik-Tabs und Tab-Inhalte
const statsTabButtons = document.querySelectorAll('.stats-tab-btn');
const statsTabContents = document.querySelectorAll('.stats-tab-content');
const monthSelect = document.getElementById('month-select');

// All-Time Statistik Elemente
const alltimeCount = document.getElementById('alltime-count');
const alltimeDays = document.getElementById('alltime-days');
const alltimeAvgPerDay = document.getElementById('alltime-avg-per-day');
const alltimeMaxDay = document.getElementById('alltime-max-day');
const alltimeFirstDate = document.getElementById('alltime-first-date');
const alltimeLastDate = document.getElementById('alltime-last-date');
const alltimePopularHour = document.getElementById('alltime-popular-hour');
const alltimeAvgInterval = document.getElementById('alltime-avg-interval');

// Monats-Statistik Elemente
const monthCount = document.getElementById('month-count');
const monthAvgPerDay = document.getElementById('month-avg-per-day');
const monthActiveDayCount = document.getElementById('month-active-day-count');
const monthAvgInterval = document.getElementById('month-avg-interval');

// Charts
let hourDistributionChart = null;
let dayDistributionChart = null;

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
let allCoffeeEntries = [];
let availableDates = [];

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

    // Detaillierte Kaffee-Einträge laden
    await loadCoffeeEntries();
    
    // Detaillierte Statistiken laden
    await loadDetailedStats();
    
    // Event-Listener für Statistik-Tabs
    setupStatisticsTabs();
    
    // Event-Listener für Datum-Filter
    dateFilter.addEventListener('change', filterCoffeeEntries);
    
    // Event-Listener für Monats-Auswahl
    monthSelect.addEventListener('change', loadMonthStats);
    
    // GSAP-Animation für die Kaffeetasse
    animateCoffeeCup();
    
    // Kaffee-Blasen hinzufügen
    createCoffeeBubbles();
    
    // Fliegende Kaffeebohnen hinzufügen
    createFlyingBeans();
    
    // Tanzende Kaffeebohne hinzufügen
    createDancingBean();
    
    // Hintergrund-Animation starten
    animateBackground();
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
        
        // Timer-Animation starten (nicht den Kaffee-Button)
        animateTimerDisplay();
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

        // Kaffee-Einträge neu laden
        await loadCoffeeEntries();
        
        // Detaillierte Statistiken aktualisieren
        await loadDetailedStats();
        
        // Animation und Benachrichtigung
        animateCoffeeRecorded();
        showToast(`Kaffee für ${coworkerName} aufgezeichnet!`);
        
        // Zufällig Blasen neu erzeugen
        createCoffeeBubbles();
        
        // Zufällige fliegende Bohne erzeugen
        if (Math.random() > 0.5) {
            createFlyingBeans(1);
        }
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

// Alle Kaffee-Einträge laden
async function loadCoffeeEntries() {
    try {
        // Alle Kaffee-Einträge abrufen
        allCoffeeEntries = await ipcRenderer.invoke('get-coffee-details');
        
        // Nach Datum sortieren (neuste zuerst)
        allCoffeeEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Verfügbare Datumsoptionen für den Filter erstellen
        updateDateFilterOptions();
        
        // Einträge anzeigen (anfangs nach aktuellem Filter)
        filterCoffeeEntries();
    } catch (error) {
        console.error('Fehler beim Laden der Kaffee-Einträge:', error);
    }
}

// Datumsfilter-Optionen aktualisieren
function updateDateFilterOptions() {
    // Bestehende Optionen speichern
    const currentValue = dateFilter.value;
    
    // Dropdown leeren, aber "Alle Einträge" Option beibehalten
    while (dateFilter.options.length > 1) {
        dateFilter.remove(1);
    }
    
    // Eindeutige Tage extrahieren
    const uniqueDays = [...new Set(allCoffeeEntries.map(entry => entry.dayId))];
    uniqueDays.sort().reverse(); // Neueste zuerst
    
    // Optionen für jeden Tag hinzufügen
    uniqueDays.forEach(day => {
        const option = document.createElement('option');
        option.value = day;
        // Formatiere das Datum als DD.MM.YYYY
        const [year, month, day_num] = day.split('-');
        option.textContent = `${day_num}.${month}.${year}`;
        dateFilter.appendChild(option);
    });
    
    // Vorherige Auswahl wiederherstellen, falls vorhanden
    if (currentValue && dateFilter.querySelector(`option[value="${currentValue}"]`)) {
        dateFilter.value = currentValue;
    } else {
        // Sonst heute auswählen oder "Alle" falls heute keine Einträge hat
        const today = new Date().toISOString().split('T')[0];
        if (dateFilter.querySelector(`option[value="${today}"]`)) {
            dateFilter.value = today;
        } else {
            dateFilter.value = 'all';
        }
    }
}

// Kaffee-Einträge nach Datum filtern
function filterCoffeeEntries() {
    const selectedDate = dateFilter.value;
    let filteredEntries;
    
    if (selectedDate === 'all') {
        filteredEntries = allCoffeeEntries;
    } else {
        filteredEntries = allCoffeeEntries.filter(entry => entry.dayId === selectedDate);
    }
    
    // Einträge im UI anzeigen
    displayCoffeeEntries(filteredEntries);
}

// Kaffee-Einträge im UI anzeigen
function displayCoffeeEntries(entries) {
    // Liste leeren
    coffeeEntriesList.innerHTML = '';
    
    if (entries.length === 0) {
        // Nachricht anzeigen, wenn keine Einträge vorhanden sind
        const noEntries = document.createElement('div');
        noEntries.className = 'no-entries-message';
        noEntries.textContent = 'Keine Kaffee-Einträge gefunden.';
        coffeeEntriesList.appendChild(noEntries);
        return;
    }
    
    // Jeden Eintrag anzeigen
    entries.forEach(entry => {
        const entryElement = document.createElement('div');
        entryElement.className = 'coffee-entry';
        
        // Datum und Uhrzeit formatieren
        const entryDate = new Date(entry.timestamp);
        const formattedDate = entryDate.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        const formattedTime = entryDate.toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Intervall formatieren (falls vorhanden)
        let intervalText = '';
        if (entry.intervalMs > 0) {
            intervalText = `Intervall: ${formatTimeHHMM(entry.intervalMs)}`;
        }
        
        // HTML für den Eintrag erstellen
        entryElement.innerHTML = `
            <div class="entry-info">
                <span class="entry-date">${formattedDate}</span>
                <span class="entry-time">${formattedTime} Uhr</span>
                ${intervalText ? `<span class="entry-interval">${intervalText}</span>` : ''}
            </div>
            <div class="entry-actions">
                <button class="delete-entry-btn" data-id="${entry.id}">
                    <i class="fas fa-trash-alt"></i> Entfernen
                </button>
            </div>
        `;
        
        // Löschen-Button mit Event-Handler versehen
        const deleteBtn = entryElement.querySelector('.delete-entry-btn');
        deleteBtn.addEventListener('click', () => removeCoffeeEntry(entry.id));
        
        // Eintrag zur Liste hinzufügen
        coffeeEntriesList.appendChild(entryElement);
    });
}

// Kaffee-Eintrag entfernen
async function removeCoffeeEntry(coffeeId) {
    if (confirm('Möchtest du diesen Kaffee-Eintrag wirklich löschen?')) {
        try {
            // Eintrag über IPC löschen
            const success = await ipcRenderer.invoke('remove-coffee', coffeeId);
            
            if (success) {
                // Einträge neu laden
                await loadCoffeeEntries();
                
                // Statistik und Chart aktualisieren
                await loadTodayStats();
                await updateCoffeeHistoryChart();
                
                // Detaillierte Statistiken aktualisieren
                await loadDetailedStats();
                
                showToast('Kaffee-Eintrag wurde gelöscht!');
            } else {
                showToast('Fehler beim Löschen des Eintrags!');
            }
        } catch (error) {
            console.error('Fehler beim Entfernen des Kaffee-Eintrags:', error);
            showToast('Fehler beim Löschen des Eintrags!');
        }
    }
}

// ===== Detaillierte Statistiken =====

// Tab-Funktionalität für Statistiken einrichten
function setupStatisticsTabs() {
    statsTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Aktiven Tab zurücksetzen
            statsTabButtons.forEach(btn => btn.classList.remove('active'));
            statsTabContents.forEach(content => content.classList.remove('active'));
            
            // Neuen Tab aktivieren
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`${tabId}-stats`).classList.add('active');
        });
    });
}

// Detaillierte Statistiken laden
async function loadDetailedStats() {
    try {
        // Alle-Zeit Statistiken laden
        await loadAllTimeStats();
        
        // Verfügbare Monate laden
        await loadAvailableMonths();
        
        // Monatsstatistiken für den aktuell ausgewählten Monat laden
        await loadMonthStats();
    } catch (error) {
        console.error('Fehler beim Laden der detaillierten Statistiken:', error);
    }
}

// Alle-Zeit Statistiken laden
async function loadAllTimeStats() {
    try {
        const stats = await ipcRenderer.invoke('get-all-time-stats');
        
        // Statistiken anzeigen
        alltimeCount.textContent = stats.count;
        alltimeDays.textContent = stats.totalDays;
        alltimeAvgPerDay.textContent = stats.averagePerDay.toFixed(1);
        alltimeMaxDay.textContent = stats.maxInOneDay;
        
        if (stats.firstDate) {
            const firstDate = new Date(stats.firstDate);
            alltimeFirstDate.textContent = firstDate.toLocaleDateString('de-DE');
        } else {
            alltimeFirstDate.textContent = '--';
        }
        
        if (stats.lastDate) {
            const lastDate = new Date(stats.lastDate);
            alltimeLastDate.textContent = lastDate.toLocaleDateString('de-DE');
        } else {
            alltimeLastDate.textContent = '--';
        }
        
        if (stats.popularHour !== null) {
            alltimePopularHour.textContent = `${stats.popularHour}:00 Uhr`;
        } else {
            alltimePopularHour.textContent = '--';
        }
        
        if (stats.averageIntervalMs) {
            alltimeAvgInterval.textContent = formatTimeHHMM(stats.averageIntervalMs);
        } else {
            alltimeAvgInterval.textContent = '--:--';
        }
        
        // Stunden-Verteilungs-Chart erstellen
        await createHourDistributionChart();
    } catch (error) {
        console.error('Fehler beim Laden der Alle-Zeit Statistiken:', error);
    }
}

// Verfügbare Monate laden
async function loadAvailableMonths() {
    try {
        const months = await ipcRenderer.invoke('get-available-months');
        
        // Dropdown leeren
        monthSelect.innerHTML = '';
        
        if (months.length === 0) {
            // Fallback-Option, wenn keine Daten vorhanden sind
            const option = document.createElement('option');
            option.value = JSON.stringify({ year: new Date().getFullYear(), month: new Date().getMonth() });
            option.textContent = 'Aktueller Monat';
            monthSelect.appendChild(option);
            return;
        }
        
        // Optionen für jeden Monat hinzufügen
        months.forEach(monthData => {
            const option = document.createElement('option');
            option.value = JSON.stringify(monthData);
            
            const monthNames = [
                'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
            ];
            
            option.textContent = `${monthNames[monthData.month]} ${monthData.year}`;
            monthSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Fehler beim Laden der verfügbaren Monate:', error);
    }
}

// Monatsstatistiken laden
async function loadMonthStats() {
    try {
        const selectedOption = JSON.parse(monthSelect.value);
        const { year, month } = selectedOption;
        
        const stats = await ipcRenderer.invoke('get-month-stats', year, month);
        
        // Statistiken anzeigen
        monthCount.textContent = stats.count;
        monthAvgPerDay.textContent = stats.averagePerDay.toFixed(1);
        monthActiveDayCount.textContent = stats.mostActiveDayCount || '0';
        
        if (stats.averageIntervalMs) {
            monthAvgInterval.textContent = formatTimeHHMM(stats.averageIntervalMs);
        } else {
            monthAvgInterval.textContent = '--:--';
        }
        
        // Tages-Verteilungs-Chart erstellen
        createDayDistributionChart(stats.dayDistribution, month, year);
    } catch (error) {
        console.error('Fehler beim Laden der Monatsstatistiken:', error);
    }
}

// Stunden-Verteilungs-Chart erstellen
async function createHourDistributionChart() {
    try {
        // Alle Kaffee-Einträge laden
        const allCoffees = await ipcRenderer.invoke('get-coffee-details');
        
        // Verteilung nach Stunden berechnen
        const hourDistribution = Array(24).fill(0);
        
        allCoffees.forEach(coffee => {
            const hour = new Date(coffee.timestamp).getHours();
            hourDistribution[hour]++;
        });
        
        // Stundenlabels erstellen
        const hourLabels = Array(24).fill().map((_, i) => `${i}:00`);
        
        // Chart initialisieren oder aktualisieren
        const ctx = document.getElementById('hour-distribution-chart').getContext('2d');
        
        if (hourDistributionChart) {
            hourDistributionChart.destroy();
        }
        
        hourDistributionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: hourLabels,
                datasets: [{
                    label: 'Kaffees pro Stunde',
                    data: hourDistribution,
                    backgroundColor: '#a67c52',
                    borderColor: '#7d4f4a',
                    borderWidth: 1,
                    borderRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function(items) {
                                return `${items[0].label} Uhr`;
                            },
                            label: function(context) {
                                const value = context.raw;
                                return `${value} Kaffee${value !== 1 ? 's' : ''}`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Fehler beim Erstellen des Stunden-Verteilungs-Charts:', error);
    }
}

// Tages-Verteilungs-Chart erstellen
function createDayDistributionChart(dayDistribution, month, year) {
    // Anzahl der Tage im angegebenen Monat
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Nur die relevanten Tage anzeigen
    const relevantDistribution = dayDistribution.slice(0, daysInMonth);
    
    // Tageslabels erstellen (1-31)
    const dayLabels = Array(daysInMonth).fill().map((_, i) => i + 1);
    
    // Chart initialisieren oder aktualisieren
    const ctx = document.getElementById('day-distribution-chart').getContext('2d');
    
    if (dayDistributionChart) {
        dayDistributionChart.destroy();
    }
    
    dayDistributionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dayLabels,
            datasets: [{
                label: 'Kaffees pro Tag',
                data: relevantDistribution,
                backgroundColor: '#a67c52',
                borderColor: '#7d4f4a',
                borderWidth: 1,
                borderRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: function(items) {
                            const monthNames = [
                                'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                                'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
                            ];
                            return `${items[0].label}. ${monthNames[month]}`;
                        },
                        label: function(context) {
                            const value = context.raw;
                            return `${value} Kaffee${value !== 1 ? 's' : ''}`;
                        }
                    }
                }
            }
        }
    });
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

// Timer-Anzeige animieren statt Kaffee-Button
function animateTimerDisplay() {
    // Timer-Heartbeat-Animation starten
    timerDisplay.classList.add('timer-heartbeat');
}

// Kaffee-Aufzeichnung animieren
function animateCoffeeRecorded() {
    // Kurze Animation für den Kaffee-Button (keine Größenänderung der Breite)
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

// Kaffee-Blasen erstellen
function createCoffeeBubbles() {
    // Referenz auf die Kaffeeoberfläche
    const coffee = document.querySelector('.coffee');
    
    // Vorhandene Blasen entfernen
    coffee.querySelectorAll('.bubble').forEach(bubble => bubble.remove());
    
    // 5 neue Blasen hinzufügen
    for (let i = 0; i < 5; i++) {
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        coffee.appendChild(bubble);
    }
}

// Fliegende Kaffeebohnen erstellen
function createFlyingBeans(count = 2) {
    // Container für die App
    const appContainer = document.querySelector('.app-container');
    
    // Anzahl der zu erzeugenden Bohnen
    const beansCount = count || Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < beansCount; i++) {
        const bean = document.createElement('div');
        bean.classList.add('flying-bean');
        
        // Zufällige Verzögerung für Animation
        bean.style.animationDelay = `${Math.random() * 2}s`;
        
        // Zufällige Position der Bohne
        bean.style.top = `${20 + Math.random() * 60}%`;
        
        appContainer.appendChild(bean);
        
        // Bohne nach Ende der Animation entfernen
        setTimeout(() => {
            bean.remove();
        }, 8000 + Math.random() * 2000); // Etwas länger als die Animation
    }
}

// Tanzende Kaffeebohne erstellen
function createDancingBean() {
    // Container für die App
    const footer = document.querySelector('.footer');
    
    // Tanzende Bohne erstellen
    const bean = document.createElement('div');
    bean.classList.add('dancing-bean');
    
    footer.appendChild(bean);
}

// Regenbogen-Text-Effekt wurde entfernt
// Stattdessen Hintergrund-Animation hinzufügen
function animateBackground() {
    // Hintergrund-Container erstellen
    const appContainer = document.querySelector('.app-container');
    const bgContainer = document.createElement('div');
    bgContainer.className = 'background-effects';
    appContainer.prepend(bgContainer);
    
    // Verschiedene Hintergrund-Elemente hinzufügen
    for (let i = 0; i < 10; i++) {
        // Kaffeeflecken im Hintergrund
        const coffeeStain = document.createElement('div');
        coffeeStain.className = 'coffee-stain';
        coffeeStain.style.top = `${Math.random() * 100}%`;
        coffeeStain.style.left = `${Math.random() * 100}%`;
        coffeeStain.style.opacity = 0.05 + Math.random() * 0.05;
        coffeeStain.style.transform = `rotate(${Math.random() * 360}deg) scale(${0.5 + Math.random()})`;
        bgContainer.appendChild(coffeeStain);
    }
    
    // Subtile Animation für die Hintergrund-Elemente
    gsap.to('.coffee-stain', {
        scale: 1.1,
        opacity: '-=0.02',
        duration: 4,
        stagger: 0.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
    });
    
    // Sanfte Farbverlaufs-Animation für den Hintergrund
    gsap.to('.background-effects', {
        background: 'radial-gradient(circle, rgba(230,210,181,0.5) 0%, rgba(248,240,227,0) 70%)',
        duration: 5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
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