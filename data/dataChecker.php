<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Media Checker</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f4f4f4;
        }
        .missing-folder {
            background-color: #ffcccc;
        }
        .missing-json {
            background-color: #ccffcc;
        }
        .loading {
            color: #888;
        }
    </style>
</head>
<body>
    <div id="main">
        <h1>Medien-Vorschau</h1>
        <div id="videoDiv">
            <h2>Video-Befehle</h2>
            <table id="videoTable">
                <thead>
                    <tr>
                        <th>Befehl</th>
                        <th>Vorschau</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
        <div id="audioDiv">
            <h2>Audio-Befehle</h2>
            <table id="audioTable">
                <thead>
                    <tr>
                        <th>Befehl</th>
                        <th>Vorschau</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    </div>
    <script>
        function fetchAndDisplayMedia(folderPath, type, tableID) {
            fetch(folderPath)
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const files = Array.from(doc.querySelectorAll('a')).map(a => a.href.split('/').pop());

                    const filteredFiles = files.filter(file => file.endsWith(type === 'video' ? '.webm' : '.mp3'));
                    const tableBody = document.querySelector(`#${tableID} tbody`);

                    if (filteredFiles.length === 0) {
                        tableBody.innerHTML = `<tr><td colspan="2">Keine ${type === 'video' ? 'Videodateien' : 'Audiodateien'} gefunden!</td></tr>`;
                    } else {
                        filteredFiles.forEach(file => {
                            const fileName = file.split('.')[0];
                            const row = document.createElement('tr');
                            const commandCell = document.createElement('td');
                            const previewCell = document.createElement('td');

                            commandCell.textContent = `!${fileName}`;
                            if (type === 'video') {
                                previewCell.innerHTML = `<video controls preload='none'>
                                    <source src='${folderPath}/${file}' type='video/webm'>
                                    Dein Browser unterstützt kein WebM.
                                </video>`;
                            } else {
                                previewCell.innerHTML = `<audio controls preload='none'>
                                    <source src='${folderPath}/${file}' type='audio/mpeg'>
                                    Dein Browser unterstützt kein MP3.
                                </audio>`;
                            }

                            row.appendChild(commandCell);
                            row.appendChild(previewCell);
                            tableBody.appendChild(row);
                        });
                    }
                })
                .catch(error => console.error('Fehler beim Laden der Dateien:', error));
        }

        // Fetch Videos und MP3s
        fetchAndDisplayMedia('media/webm', 'video', 'videoTable');
        fetchAndDisplayMedia('media/mp3', 'audio', 'audioTable');
    </script>
</body>
</html>