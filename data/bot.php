<?php
if(isset($_GET['uid'])) {
    $uid = $_GET['uid'];
}

?>


<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="./css/spotify.css">
    <title>Overlay</title>
</head>

<body>
    <div id="cred" style="display:none" cred-data="<?php echo $uid ?>"></div>


    <div id="track-info" class="track-info" style="">
        <div class="trackCover" id="trackCover"></div>
        
        <div id="topRow" class="topRow">
            <p id="topRowText"><?php echo file_get_contents('/spotify/info/current_artist.txt'); ?></p>
        </div>
        
        <div id="bottomRow" class="bottomRow">    
            <p id="bottomRowText" class="bottomRowText"><p id="topRowText"><?php echo file_get_contents('./spotify/info/current_track.txt'); ?></p></p>
        </div>
    </div>

    <script>
        var uid =  document.getElementById('cred').getAttribute('cred-data');
        
        if (socket && socket.readyState !== WebSocket.CLOSED) {
            socket.close();
        }

        if (!socket || socket.readyState === WebSocket.CLOSED) {
            var socket = new WebSocket(`wss://rubizockt.de:3000?uid=${uid}&client_type=overlay`);
        }
        var playerDiv; // Globale Variable für das div-Element
        
        let parsedMessage;
        let message;
        let oldTitle;
        let trackInfo; 

        const current_song = <?php echo file_get_contents('./spotify/info/current_track.json'); ?>;
        console.log("Aktueller Song:", current_song);

        const topRowDiv = document.getElementById('topRow');
        const scrollerRowDiv = document.getElementById('bottomRow');
        const trackInfoDiv = document.getElementById('track-info');
        const trackCover = document.getElementById('trackCover');

        let media = null;

        // JSON laden und global speichern
        fetch('./datasets/media.json')
            .then(response => response.json())
            .then(data => {
                media = data;
                console.log("Media-Daten geladen:", media);
            })
            .catch(error => console.error("Fehler beim Laden der JSON-Datei:", error));


        // Debugging: Sicherstellen, dass WebSocket erfolgreich verbunden ist
        socket.onopen = function(event) {
            console.log('WebSocket-Verbindung hergestellt');
        };

        // WebSocket-Nachricht empfangen
        socket.onmessage = function(event) {

            console.log("Empfangene Nachricht:", event.data); // Debugging

            let message = event.data;
            try {

                message = JSON.parse(message);  // Versuche, JSON zu parsen
                console.log("Gültige JSON-Nachricht:", message);

            } catch (error) {

                console.error("Invalid JSON:", message);

                return;  // Wenn die Nachricht kein gültiges JSON ist, nichts weiter tun
            }
                    
            try {
                
                if(message.cmd == 'trackUpdate'){
                    if (typeof message.data === "string") {
                        
                        const parsedData = JSON.parse(message.data);

                        // Prüfen, ob `parsedData.track` ein String ist
                        if (typeof parsedData.track === "string") {

                            trackInfo = JSON.parse(parsedData.track);

                        } else {

                            trackInfo = parsedData.track; // `track` ist bereits ein Objekt

                        }

                        console.log("Parsed Data:", trackInfo);

                    } else {

                        // Wenn `message.data` bereits ein Objekt ist
                        if (typeof message.data.track === "string") {

                            trackInfo = JSON.parse(message.data.track);

                        } else {

                            trackInfo = message.data.track; // `track` ist bereits ein Objekt
                            
                        }

                        console.log("Daten sind bereits ein Objekt:", trackInfo);

                    }
                }

            } catch (error) {

                console.error("Fehler beim Parsen von JSON:", error, "Originaldaten:", message.data);

            }

            
            switch (message.cmd) {
                case 'trackUpdate':
                    if (trackInfo) {
                        
                        if(trackInfoDiv.style.visibility = 'hidden'){
                            trackInfoDiv.style.visibility = 'visible';
                        }

                        console.log('Neuer Titel:', trackInfo.trackName);

                        // Überprüfe, ob der Titel sich geändert hat
                        if (!oldTitle || oldTitle !== trackInfo.trackName) {
                            
                            console.log('Titel hat sich geändert, Update durchführen');
                            
                            if (playerDiv) {
                                playerDiv.remove();  // Entferne vorheriges Element
                                playerDiv = null;
                            }

                            // Aktualisiere den Track-Info-Bereich
                            updateTrackInfoDiv(trackInfo);
                            oldTitle = trackInfo.trackName;  // Aktualisiere den alten Titel

                        } else {

                            console.log('Titel ist gleich, keine Änderung erforderlich');

                        }
                    }
                    break;
                
                case 'notPlaying':

                    console.log('Track nicht abgespielt');

                    trackInfoDiv.style.visibility = 'hidden';

                    break;

                case 'trigger':
                    
                        if (message.triggerName) {

                            console.log('Received Trigger', message.triggerName);

                            if (!media) {
                                console.log("Media-Daten sind noch nicht geladen.");
                                break;
                            }
                            
                            // Trigger-Logik
                            for (let command in media) {
                                
                                console.log(`Hier haben wir noch das Kommando: ${command} und gucken in ${media}`);

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

        // Initiales Setzen der Song-Informationen
        topRowDiv.innerHTML = `<p id="topRowText">${current_song.track.trackName}</p>`;
        scrollerRowDiv.innerHTML = `<p id="bottomRowText">${current_song.track.artistNames}</p>`;
        console.log("Aktueller Track-Name und Künstler:", current_song.track.trackName, current_song.track.artistNames);
        
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

            console.log("Track-Info-Daten:", trackInfo);

            const backgroundImageUrl = `spotify/info/current_image.jpg?${encodeURIComponent(trackInfo.artistNames)}`;
            
            // Debugging: Überprüfen der URL für das Hintergrundbild
            console.log("Hintergrundbild-URL:", backgroundImageUrl);
            
            trackCover.style.backgroundImage = `url(${backgroundImageUrl})`;

            // Textaktualisierung
            topRowDiv.innerHTML = `<p id="topRowText">${trackInfo.trackName}</p>`;
            scrollerRowDiv.innerHTML = `<p id="bottomRowText">${trackInfo.artistNames}</p>`;

            // Funktion zur Anwendung der Scroll-Animation
            function applyScrolling(element) {
                const textElement = element.querySelector('p');
                const headerElementWidth = element.offsetWidth;
                let textWidth = getTextWidth(textElement.textContent, "Arial, sans-serif");

                // Debugging: Breite des Elements und des Textes
                console.log("Breite des Headers:", headerElementWidth);
                console.log("Breite des Textes:", textWidth);

                if (textWidth > headerElementWidth) {
                    console.log("Text ist breiter als der Container, Animation anwenden.");
                    textElement.classList.add('scrolling');
                } else {
                    console.log("Text passt in den Container, keine Animation nötig.");
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

    </script>

</body>
</html>
