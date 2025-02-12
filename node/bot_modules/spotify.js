import dotenv from 'dotenv';
import axios from 'axios';
import queryString from 'query-string';
import md5 from 'md5';
import fs from 'fs';
import path from 'path';
import console2025 from './logging.js';

dotenv.config();

const sp_client_id = process.env.CLIENTID;
const sp_client_secret = process.env.CLIENTSECRET;
const sp_redirect_uri = 'https://rubizockt.de:3000/spotify/callback';

let songProof = '';
let songProofCounter = 0;
let noPlayCounter = 0;
let refresh_token = '';
let access_token = '';
let start_time = null;
let refreshInMs = 5000;
let refreshTokenTimer = null;

let code = md5('rubizockt'); // TODO: ein Codebegriff in .env einbauen

export let recentlyPlayedTracks = {
    tracks: [], // Array für gespeicherte Tracks
    lastUpdated: null // Optional: Zeitstempel für die letzte Aktualisierung
};

const getTimestamp = () => {
    return new Date().toISOString().replace(/[:.]/g, '-');
};

const generateRandomString = (length) => {
    return crypto
        .randomBytes(60)
        .toString('hex')
        .slice(0, length);
};

var stateKey = 'spotify_auth_state';

const downloadImage = async (url, imagePath) => {
    try {
        // Optional: Vorherige Datei löschen, falls vorhanden
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream'
        });

        response.data.pipe(fs.createWriteStream(imagePath));
    } catch (error) {
        console2025.error('spotify', { message: 'Fehler beim Herunterladen oder Speichern des Bildes', error: error.message });
    }
};

async function getAccessToken(req, res) {
    try {
        const scope = 'user-read-playback-state user-modify-playback-state user-read-recently-played';
        const queryParams = queryString.stringify({
            response_type: 'code',
            client_id: sp_client_id,
            scope: scope,
            redirect_uri: sp_redirect_uri,
            state: code,
        });
        res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
    } catch (error) {
        console2025.error('spotify', { message: 'Fehler bei der Autorisierung der Tokens', error: error.message });
        return null;
    }
}

async function callbackProcess(req, res) {
    const code = req.query.code || null;
    try {
        const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', queryString.stringify({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: sp_redirect_uri,
            client_id: sp_client_id,
            client_secret: sp_client_secret
        }));

        access_token = tokenResponse.data.access_token;
        refresh_token = tokenResponse.data.refresh_token;
        let tokenData = tokenResponse.data;

        console2025.info('spotify', 'Spotify Auth Success!');
        res.send("Auth erfolgreich!");
        scheduleTokenRefresh(tokenData);
        console2025.info('spotify', 'Refresh-Timer gesetzt!');
    } catch (error) {
        console2025.error('spotify', { message: 'Fehler bei der Authentifizierung', error: error.message });
        res.status(500).send('Fehler bei der Authentifizierung');
    }
}

async function fetchRecentlyPlayedTracks() {
    try {
        const response = await axios({
            method: 'get',
            url: 'https://api.spotify.com/v1/me/player/recently-played?limit=50',
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        const items = response.data.items;

        if (items.length === 0) {
            console2025.info('spotify', 'Keine kürzlich gespielten Tracks gefunden.');
            recentlyPlayedTracks.tracks = [];
            return;
        }

        // Verarbeite die Daten und speichere sie im globalen Objekt
        recentlyPlayedTracks.tracks = items.map((item, index) => {
            const track = item.track;

            // UTC-Zeit in lokale Zeit umwandeln
            const playedAt = new Date(item.played_at);
            const localTime = playedAt.toLocaleString('de-DE', {
                timeZone: 'Europe/Berlin',
                hour12: false,
                timeZoneName: 'short'
            });

            return {
                position: items.length - index,
                timePlayed: localTime,
                title: track.name,
                artist: track.artists.map(artist => artist.name).join(", "),
            };
        });

        recentlyPlayedTracks.lastUpdated = new Date().toISOString();
    } catch (error) {
        console2025.error('spotify', { message: 'Fehler beim Abrufen der zuletzt gespielten Tracks', error: error.message });
    }
}

function scheduleTokenRefresh(tokenData) {
    // Überprüfe, ob der refresh_token sich geändert hat
    if (tokenData.refresh_token && refresh_token !== tokenData.refresh_token) {
        refresh_token = tokenData.refresh_token;
    }

    access_token = tokenData.access_token;
    const expiresInMs = tokenData.expires_in * 1000;
    const safetyMargin = 10 * 60 * 1000;
    refreshInMs = Math.max(expiresInMs - safetyMargin, 0);
    start_time = Date.now();

    // Vorherigen Timer löschen, falls vorhanden
    if (refreshTokenTimer) {
        clearTimeout(refreshTokenTimer);
        console2025.warn('spotify', 'Vorheriger Refresh-Token-Timer gelöscht.');
    }

    refreshTokenTimer = setTimeout(async () => {
        try {
            await refreshAccessToken();
        } catch (err) {
            console2025.error('spotify', { message: 'Fehler beim automatischen Erneuern des Tokens', error: err.message });
            // Optional: Wiederholen nach einer Verzögerung, z. B. 30 Sekunden
            setTimeout(() => {
                console2025.info('spotify', 'Neuer Versuch, das Token zu erneuern...');
                refreshAccessToken().catch(error => console2025.error('spotify', { message: 'Fehler beim Wiederholungsversuch', error: error.message }));
            }, 30000); // 30 Sekunden warten
        }
    }, refreshInMs);

    console2025.info('spotify', `Neuer Timer für Token-Refresh gesetzt: ${refreshInMs}ms`);
}

async function refreshAccessToken() {
    const rt = refresh_token;

    // Wenn kein refresh_token vorhanden ist, Fehler behandeln
    if (!rt) {
        console2025.error('spotify', 'Kein gültiger Refresh-Token vorhanden. Authentifizierung ist erforderlich.');
        return;
    }

    const authOptions = {
        method: 'POST',
        url: 'https://accounts.spotify.com/api/token',
        headers: {
            'Authorization': 'Basic ' + Buffer.from(`${sp_client_id}:${sp_client_secret}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: `grant_type=refresh_token&refresh_token=${rt}`
    };

    try {
        console2025.info('spotify', 'Versuche, das Access Token zu erneuern...');
        const response = await axios(authOptions);
        access_token = response.data.access_token;
        console2025.info('spotify', `Neues Access Token erhalten: ${access_token}`);

        // Falls ein neuer Refresh-Token zurückgegeben wird, speichern
        if (response.data.refresh_token) {
            refresh_token = response.data.refresh_token;
            console2025.info('spotify', `Neuer Refresh Token erhalten: ${refresh_token}`);
        } else {
            console2025.warn('spotify', 'Kein neuer Refresh Token zurückgegeben.');
        }

        // Neuen Timer setzen
        scheduleTokenRefresh(response.data);
    } catch (error) {
        console2025.error('spotify', { message: 'Fehler beim Erneuern des Access Tokens', error: error.message });
        return null;
    }
}

// Helper function to check and refresh the access token if necessary
async function ensureAccessToken() {
    const currentTime = Date.now();
    if (currentTime > start_time + refreshInMs) {
        console2025.warn('spotify', 'Access Token abgelaufen oder bald abgelaufen, erneuere es...');
        try {
            await refreshAccessToken();
            console2025.info('spotify', 'Token erneuert.');
        } catch (err) {
            console2025.error('spotify', { message: 'Fehler beim Erneuern des Tokens', error: err.message });
        }
    }
}

async function searchForTrack(query) {
    try {
        const searchString = query;
        console2025.info('spotify', `Suche nach "${searchString}"...`);

        const response = await axios({
            method: 'get',
            url: `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchString)}&type=track,album&market=DE&limit=5&offset=0`,
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });
        console2025.info('spotify', `Suche nach "${searchString}" erfolgreich.`);

        const tracks = response.data.tracks.items;

        console2025.info('spotify', `Es wurden ${tracks.length} Tracks gefunden:`);

        if (tracks.length === 0) {
            console2025.info('spotify', 'Kein Track gefunden');
            return null;
        }
        console2025.log('spotify', tracks[0].name);
        // Returning the first track found
        return tracks[0].id;
    } catch (error) {
        console2025.error('spotify', { message: 'Fehler bei der Spotify-Suche', error: error.message });
        throw error;
    }
}

async function addToQueue(trackId) {
    console2025.info('spotify', `Füge "${trackId}" zur Wiedergabeliste hinzu...`);
    if (!trackId) {
        throw new Error('Keine gültige Track-ID zum Hinzufügen zur Queue');
    }

    try {
        await axios({
            method: 'post',
            url: `https://api.spotify.com/v1/me/player/queue?uri=spotify:track:${trackId}`,
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        console2025.info('spotify', `Track mit ID ${trackId} wurde in die Queue eingetragen`);
        return trackId;
    } catch (error) {
        console2025.error('spotify', { message: 'Fehler beim Hinzufügen des Tracks zur Queue', error: error.message });
        throw error;
    }
}

async function skipTrack() {
    console2025.info('spotify', 'Überspringe den aktuellen Track...');
    try {
        await axios({
            method: 'post',
            url: 'https://api.spotify.com/v1/me/player/next',
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        console2025.info('spotify', 'Track wurde übersprungen');
    } catch (error) {
        console2025.error('spotify', { message: 'Fehler beim Überspringen des Tracks', error: error.message });
        throw error;
    }
}

async function stopTrack() {
    console2025.info('spotify', 'Stoppe die Wiedergabe des aktuellen Tracks...');
    try {
        await axios({
            method: 'put',
            url: 'https://api.spotify.com/v1/me/player/pause',
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        console2025.info('spotify', 'Track wurde gestoppt');
    } catch (error) {
        console2025.error('spotify', { message: 'Fehler beim Stoppen des Tracks', error: error.message });
        throw error;
    }
}

async function startPlaying() {
    console2025.info('spotify', 'Fortsetzen der Wiedergabe...');
    try {
        await axios({
            method: 'put',
            url: 'https://api.spotify.com/v1/me/player/play',
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        console2025.info('spotify', 'Wiedergabe wurde fortgesetzt');
    } catch (error) {
        console2025.error('spotify', { message: 'Fehler beim Fortsetzen der Wiedergabe', error: error.message });
        throw error;
    }
}

async function setVolume(value) {
    if (value < 0 || value > 100) {
        throw new Error('Lautstärkewert muss zwischen 0 und 100 liegen');
    }

    console2025.info('spotify', `Setze die Lautstärke auf ${value}...`);
    try {
        await axios({
            method: 'put',
            url: `https://api.spotify.com/v1/me/player/volume?volume_percent=${value}`,
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        console2025.info('spotify', `Lautstärke wurde auf ${value} gesetzt`);
    } catch (error) {
        console2025.error('spotify', { message: 'Fehler beim Setzen der Lautstärke', error: error.message });
        throw error;
    }
}

function getStoredRecentlyPlayedTracks() {
    if (recentlyPlayedTracks.tracks.length === 0) {
        console2025.info('spotify', 'Keine gespeicherten Tracks verfügbar.');
        return;
    } else {
        return recentlyPlayedTracks;
    }
}

function getRemainingTime() {
    if (!start_time) return 'Timer wurde nicht gestartet';

    const currentTime = Date.now();
    const elapsed = currentTime - start_time;
    const remainingTimeMs = refreshInMs - elapsed;

    if (remainingTimeMs <= 0) return '0 min.';

    const remainingMinutes = Math.floor(remainingTimeMs / (1000 * 60));
    const remainingSeconds = Math.floor((remainingTimeMs % (1000 * 60)) / 1000);

    return `${remainingMinutes} min, ${remainingSeconds} sec`;
}

async function getCurrentTrack() {
    try {
        // Vergewissert sich, dass der Zugriffstoken vorhanden ist
        await ensureAccessToken();

        // Holt die aktuell abgespielte Spur
        const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        const currentlyPlaying = response.data.item;
        const currentlyPlayingStatus = response.data.is_playing;
        let trackInfo;

        if (currentlyPlayingStatus === false || currentlyPlayingStatus === undefined) {
            // Falls nichts gespielt wird
            let cmd = 'notPlaying';
            trackInfo = 'Es wird derzeit nichts abgespielt.';
            if (noPlayCounter < 1) {
                console2025.info('spotify', 'NO PLAYING NOTHING!');
                noPlayCounter++;
            }

            return { cmd, trackInfo };
        } else {
            trackInfo = (({ id, name, title }) => ({ id, name, title }))(currentlyPlaying);
            noPlayCounter = 0;
        }

        const trackName = currentlyPlaying.name;
        const artists = currentlyPlaying.artists;
        const trackImage = `/app/views/spotify/info/current_image.jpg`;
        const artistNames = artists.map(artist => artist.name).join(', ');

        // Überprüfung von songProof
        if (songProof !== '') {
            if (songProof !== trackName) {
                songProof = trackName;

                const albumCover = currentlyPlaying.album.images[0].url;
                const currentTrackFile = '/app/views/spotify/info/current_track.txt';
                const currentArtistFile = '/app/views/spotify/info/current_artist.txt';

                fs.writeFileSync(currentTrackFile, trackName, 'utf8');
                fs.writeFileSync(currentArtistFile, artistNames, 'utf8');
                await downloadImage(albumCover, trackImage);
                songProofCounter = 0;
            } else {
                if (songProofCounter < 1) {
                    console2025.info('spotify', 'Song is the same as proof!');
                    songProofCounter = 1;
                }
            }
        } else {
            console2025.info('spotify', 'No SongProof yet!');
            songProof = trackName;
            const albumCover = currentlyPlaying.album.images[0].url;
            const fullInfo = `${trackName} - ${artistNames}`;
            const fullTrackFile = '/app/views/spotify/info/full_info.txt';
            songProofCounter = 0;
            // Dateien schreiben
            fs.writeFileSync('/app/views/spotify/info/current_track.txt', trackName, 'utf8');
            fs.writeFileSync('/app/views/spotify/info/current_artist.txt', artistNames, 'utf8');
            fs.writeFileSync(fullTrackFile, fullInfo, 'utf8');

            // Bild herunterladen
            await downloadImage(albumCover, trackImage);
        }

        return { trackName, artistNames, trackImage };
    } catch (error) {
        if (error.response && error.response.status === 401) {
            console2025.warn('spotify', 'Access-Token abgelaufen, erneuere das Token...');
            try {
                await refreshAccessToken();
                console2025.info('spotify', 'Token erneuert.');
            } catch (err) {
                console2025.error('spotify', { message: 'Fehler beim Erneuern des Tokens', error: err.message });
            }

            return await getCurrentTrack();
        }
        console2025.error('spotify', { message: 'Fehler beim Abrufen der aktuellen Wiedergabe', error: error.response ? `${error.response.status} - ${error.response.statusText}` : error.message });
        fs.writeFileSync('/app/views/spotify/info/current_track.txt', "Not playing Music", 'utf8');
        fs.writeFileSync('/app/views/spotify/info/current_artist.txt', "!sr for Songrequest", 'utf8');
        return 'Es gab ein Problem beim Abrufen der letzten Wiedergabe.';
    }
}

async function getTrackById(trackId) {
    try {
        const trackData = await axios({
            method: 'get',
            url: `https://api.spotify.com/v1/tracks/${trackId}?market=DE`,
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        return trackData.data; // Nur die Track-Daten zurückgeben
    } catch (error) {
        console2025.error('spotify', { message: 'Fehler beim Abrufen des Tracks', error: error.message });
        throw error; // Fehler weiterwerfen, um ihn im Aufrufer zu behandeln
    }
}

// Funktion zum Parsen der Spotify-URL und Abrufen der Track-ID
function extractTrackIdFromUrl(url) {
    const spotifyUrlPattern = /https?:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\/([a-zA-Z0-9]+)(\?.*)?/;
    const urlMatch = url.match(spotifyUrlPattern);
    return urlMatch ? urlMatch[1] : null;
}

export { addToQueue, callbackProcess, fetchRecentlyPlayedTracks, getStoredRecentlyPlayedTracks, getAccessToken, refreshAccessToken, searchForTrack, getRemainingTime, getCurrentTrack, getTrackById, extractTrackIdFromUrl, skipTrack, stopTrack, startPlaying, setVolume };