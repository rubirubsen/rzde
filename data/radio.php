<?php

?>

<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RubiRadio</title>
    <style>
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f0f0f0; }
        #audioContainer { text-align: center; padding: 20px; background: #ffffff; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
        .mobile #audioContainer { width: 90vw; }
        .desktop #audioContainer { width: 400px; margin: auto; position: absolute;}
    </style>
    <script>
        // Geräteerkennung für mobile und Desktop-Ansicht
        function checkDevice() {
            if (window.innerWidth <= 768) {
                document.body.classList.add('mobile');
            } else {
                document.body.classList.add('desktop');
            }
        }

        // Event listener für Gerätewechsel
        window.addEventListener('resize', checkDevice);
        window.addEventListener('DOMContentLoaded', () => {
            checkDevice();

            // Versuch, Audio weiterlaufen zu lassen
            const audio = document.querySelector('audio');
            audio.addEventListener('play', () => {
                if (navigator.userAgent.includes('Mobile') && !document.pictureInPictureElement) {
                    audio.requestPictureInPicture(); // Versucht, Audio im Hintergrund abzuspielen
                }
            });
        });
    </script>
</head>
<body>
    <button onclick="history.back()" class="back-button" style="position: absolute;top: 15em;">Back to Home</button>
    <hr>
    <div id="audioContainer">
        <audio title="RubiRadio" controls="controls" src="https://rubizockt.de/stream" style="background-image:url(/spotify/info/current_image.jpg);"></audio>
        <br>
        <div style="font-size:0.8em;" id="currentTrack">
        
            <?php
                echo "Aktueller Titel: " . file_get_contents('./spotify/info/current_artist.txt') . " - " . file_get_contents('./spotify/info/current_track.txt');
            ?>
        </div>
        <script>
    // Funktion zum Abrufen und Aktualisieren des Titels
            function updateCurrentTrack() {
                fetch('./spotify/info/current_track.txt')
                    .then(response => response.text())
                    .then(data => {
                        // Hier den Text im HTML-Element aktualisieren
                        const currentTrackElement = document.getElementById('currentTrack');
                        const currentArtist = "<?php echo file_get_contents('./spotify/info/current_artist.txt'); ?>"; // Hier den Künstler dynamisch einbinden
                        currentTrackElement.innerHTML = `Aktueller Titel: ${currentArtist} - ${data}`;
                    })
                    .catch(error => console.error('Fehler beim Abrufen des Titels:', error));
            }

            // Alle 3 Sekunden die Funktion ausführen
            setInterval(updateCurrentTrack, 3000);
        </script>
    </div>
</body>
</html>