const uid = 'D4sP4ssw0rt.'
const newsBoxElement = document.getElementById("newsScroll");
const newsTextElement = document.getElementById("newsText");

let current_song;
let titles = [];
let parsedMessage;
let message;
let oldTitle;
let trackInfo; 
let textWidth;
let media = null;
let socket = null; 

const topRowDiv = document.getElementById('topRow');
const scrollerRowDiv = document.getElementById('bottomRow');
const trackInfoDiv = document.getElementById('track-info');
const trackCover = document.getElementById('trackCover');
const currentSongUrl = 'https://rubizockt.de/spotify/info/current_track.json';

if (socket && socket.readyState !== WebSocket.CLOSED) {
    socket.close();
}

if (!socket || socket === null) {
    socket = new WebSocket(`wss://rubizockt.de:3000?uid=${uid}&client_type=overlay`);
}


fetch(currentSongUrl)
.then(response => {
    if (!response.ok) {
    throw new Error(`HTTP-Error: ${response.status}`);
    }
    return response.json(); // Antwort als JSON parsen
})
.then(currentSong => {
    current_song = currentSong;
    if (current_song && current_song.track) {
        topRowDiv.innerHTML = `<p id="topRowText">${current_song.track.trackName}</p>`;
        scrollerRowDiv.innerHTML = `<p id="bottomRowText">${current_song.track.artistNames}</p>`;
        console.log("Aktueller Track-Name und Künstler:", current_song.track.trackName, current_song.track.artistNames);
    }
});

// JSON laden und global speichern
fetch('https://rubizockt.de/datasets/media.json').then(response => response.json()).then(data => {
    media = data;
    console.log("Media-Daten geladen:", media);
}).catch(error => console.error("Fehler beim Laden der JSON-Datei:", error));

async function getRssFeed() {
    const rssUrl = 'https://rubizockt.de:3000/rss-feed'; // Dein PHP-Endpunkt

    try {
        // RSS-Feed abrufen
        const response = await fetch(rssUrl);
        if (!response.ok) {
            throw new Error(`HTTP-Error: ${response.status}`);
        }

        const jsonData = await response.json(); // JSON-Antwort

        // jsonData ist bereits ein Array mit Titeln
        return jsonData;

    } catch (error) {
        console.error("RSS Feed Error:", error);
        return null;
    }
}

async function getNews(){

    console.log('News werden abgerufen...');
    titles = await getRssFeed();
    setTimeout(getNews, 60000);
    newsTextElement.innerHTML = titles.map(title => {
        return `${title} <img src="http://rubizockt.de/img/rz_icon.png" style="width: 30px; height: 30px; vertical-align: revert;">`;
    }).join('');
    
}

// Emoji erstellen
function createEmoji(src) {
    const emoji = document.createElement('img');
    emoji.src = src;
    emoji.style.position = 'fixed';
    emoji.style.left = Math.random() * (window.innerWidth - 100) + 'px';
    emoji.style.top = Math.random() * (window.innerHeight / 3) + 'px';
    emoji.style.width = '100px';
    emoji.style.height = '100px';
    emoji.style.zIndex = 1000;
    emoji.classList.add('falling-emoji');
    document.body.appendChild(emoji);

    setTimeout(() => emoji.remove(), 10000);
}

// Audio abspielen
function playAudio(src) {
    const audio = document.createElement('audio');
    audio.src = src;
    audio.autoplay = true;
    audio.style.position = 'fixed';
    audio.style.zIndex = 1000;
    document.body.appendChild(audio);
    audio.onended = function() {
        audio.remove();
    };
}

// Video abspielen
function playVideo(src) {
    const video = document.createElement('video');
    video.src = src;
    video.autoplay = true;
    video.style.position = 'fixed';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.zIndex = 1000;
    document.body.appendChild(video);
    video.onended = function() {
        video.remove();
    };
}

// Funktion zur Aktualisierung der Track-Informationen
function updateTrackInfoDiv(trackInfo) {
    const trackCover = document.getElementById('trackCover');
    const topRowDiv = document.getElementById('topRow');
    const scrollerRowDiv = document.getElementById('bottomRow');
    const trackInfoDiv = document.getElementById('track-info');

    // Debugging: Überprüfen, ob alle DOM-Elemente vorhanden sind
    if (!trackCover || !topRowDiv || !scrollerRowDiv || !trackInfoDiv) {
        console.error("Fehlende DOM-Elemente:", {
            trackCover,
            topRowDiv,
            scrollerRowDiv,
            trackInfoDiv
        });
        return;
    }


    const backgroundImageUrl = `spotify/info/current_image.jpg?${encodeURIComponent(trackInfo.artistNames)}`;
    
    // Debugging: Überprüfen der URL für das Hintergrundbild
    
    trackCover.style.backgroundImage = `url(${backgroundImageUrl})`;

    // Textaktualisierung
    topRowDiv.innerHTML = `<p id="topRowText">${trackInfo.trackName}</p>`;
    scrollerRowDiv.innerHTML = `<p id="bottomRowText">${trackInfo.artistNames}</p>`;

    // Funktion zur Anwendung der Scroll-Animation
    function applyScrolling(element) {
        const textElement = element.querySelector('p');
        const headerElementWidth = element.offsetWidth;
        textWidth = getTextWidth(textElement.textContent, "Arial, sans-serif");

        // Debugging: Breite des Elements und des Textes

        if (textWidth > headerElementWidth) {
            console.log("Text ist breiter als der Container, Animation anwenden.");
            textElement.classList.add('scrolling');
        } else {
            textElement.classList.remove('scrolling');
        }
    }

    // Überprüfe beide Zeilen
    applyScrolling(topRowDiv);
    applyScrolling(scrollerRowDiv);

    trackInfoDiv.style.visibility = 'visible';
}

// Hilfsfunktion zur Berechnung der Textbreite
function getTextWidth(text, font) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    context.font = font;
    const width = context.measureText(text).width;
    console.log("Berechnete Textbreite:", width);
    return width;
}

function showNews() {
    
    newsBoxElement.classList.remove("newsBoxOut"); // Sicherstellen, dass "Ausfliegen" entfernt wird
    newsBoxElement.classList.add("newsBoxIn");
    // Nach 5 Minuten die newsBox ausblenden
    setTimeout(() => {
        newsBoxElement.classList.remove("newsBoxIn");
        newsBoxElement.classList.add("newsBoxOut");
    }, 150000); // 5 Minuten in Millisekunden
}

// Beispiel-Trigger-Funktion für Medienaktionen
function handleMediaAction(triggerName) {
    console.log("Trigger empfangen:", triggerName);
    if (triggerName === 'emoji') {
        createEmoji('emoji_src');
    } else if (triggerName === 'audio') {
        playAudio('audio_src');
    } else if (triggerName === 'video') {
        playVideo('video_src');
    }
}

function getURLParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}


window.onload = function() {

    getNews();

};

// Debugging: Sicherstellen, dass WebSocket erfolgreich verbunden ist
socket.onopen = function(event) {
    console.log('WebSocket-Verbindung hergestellt');
};

// WebSocket-Nachricht empfangen
socket.onmessage = function(event) {


    let message = event.data;
    try {

        message = JSON.parse(message);  // Versuche, JSON zu parsen
        console.log("Gültige JSON-Nachricht:", message);

    } catch (error) {

        console.error("Invalid JSON:", message);

        return;  // Wenn die Nachricht kein gültiges JSON ist, nichts weiter tun
    }

    
    switch (message.cmd) {
        case 'trackUpdate':

            try {
                // Parsen des JSON-Strings in ein JavaScript-Objekt
                const parsedData = JSON.parse(message.data);
                
                // Überprüfen, ob `track` existiert
                if (parsedData && parsedData.track) {
                    trackInfo = parsedData.track;
                    
                    // Zugriff auf die einzelnen Eigenschaften
                    const trackName = trackInfo.trackName;
                    const artistNames = trackInfo.artistNames;
                    const trackImage = trackInfo.trackImage;
                    
                } else {
                    console.error('+++ TRACKINFO is undefined or missing in parsedData:', parsedData);
                }
            } catch (e) {
                console.error('Error parsing JSON data:', e);
            }
            if ( trackInfo ) {
                if(trackInfoDiv.style.visibility = 'hidden'){
                    trackInfoDiv.style.visibility = 'visible';
                }

                console.log('Neuer Titel:', trackInfo.trackName);

                // Überprüfe, ob der Titel sich geändert hat
                if (!oldTitle || oldTitle !== trackInfo.trackName) {
                    
                    console.log('Titel hat sich geändert, Update durchführen');

                    // Aktualisiere den Track-Info-Bereich
                    updateTrackInfoDiv(trackInfo);
                    oldTitle = trackInfo.trackName;  // Aktualisiere den alten Titel

                } else {

                    console.log('INFO: ...running... ');

                }
            }
            break;
        
        case 'notPlaying':

            trackInfoDiv.style.visibility = 'hidden';

            break;

        case 'trigger':
            
                if (message.triggerName) {

                    console.log('Received Trigger', message.triggerName);
                    
                    if (message.triggerName === 'newsTime'){
                        showNews();
                        break;
                    }

                    if (!media) {
                        console.log("Media-Daten sind noch nicht geladen.");
                        break;
                    }
                    
                    // Trigger-Logik
                    for (let command in media) {
                        

                        if (message.triggerName.includes(command)) {
                            
                            console.log(`KOMMANDO ${command} erkannt ... `);
                            
                            switch (media[command].type) {

                                case 'emoji':
                                    console.log("EMOJI");
                                    createEmoji(media[command].src);
                                    break;

                                case 'audio':
                                    console.log("AUDIO");
                                    playAudio(media[command].src);
                                    break;

                                case 'video':
                                    console.log("VIDEO");
                                    playVideo(media[command].src);
                                    break;

                            }

                            break;  // Falls nur ein Command behandelt werden soll
                        }

                    };
                }
    };
};

// WebSocket-Verbindung geschlossen
socket.onclose = function(event) {
    console.log("WebSocket-Verbindung geschlossen:", event);
};

// Fehlerbehandlung bei WebSocket
socket.onerror = function(error) {
    console.error("WebSocket-Fehler:", error);
};

