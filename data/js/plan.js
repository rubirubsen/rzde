let currentSubject = null;
const timetable = document.querySelector(".timetable");


function addSubject() {
    const subjectInput = document.getElementById("subject");
    const durationInput = document.getElementById("duration");
    const dayInput = document.getElementById("day");
    const startTimeInput = document.getElementById('start_time');

    const subject = subjectInput.value;
    const day = dayInput.value;
    const start_time = startTimeInput.value; // sollte im Format "HH:MM" sein
    const duration = parseInt(durationInput.value);

    // Validierung
    if (!subject || !day || !start_time || isNaN(duration) || duration <= 0) {
        alert("Bitte geben Sie alle erforderlichen Informationen ein.");
        return;
    }

    // Sende die Daten an den Server
    fetch('schedule.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            subject: subject,
            day: day,
            start_time: start_time, // sollte im richtigen Format sein
            duration: duration
        }),
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.message || data.error);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}


function allowDrop(event) {
    event.preventDefault(); // Verhindert das Standardverhalten
}

function drop(event, day) {
    event.preventDefault();
    const subjectBlock = currentSubject.textContent; // aktuellen Fachnamen verwenden

    // Hier die Uhrzeit und Dauer aus dem Block extrahieren
    const startTime = event.target.dataset.startTime; // Angenommene Struktur
    const duration = currentSubject.duration; // Muss im subjectBlock gespeichert werden oder von woanders kommen

    // Block in die Drop-Zone einfügen
    event.target.innerHTML += `<div>${subjectBlock}</div>`;
    
    // Daten an den Server senden
    fetch('schedule.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            subject: subjectBlock,
            day: day,
            start_time: startTime,
            duration: duration
        }),
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.message);
        loadActivities(); // Aktivitäten neu laden nach dem Hinzufügen
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}


// Funktion zum Laden der Aktivitäten
function loadActivities(activities) {
    for (const activity of activities) {
        const { subject, day, start_time, duration } = activity;
        
        // Berechne die Start- und Endzeit
        const startHour = parseInt(start_time.split(':')[0], 10);
        const totalHours = Math.ceil(duration / 60); // Anzahl der benötigten Stunden
        const dayIndex = getDayIndex(day); // Diese Funktion gibt den Index des Wochentags zurück
        
        // Überprüfen, ob der Platz für die Aktivität verfügbar ist
        let canAddActivity = true;
        
        for (let i = 0; i < totalHours; i++) {
            const rowIndex = startHour + 1 + i; // +1, um die Kopfzeile zu überspringen
            const existingRow = timetable.rows[rowIndex];
            console.log("rowIndex:", rowIndex);
            console.log("timetable.rows.length:", timetable.rows.length);
            if (existingRow && existingRow.cells[dayIndex + 1].textContent) {
                canAddActivity = false; // Platz ist belegt
                break;
            }
        }

        if (canAddActivity) {
            // Aktivität einfügen
            const row = timetable.insertRow(startHour + 1); // erste Zeile für die Aktivität
            const timeCell = row.insertCell(0);
            timeCell.textContent = start_time;

            const activityCell = row.insertCell(dayIndex + 1);
            activityCell.textContent = subject;

            // Höhe anpassen
            const height = (duration / 60) * 50; // Höhe in Pixel (50px pro Stunde)
            activityCell.style.height = `${height}px`;
            activityCell.style.backgroundColor = 'lightblue'; // Hintergrundfarbe

            // Die nachfolgenden Zeilen unsichtbar machen oder Höhe auf 0 setzen
            for (let i = 1; i < totalHours; i++) {
                const nextRow = timetable.insertRow(startHour + 1 + i); // Nächste Zeile
                const nextActivityCell = nextRow.insertCell(dayIndex + 1);
                nextActivityCell.style.height = '0'; // Unsichtbar machen
            }
        }
    }
}

// Lade die Aktivitäten beim Laden der Seite
window.onload = loadActivities(activities);

function getDayIndex(day) {
    const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
    return days.indexOf(day);
}

function updateSubject(id) {
    // Neue Werte abrufen
    const updatedSubject = document.getElementById('updatedSubject').value;
    const updatedDuration = document.getElementById('updatedDuration').value;

    fetch(`/updateSubject/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ subject: updatedSubject, duration: updatedDuration })
    })
    .then(response => response.json())
    .then(data => {
        // Stundenplan neu laden
        loadActivities(); // Update die Aktivitäten
    })
    .catch(error => console.error('Fehler beim Aktualisieren des Fachs:', error));
}
