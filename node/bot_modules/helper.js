
import http from 'https';
import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';
import console2025 from './logging.js';

// Funktion zur Generierung einer Zufallszahl
export const randomNumber = function(maxVal) {
    // Generiere eine zufällige Dezimalzahl zwischen 0 und 1
    const randomDecimal = Math.random();
    // Skaliere die zufällige Dezimalzahl auf den gewünschten Bereich
    const randomInteger = Math.floor(randomDecimal * maxVal) + 1;
    return randomInteger;
}


export function sendAll (activeWsClients,message) {
    for (let i = 0; i < activeWsClients.length; i++) {
        activeWsClients[i].ws.send(JSON.stringify(message)); // Zugriff auf ws
    }

}

// Hilfsfunktion: Dateiinhalt lesen
export function readFileContent(filePath) {
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf8').trim();
    }
    return '';
}

// Hilfsfunktion: JSON-Daten erstellen und speichern
export function saveToJson(filePath, data) {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonData, 'utf8');
    console2025.log('server',`Daten in JSON-Datei gespeichert: ${filePath}`, 'info');
}

export async function getRssFeed() {
    const rssUrl = 'https://newsfeed.zeit.de/index';

    try {
        // RSS-Feed abrufen
        const response = await fetch(rssUrl);
        if (!response.ok) {
            throw new Error(`HTTP-Error: ${response.status}`);
        }

        const xmlData = await response.text();

        // XML in JSON umwandeln
        const jsonData = await parseStringPromise(xmlData, { explicitArray: false });

        // Nur die Titel extrahieren
        const titles = jsonData.rss.channel.item.map(item => item.title);
        const uniqueTitles = [...new Set(titles)];

        return uniqueTitles;
        
    } catch (error) {
        console.error("RSS Feed Error:", error);
        return null;
    }
}

export function getRequiredVotesPercentage(viewerCount) {
    if (viewerCount <= 2) return 1.0; // 100%
    if (viewerCount <= 5) return 0.5; // 50%
    if (viewerCount <= 15) return 0.55; // 55%
    if (viewerCount <= 40) return 0.5; // 50%
    return 0.4; // 40% bei vielen Zuschauern
}