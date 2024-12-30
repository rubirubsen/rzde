<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Befehle und Medien-Vorschau</title>
    <style>
        body{
            background-color: darkgrey;
            font-family: Arial;
            font-weight: bold;
        }
        #main{
            width: 70%;
            margin:auto;
        }
        #videoDiv{
            width: 32em;
            position: absolute;
        }
        #audioDiv{
            margin-left: 33em;
            margin-top: 0em;
            position: absolute;
        }
        table {
            width: 500px;
            border-collapse: collapse;
            margin-bottom: 20px;
            border: 1px black dotted;
            align-self: center;
            border-radius: 15px;
            font-family: Arial;
            font-weight: bold;
            background-color: #ff8000;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f4f4f4;
        }
        video, audio {
            width: 320px;
            height: auto;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <a href="https://rubizockt.de" style="font-size:0.8em;color=red"><== zurück zu rubizockt.de</a>
    <div id="main">
    <h1>Befehle und Medien-Vorschau</h1>
    <p>(falls manche Videos nicht geladen werden F5 drücken, kurz warten und langsam scrollen)</p>
    <div id="videoDiv">
    <!-- Tabelle für Videos -->
    <h2>Video-Befehle</h2>
    <table>
        <thead>
            <tr>
                <th>Befehl</th>
                <th>Vorschau</th>
            </tr>
        </thead>
        <tbody>
            <?php
            // Pfad zum Video-Medienordner
            $videoFolder = __DIR__ . '/media/webm';

            // Prüfen, ob der Ordner existiert
            if (!is_dir($videoFolder)) {
                echo "<tr><td colspan='2'>Video-Medienordner nicht gefunden!</td></tr>";
            } else {
                // Dateien aus dem Ordner laden
                $videoFiles = glob($videoFolder . '/*.webm');

                if (empty($videoFiles)) {
                    echo "<tr><td colspan='2'>Keine Videodateien gefunden!</td></tr>";
                } else {
                    // Tabelle generieren
                    foreach ($videoFiles as $file) {
                        $fileName = basename($file, '.webm'); // Dateiname ohne Erweiterung
                        echo "<tr>";
                        echo "<td>!$fileName</td>";
                        echo "<td><video controls preload='none'>
                                <source src='media/webm/$fileName.webm' type='video/webm'>
                                Dein Browser unterstützt kein WebM.
                              </video></td>";
                        echo "</tr>";
                    }
                }
            }
            ?>
        </tbody>
    </table>
    </div>
    <div id="audioDiv">
    <!-- Tabelle für Audio -->
    <h2>Audio-Befehle</h2>
    <table>
        <thead>
            <tr>
                <th>Befehl</th>
                <th>Vorschau</th>
            </tr>
        </thead>
        <tbody>
            <?php
            // Pfad zum Audio-Medienordner
            $audioFolder = __DIR__ . '/media/mp3';

            // Prüfen, ob der Ordner existiert
            if (!is_dir($audioFolder)) {
                echo "<tr><td colspan='2'>Audio-Medienordner nicht gefunden!</td></tr>";
            } else {
                // Dateien aus dem Ordner laden
                $audioFiles = glob($audioFolder . '/*.mp3');

                if (empty($audioFiles)) {
                    echo "<tr><td colspan='2'>Keine Audiodateien gefunden!</td></tr>";
                } else {
                    // Tabelle generieren
                    foreach ($audioFiles as $file) {
                        $fileName = basename($file, '.mp3'); // Dateiname ohne Erweiterung
                        echo "<tr>";
                        echo "<td>!$fileName</td>";
                        echo "<td><audio controls preload='none'>
                                <source src='media/mp3/$fileName.mp3' type='audio/mpeg'>
                                Dein Browser unterstützt kein MP3.
                              </audio></td>";
                        echo "</tr>";
                    }
                }
            }
            ?>
        </tbody>
    </table>
    </div>
    </div>
    <script>
        const mediaElements = document.querySelectorAll('video, audio');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const media = entry.target;
                    if (media.tagName === 'VIDEO' || media.tagName === 'AUDIO') {
                        media.load();
                        observer.unobserve(media);
                    }
                }
            });
        });

        mediaElements.forEach(el => observer.observe(el));

        console.log("Seite mit Video- und Audio-Tabellen wurde erfolgreich geladen.");
    </script>
</body>
</html>
