<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Befehle und Medien-Vorschau</title>
    <style>
        .loading {
            color: #888;
        }

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
            margin-left:auto;
            margin-right:auto;
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
        #content{
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            grid-template-rows: repeat(5, 1fr);
            grid-column-gap: 0px;
            grid-row-gap: 0px;
            width: 70%;
            margin: auto;
        }
        #videoCommands{
            width: fit-content;
            grid-area: 1 / 1 / 6 / 3;
        }
        
        #audioCommands{
            width: fit-content;
            grid-area: 1 / 3 / 6 / 5;
        }
    </style>
</head>
<body>
    <h1>Befehle und Medien-Vorschau</h1>
    <div id="content">
    <div id="videoCommands">
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

    <div id="audioCommands">
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

    <script>
    function populateMediaTable(mediaType) {
        const tableId = mediaType === 'video' ? 'videoTable' : 'audioTable';
        const tableBody = document.querySelector(`#${tableId} tbody`);
        
        fetch('./datasets/media.json')
            .then(response => response.json())
            .then(data => {
                Object.keys(data).filter(key => data[key].type === mediaType).forEach(key => {
                    const row = document.createElement('tr');
                    const commandCell = document.createElement('td');
                    const previewCell = document.createElement('td');
                    
                    commandCell.textContent = `!${key}`;
                    previewCell.textContent = '...'; // Platzhalter für das Laden
                    previewCell.classList.add('loading'); // Klasse für CSS-Stil

                    row.appendChild(commandCell);
                    row.appendChild(previewCell);
                    tableBody.appendChild(row);

                    // Füge Datenattribute für spätere Verwendung hinzu
                    row.dataset.key = key;
                    row.dataset.type = mediaType;
                    row.dataset.src = data[key].src;
                });
                
                // Set up Intersection Observer for lazy loading
                const observer = new IntersectionObserver(entries => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const row = entry.target;
                            const mediaType = row.dataset.type;
                            const src = row.dataset.src;
                            const previewCell = row.querySelector('td:nth-child(2)');
                            
                            let mediaElement;
                            if (mediaType === 'video') {
                                mediaElement = `<video controls poster="${src.replace('.webm', '_360p.jpg')}" width="320" preload="metadata">
                                    <source src="${src}" type="video/webm">
                                    Dein Browser unterstützt kein WebM.
                                </video>`;
                            } else {
                                mediaElement = `<audio controls preload="metadata">
                                    <source src="${src}" type="audio/mpeg">
                                    Dein Browser unterstützt kein MP3.
                                </audio>`;
                            }

                            previewCell.innerHTML = mediaElement;
                            previewCell.classList.remove('loading'); // Entferne das Lade-Symbol
                            observer.unobserve(row); // Beobachten stoppen
                        }
                    });
                }, {
                    rootMargin: '5px',
                    threshold: 0.3  // Trigger when 10% of the element is visible
                });

                // Observe each row
                document.querySelectorAll(`#${tableId} tbody tr`).forEach(row => {
                    observer.observe(row);
                });
            })
            .catch(error => console.error('Fehler beim Laden der Medien:', error));
    }

    // Populate both video and audio tables
    populateMediaTable('video');
    populateMediaTable('audio');
    </script>
    </div>
</body>
</html>