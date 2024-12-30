<!DOCTYPE html>
<html lang="de">
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>RubiZockt bald wieder!</title>
    <link rel="stylesheet" href="css/rubStyle.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js"></script>
</head>
<body style="background:darkgrey">
<div class="mainContent" id="mainContent">
    <div class="logo" id="logo">
        RubiZockt
    </div>
<!--<img src="img/header_raw.png" id="imgHead" name="imgHead" width="100%" style="margin-bottom: 0px;">-->
    <div class="mobile">Scroll dich hier durch das Menü</div>
    <div class="navbar" id="navbar" name="navbar">
    <a href="index.php">Home</a><br>
    <a href="radio.php"class="specialLink">RubiRadio</a><br>
    <a href="zocken.php">Rubi Zockt</a><br>
    <a href="tcg.php" target="_self">RZ TCG Demokarten</a><br>
    <a href="https://github.com/rubirubsen" target="_blank">GitHub</a><br>
    <a href="tcgfolder.php" target="_self" class="hideMobile">TCG Album(in progress)</a><br>
    <a href="blog.php" class="hideMobile">Rubi Bloggt</a><br>
    <!-- <a href="server.php">Rubis Server</a><br> --->
    <a href="impressum.php" target="_blank">Impressum</a><br>
</div>
    <div id="audioContainer">
        <audio title="RubiRadio" controls="controls" src="https://rubizockt.de/stream" style="background-image:url(/spotify/info/current_image.jpg);background-size: cover;background-position: center;" id="livePlayer"></audio><br><div style="font-size:0.8em" id="currentTrack"><?php echo "Aktueller Titel: ".file_get_contents('./spotify/info/current_artist.txt')." - ".file_get_contents('./spotify/info/current_track.txt'); ?></span>    </div>
        <script>
            // Funktion zum Abrufen und Aktualisieren des Titels
            function updateCurrentTrack() {
                fetch('./spotify/info/current_track.json')
                    .then(response => response.text())
                    .then(data => {
                        trackData = JSON.parse(data).track;
                        console.log(trackData);
                        // Hier den Text im HTML-Element aktualisieren
                        const currentTrackElement = document.getElementById('livePlayer');
                        const trackInformation = document.getElementById('currentTrack');
                        const currentArtist = trackData.artistNames; // Hier den Künstler dynamisch einbinden
                        trackInformation.innerHTML = `Aktueller Titel: ${currentArtist} - ${trackData.trackName}`;
                        currentTrackElement.style.backgroundImage = `url(/spotify/info/current_image.jpg)`;
                    })
                    .catch(error => console.error('Fehler beim Abrufen des Titels:', error));
            }

            // Alle 3 Sekunden die Funktion ausführen
            setInterval(updateCurrentTrack, 3000);
        </script>
    
    <div class="scrollContent" id="scrollContent" name="scrollContent">
