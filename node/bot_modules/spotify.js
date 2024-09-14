import dotenv from 'dotenv';
import axios from 'axios';
import queryString from 'query-string';
import md5 from 'md5';
import fs from 'fs';
import path from 'path';

dotenv.config();

const sp_client_id = process.env.CLIENTID;
const sp_client_secret = process.env.CLIENTSECRET;
const sp_redirect_uri = 'https://rubizockt.de:3000/spotify/callback';

let songProof = '';
let refresh_token = '';
let access_token = '';
let start_time = null;
let refreshInMs = 5000;
let refreshTokenTimer = null; 

let code = md5('rubizockt'); //TODO: ein Codebegriff in .env einbauen
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
        console.log(`Bild wurde erfolgreich unter ${imagePath} gespeichert.`);
    } catch (error) {
        console.error('Fehler beim Herunterladen oder Speichern des Bildes:', error);
    }
};

async function getAccessToken(req, res) {
    try {
        const scope = 'user-read-playback-state user-modify-playback-state';
        const queryParams = queryString.stringify({
            response_type: 'code',
            client_id: sp_client_id,
            scope: scope,
            redirect_uri: sp_redirect_uri,
            state: code,
        });
        res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
    } catch (error) {
        console.log('Error authorize tokens:', error);
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

        console.log("Auth erfolgreich!");
        res.send("Auth erfolgreich!");
        scheduleTokenRefresh(tokenData);
        console.log('Refresh-Timer gesetzt!');
    } catch (error) {
        console.error('Fehler bei der Authentifizierung:', error);
        res.status(500).send('Fehler bei der Authentifizierung');
    }
}

function scheduleTokenRefresh(tokenData) {
    // Überprüfe, ob der refresh_token sich geändert hat
    if (tokenData.refresh_token && refresh_token !== tokenData.refresh_token) {
        refresh_token = tokenData.refresh_token;
        console.log('Neuer Refresh Token gespeichert:', refresh_token);
    }

    access_token = tokenData.access_token;  // Access-Token immer aktualisieren
    const expiresInMs = tokenData.expires_in * 1000;
    const safetyMargin = 10 * 60 * 1000; // 10 Minuten Sicherheitsmarge
    refreshInMs = Math.max(expiresInMs - safetyMargin, 0); 
    start_time = Date.now();

    // Vorherigen Timer löschen, falls vorhanden
    if (refreshTokenTimer) {
        clearTimeout(refreshTokenTimer);
        console.log('Vorheriger Refresh-Token-Timer gelöscht.');
    }

    refreshTokenTimer = setTimeout(refreshAccessToken, refreshInMs);
    console.log('Neuer Timer für Token-Refresh gesetzt:', refreshInMs);
}

async function refreshAccessToken() {
    const rt = refresh_token;

    // Wenn kein refresh_token vorhanden ist, Fehler behandeln
    if (!rt) {
        console.error('Kein gültiger Refresh-Token vorhanden. Authentifizierung ist erforderlich.');
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
        console.log('Versuche, das Access Token zu erneuern...');
        const response = await axios(authOptions);
        access_token = response.data.access_token;
        console.log('Neues Access Token erhalten:', access_token);

        // Falls ein neuer Refresh-Token zurückgegeben wird, speichern
        if (response.data.refresh_token) {
            refresh_token = response.data.refresh_token;
            console.log('Neuer Refresh Token erhalten:', refresh_token);
        } else {
            console.log('Kein neuer Refresh Token zurückgegeben.');
        }

        // Neuen Timer setzen
        scheduleTokenRefresh(response.data);
    } catch (error) {
        console.log('Error refreshing access token:', error);
        return null;
    }
}

// Helper function to check and refresh the access token if necessary
async function ensureAccessToken() {
    const currentTime = Date.now();
    if (currentTime > start_time + refreshInMs) {
        console.log("Access Token abgelaufen oder bald abgelaufen, erneuere es...");
        await refreshAccessToken();
    }
}

async function searchForTrack(query) {
    try {
        const searchString = query;
        console.log(`Suche nach "${searchString}"...`);

        const response = await axios({
            method: 'get',
            url: `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchString)}&type=track,album&market=DE&limit=5&offset=0`,
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });
        console.log(`Suche nach "${searchString}" erfolgreich.`);

        const tracks = response.data.tracks.items;

        console.log(`Es wurden ${tracks.length} Tracks gefunden:`);

        if (tracks.length === 0) {
            console.log('Kein Track gefunden');
            return null;
        }
        console.log(tracks[0].name);
        // Returning the first track found
        return tracks[0].id;
    } catch (error) {
        console.error('Fehler bei der Spotify-Suche:', error);
        throw error;
    }
}

async function addToQueue(trackId) { 
    console.log(`Füge "${trackId}" zur Wiedergabeliste hinzu...`);
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

        console.log(`Track mit ID ${trackId} wurde in die Queue eingetragen`);
        return trackId;
        
    } catch (error) {
        console.error('Fehler beim Hinzufügen des Tracks zur Queue:', error);
        throw error;
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
    
    if(songProof != ''){
        
        console.log(songProof);

    }try {    
        await ensureAccessToken();
        const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        const currentlyPlaying = response.data.item;
        
        if (!currentlyPlaying) {
            
            let cmd = 'notPlaying';
            let trackInfo = 'Es wird derzeit nichts abgespielt.';
            console.log('NO PLAYING NOTHING!');
            return {cmd,trackInfo};

        }

        const trackName = currentlyPlaying.name;
        const artists = currentlyPlaying.artists;
        const currentTrackFile = '/app/views/spotify/info/current_track.txt';
        const currentArtistFile = '/app/views/spotify/info/current_artist.txt';
        const trackImage = `/app/views/spotify/info/current_image.jpg`;
        const artistNames = artists.map(artist => artist.name).join(', ');

        if (songProof!= '') {
            if(songProof!= trackName) {

                console.log('Song is not the same as proof!');
                songProof = trackName;
                
                const albumCover = currentlyPlaying.album.images[0].url;
                const artistNames = artists.map(artist => artist.name).join(', ');

                

                fs.writeFileSync(currentTrackFile, trackName, 'utf8');
                fs.writeFileSync(currentArtistFile, artistNames, 'utf8');
                await downloadImage(albumCover, trackImage);

            }else{
                console.log('Song is the same as proof!');
            }

        }else{

            console.log('No SongProof yet!');
            songProof = trackName;
            const artists = currentlyPlaying.artists;
            const albumCover = currentlyPlaying.album.images[0].url;
            
            const currentTrackFile = '/app/views/spotify/info/current_track.txt';
            const currentArtistFile = '/app/views/spotify/info/current_artist.txt';
            const trackImage = `/app/views/spotify/info/current_image.jpg`;

            fs.writeFileSync(currentTrackFile, trackName, 'utf8');
            fs.writeFileSync(currentArtistFile, artistNames, 'utf8');
            await downloadImage(albumCover, trackImage);
        }

        return { trackName, artistNames,trackImage };

    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.log("Access-Token abgelaufen, erneuere das Token...");
            await refreshAccessToken();
            return await getCurrentTrack();
        }
        console.log("ERROR: ", error);
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

        if(trackData){
            console.log("Künstler: ", trackData.data.artists[0].name); // Da ist es klar!
            console.log("Titel: ", trackData.data.name);
        }

        return trackData.data; // Nur die Track-Daten zurückgeben
    } catch (error) {
        console.error('Fehler beim Abrufen des Tracks:', error);
        throw error; // Fehler weiterwerfen, um ihn im Aufrufer zu behandeln
    }
}

// Funktion zum Parsen der Spotify-URL und Abrufen der Track-ID
function extractTrackIdFromUrl(url) {
    const spotifyUrlPattern = /https?:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\/([a-zA-Z0-9]+)(\?.*)?/;
    const urlMatch = url.match(spotifyUrlPattern);
    return urlMatch ? urlMatch[1] : null;
}

export { addToQueue, callbackProcess, getAccessToken, refreshAccessToken, searchForTrack, getRemainingTime, getCurrentTrack, getTrackById, extractTrackIdFromUrl };
