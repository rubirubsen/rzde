<head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="css/spotify.css">
        <title>Overlay</title>
</head>

<body>

</body>
<script>
    function createTrackInfoDiv(artist, title) {
                    // Track-Info Div erstellen
                    const trackInfoDiv = document.createElement('div');
                    trackInfoDiv.id = 'track-info';
                    trackInfoDiv.className = 'track-info';
                    
                    // Track Cover Div erstellen
                    const trackCoverDiv = document.createElement('div');
                    trackCoverDiv.className = 'trackCover';
                    
                    // Top Row Div erstellen
                    const topRowDiv = document.createElement('div');

                    topRowDiv.id = 'topRow';
                    topRowDiv.className = 'topRow';
                    
                    // Künstlername hinzufügen
                    const artistP = document.createElement('p');
                    const artistStrong = document.createElement('strong');
                    artistStrong.textContent = artist;
                    artistP.appendChild(artistStrong);
                    topRowDiv.appendChild(artistP);
                    
                    // Scroller Row Div erstellen
                    const scrollerRowDiv = document.createElement('div');
                    scrollerRowDiv.id = 'scrollerRow';
                    scrollerRowDiv.className = 'scrollerRow';
                    
                    // Titel hinzufügen
                    const titleP = document.createElement('p');
                    titleP.textContent = title;
                    scrollerRowDiv.appendChild(titleP);
                    
                    // Elemente zum Track-Info Div hinzufügen
                    trackInfoDiv.appendChild(trackCoverDiv);
                    trackInfoDiv.appendChild(topRowDiv);
                    trackInfoDiv.appendChild(scrollerRowDiv);
                    
                    // Track-Info Div zum Body hinzufügen
                    document.body.appendChild(trackInfoDiv);
                    
                    return trackInfoDiv;
                }

    function updateTrackInfoDiv(trackInfo) {
        if (!trackInfoDiv) {
            trackInfoDiv = createTrackInfoDiv();
        }

        // Cache-Buster: Aktueller Zeitstempel anhängen, um Caching zu verhindern
        const timestamp = new Date().getTime();
        const backgroundImageUrl = `/spotify/info/current_image.jpg`;

        trackInfoDiv.innerHTML = `
            <p><strong>${trackInfo.artistNames}</strong></p>
            <p class="title-scroller">${trackInfo.trackName}</p>
        `;
        trackInfoDiv.style.backgroundImage = `url("${backgroundImageUrl}")`;
        trackInfoDiv.style.display = 'block';
    }

</script>