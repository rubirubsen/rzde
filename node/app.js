import dotenv from 'dotenv';
import crypto from 'crypto';
import WebSocket from 'ws';
import tmi, { Client } from 'tmi.js';
import Poker from './bot_modules/poker.js';
import * as helper from './bot_modules/helper.js';
import * as twitch from './bot_modules/twitch.js';
import * as spotify from './bot_modules/spotify.js';
import https from 'https';
import http from 'http';
import fs from 'fs';
import sql from 'mssql';

dotenv.config();

/** Express für API **/
const express = (await import('express')).default;
const app = express();
const port = 3000;

const overlayAuth = process.env.OVERLAY_SECRET;
const authConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_SECRET,
    server: process.env.DB_SERVER,
    port: process.env.DB_PORT ||33246,
    database: process.env.DB_NAME,
    options: {
        encrypt: true, // For Azure SQL Database
        trustServerCertificate: true // Change to false for production
    }
};

const options = {
    key: fs.readFileSync('./ssl/privkey.pem'),
    cert: fs.readFileSync('./ssl/fullchain.pem')
};

const twitchConfig = {
    options: {
        debug: true
    },
    connection: {
        reconnect: true
    },
    identity: {
        username: process.env.TWITCHBOTUSER,
        password: process.env.TWITCHBOTSECRET
    },
    channels: ['rubizockt']
};


const videoCommands = JSON.parse(fs.readFileSync('./datasets/videoCommands.json', 'utf-8'));
const audioCommands = JSON.parse(fs.readFileSync('./datasets/audioCommands.json', 'utf-8'));
const videoTrigger = JSON.parse(fs.readFileSync('./datasets/videoTrigger.json', 'utf-8'));
const emoteTrigger = JSON.parse(fs.readFileSync('./datasets/emoteTrigger.json', 'utf-8'));

const tmiClient = new tmi.client(twitchConfig);
const httpsServer = https.createServer(options, app);
const wss = new WebSocket.Server({server:httpsServer});

let aktiveAnmeldungen = new Map();
let pokerEndTime = Date.now();
let socketClient;
let activeWsClients = [];
let blisterCards;
let bohnencounter = 0;

// Middleware zum Parsen von JSON-Daten
app.use(express.json());
// Middleware zum Parsen von URL-kodierten Formulardaten
app.use(express.urlencoded({ extended: true })); 

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Promise Rejection:', reason);
});

let recentlyPlayedTracks = {
    tracks: [], // Array für gespeicherte Tracks
    lastUpdated: null // Optional: Zeitstempel für die letzte Aktualisierung
};

/** Websocket Logik */
wss.on('connection', function connection(ws, req) {
    const parameters = new URL(req.url, `http://${req.headers.host}`);
    const uid = parameters.searchParams.get('uid');
    const clientType = parameters.searchParams.get('client_type');  // Holen des client_type-Parameters
    let hash = '';
    
    const ip = req.socket.remoteAddress;
    
    if (uid === process.env.OVERLAY_SECRET) {
        

        // Hashen der IP-Adresse
        hash = crypto.createHash('sha256').update(ip).digest('hex');
        ws.id = hash;  // Setze die ID auf den Hash der IP-Adresse

        // Speichere den clientType in der WebSocket-Instanz oder einer globalen Map
        ws.clientType = clientType;  // Dies hilft, den Client später zu identifizieren

        activeWsClients.push({ id: hash, ws, clientType });  // Füge auch den clientType in die Datenstruktur ein
        console.log(`[WS] Verbunden mit Rubi von IP: ${ip}, Client-Typ: ${clientType}. Somit haben wir folgende AKTIVEN clients via Websocket: ${activeWsClients}`);

    } else {
        ws.close();
        console.log("Zugriff auf WS geblockt von IP " + ip);
        return;
    }
    
    ws.on('message', function incoming(message) {
        console.log('Nachricht erhalten:', message.toString());
        // Reagiere auf die Nachricht
        ws.send('Antwort vom Server: ' + message);
    });

    ws.isAlive = true;
    ws.on('pong', () => ws.isAlive = true);

    ws.on('close', () => {
        console.log(`+++ WSS CLOSED +++`);
        activeWsClients = activeWsClients.filter(client => client.id !== hash);
    });
});


// Ping-Interval einrichten
const interval = setInterval(() => {
    wss.clients.forEach(client => {
        if (client.isAlive === false) {
            return client.terminate();  // Verbindung wird geschlossen, wenn sie inaktiv ist
        }
        client.isAlive = false;
        client.ping();  // Sende einen Ping
    });
}, 30000);  // Alle 30 Sekunden


/** Standard-Routing */
app.get('/', (req, res) => {
    res.send("rzde API - admin@rubizockt.de");
});

app.get('/health', async(req,res) => {
    res.status(200).send('ok');
})

/** Routen-Defintionen für Spotify-Auth **/
app.get('/spotify/login', (req, res) => {
    spotify.getAccessToken(req,res)
});

app.get('/spotify/callback', async (req, res) => {
    spotify.callbackProcess(req,res);
});

app.get('/spotify/info/track', async (req, res) => {
    try {
        const trackFilePath = '/app/views/spotify/info/current_track.txt';
        const jsonFilePath = '/app/views/spotify/info/current_track.json';

        let trackName = '';

        if (fs.existsSync(trackFilePath)) {
            trackName = fs.readFileSync(trackFilePath, 'utf8').trim();
        }

        if (trackName) {
            const currentTrackData = {
                trackName: trackName
            };

            const jsonData = JSON.stringify(currentTrackData, null, 2);

            fs.writeFileSync(jsonFilePath, jsonData, 'utf8');
            console.log('Aktuelle Track-Daten in JSON-Datei gespeichert');
            res.json(trackName);
        } else {
            res.status(404).json({ error: 'Keine aktuellen Track-Daten verfügbar' });
        }

    } catch (error) {
        console.error('Fehler beim Lesen oder Speichern der Track-Daten:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});

app.get('/spotify/info/artist', async(req, res) => {
    try {
        
        const artistFilePath = '/app/views/spotify/info/current_artist.txt';
        const jsonFilePath = '/app/views/spotify/info/current_track.json';

        
        let artistNames = '';

        if (fs.existsSync(artistFilePath)) {
            artistNames = fs.readFileSync(artistFilePath, 'utf8').trim();
        }

        if (artistNames) {
            const currentTrackData = {
                artistNames: artistNames
            };

            const jsonData = JSON.stringify(currentTrackData, null, 2);
            fs.writeFileSync(jsonFilePath, jsonData, 'utf8');
            console.log('Aktuelle Track-Daten in JSON-Datei gespeichert');
            res.json(artistNames);
        } else {
            res.status(404).json({ error: 'Keine aktuellen Artist-Daten verfügbar' });
        }
    } catch (error) {
        console.error('Fehler beim Lesen oder Speichern der Artist-Daten:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }

});

app.get('/spotify/info/json', async(req, res) => {
    try {
        const trackFilePath = '/app/views/spotify/info/current_track.txt';
        const artistFilePath = '/app/views/spotify/info/current_artist.txt';
        const jsonFilePath = '/app/views/spotify/info/current_track.json';
        const currentImage = '/app/views/spotify/info/current_image.jpg';

        let trackName = '';
        let artistNames = '';

        if (fs.existsSync(trackFilePath)) {
            trackName = fs.readFileSync(trackFilePath, 'utf8').trim();
        }
        if (fs.existsSync(artistFilePath)) {
            artistNames = fs.readFileSync(artistFilePath, 'utf8').trim();
        }

        if (trackName && artistNames) {
            const currentTrackData = {
                trackName: trackName,
                artistNames: artistNames,
                trackImage: currentImage,
            };

            const jsonData = JSON.stringify(currentTrackData, null, 2);
            fs.writeFileSync(jsonFilePath, jsonData, 'utf8');
            console.log('Aktuelle Track-Daten in JSON-Datei gespeichert');
            res.json(currentTrackData);
        } else {
            res.status(404).json({ error: 'Keine aktuellen Track-Daten verfügbar' });
        }
    } catch (error) {
        console.error('Fehler beim Lesen oder Speichern der Track-Daten:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }

});

app.get('/spotify/info/lastPlayed', async (req, res) => {
    try {
        // Wenn die Tracks noch nicht abgerufen wurden, hole sie
        if (spotify.recentlyPlayedTracks.tracks.length === 0) {
            console.log('Tracks werden abgerufen...');
            await spotify.fetchRecentlyPlayedTracks();
        }

        // Hole die gespeicherten Tracks
        const tracks = spotify.getStoredRecentlyPlayedTracks();

        if (!tracks) {
            return res.status(404).json({ message: 'Keine gespeicherten Tracks verfügbar.' });
        }

        // Sende die Tracks als JSON-Antwort zurück
        res.json({
            message: 'Erfolgreich abgerufen',
            lastUpdated: tracks.lastUpdated,
            tracks: tracks.tracks
        });

    } catch (error) {
        console.error('Fehler beim Abrufen der zuletzt gespielten Tracks:', error);
        res.status(500).json({ message: 'Fehler beim Abrufen der Daten', error: error.message });
    }
});



/** Twitch - Bot - Routen **/
app.get('/twitch/login', async(req,res) => {
    twitch.twitchLogin(req,res);
});

app.get('/twitch/callback', async (req, res) => {
    const { code, scope, state } = req.query;
    twitch.twitchCallback(code, scope, state, req, res);
    // Hier kannst du die erhaltenen Parameter weiterverarbeiten

    res.send("Twitch-Login erfolgreich!");
});

app.get('/twitch/subscribe', async(req, res) => {
    const url = 'https://api.twitch.tv/helix/eventsub/subscriptions';

    const options = {
        method: 'POST',
        'Authorization': `Bearer ${twitchSecret}`,
        'Client-Id': twitchClient,
        'Content-Type': 'application/json',
    };

    const data = `{
        "type": "channel.chat.message",
        "version": "1",
        "condition": {
            "broadcaster_user_id": "12826",
            "user_id": "141981764"
        },
        "transport": {
            "method": "websocket",
            "callback": "http://rubizockt.de:3000/twitch/callback",
            "secret": "s3cre7"
        }
    }`;

    let result = '';

    req = http.request(url, options, (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            result += chunk;
        });

        res.on('end', () => {
        
        });
    });

    req.on('error', (e) => {
        console.error(e);
    });

    req.write(data);
    req.end();
});


/** OVERLAY - CONTROL - Route */
app.post('/overlay/control/command', (req, res) => {
    const { cmd, message, auth } = req.body;
    const overlayAuth = process.env.OVERLAY_SECRET;
    
    if (auth === overlayAuth) {
        if(socketClient){
            console.log(message);
        } else {
            console.log("No Client");
        }
        res.status(200).send('Command sent');
    } else {
        res.status(403).send('Unauthorized');
    }
});



/** WEBSEITEN - AUTH - Route */
app.post('/auth/login', async (req, res) => {
    console.log(req.body);
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Benutzername und Passwort sind erforderlich.');
    }

    try {
        await sql.connect(authConfig);
        const result = await sql.query`SELECT * FROM tblUser WHERE txtUsername = ${username}`;

        if (result.recordset.length === 0) {
            return res.status(401).send('Benutzername oder Passwort falsch.');
        }

        const user = result.recordset[0];

        //const isMatch = await bcrypt.compare(password, user.txtPassword); // Angenommen, das Passwort ist in txtPassword gespeichert
        //console.log(isMatch);

        if (password === user.txtPassword) {
            res.status(200).send('{"login":"true"}');
        } else {
            res.status(401).send('Benutzername oder Passwort noch falsch.');
        }
    } catch (err) {
        console.error('Fehler bei der Verbindung zur SQL-Server-Datenbank:', err);
        res.status(500).send('Interner Serverfehler.');
    }
});


/*Twitch-Client*/
tmiClient.connect();

tmiClient.on('connected', (address, port) => {
    console.log(`Verbunden mit ${address}:${port}`);
});

tmiClient.on('chat', async (channel, tags, message, self) => {
    if (self) return;
    
    console.log(tags, message);
    
    if (tags.bits) {
        const bits = parseInt(tags.bits);
        if (bits >= 1) {
            const msg = `${tags.username} hat ${bits} Bits gespendet!`;
            console.log(msg);
        }
    }
    
    if (message.startsWith('!')) {

        let args = message.split(' ');
        const command = args[0];

        if (command === '!songinfo') {

            try {
                let { trackName, artistNames } = await spotify.getCurrentTrack();
                console.log("title: ", trackName);
                console.log("artist: ", artistNames);
                tmiClient.say(channel, `Ihr hört ${trackName} von ${artistNames}.`);
            } catch (error) {
                console.error("Fehler beim Abrufen der Songinformationen:", error);
                tmiClient.say(channel, "Es gab ein Problem beim Abrufen der Songinformationen.");
            }

        }
        if (command === '!lastplayed'){
            let username = tags.username;
            tmiClient.say(channel, `${username}, die komplette Playlist der bisher gehörten Songs findest du hier: https://rubizockt.de:3000/spotify/info/lastPlayed`);
        }
        if (command === '!sr') {

            try{
                let trackId;
                let query = args.slice(1).join(' ');
                console.log("QUERY: ", query);

                if (query.startsWith('http')){
                    
                    console.log("Spotify-URL erkannt", query);    
                    trackId = await spotify.extractTrackIdFromUrl(query);
                    console.log("TRACKID: ", trackId);

                }else{

                    console.log("Spotify-URL nicht erkannt, suche nach Query", query);
                    trackId = await spotify.searchForTrack(query)

                }
            
                
                if (tags.username === 'bohnenkrautsaft'){
                    bohnencounter++;
                    console.log("Bohnenkrautsaft hat heute schon", bohnencounter, "Songs eingefügt");
                    trackId = await spotify.addToQueue(trackId);
                    let track = await spotify.getTrackById(trackId);
                    tmiClient.say(channel, `Ich habe ${track.name}  eingefügt in die Warteschlange. Bohnenkrautsaft hat schon ${bohnencounter} Songs eingefügt`);	
                }else{
                    trackId = await spotify.addToQueue(trackId);
                    console.log('TRACKID: ', trackId);
                    let track = await spotify.getTrackById(trackId);
                    console.log('TRACK-TRACK: ',track);
                    tmiClient.say(channel, `Ich habe ${track.name} eingefügt in die Warteschlange.`);
                }
            } catch (error) {
                console.error("Fehler beim Abrufen der Songinformationen:",error);
            }
        }

        if (command === '!demotest') {
            tmiClient.say(channel, "Test");
        }

        if (command === '!so') {
            
            let twitchUser = args.slice(1).join(' ');
            
            console.log(`SHOUTOUT AN ${twitchUser}`);

            if (!twitchUser) {
                tmiClient.say(channel, "Bitte gib einen Twitch-Nutzernamen an.");
                return;
            }
            
            const channelInfo = await twitch.getChannelInfo(twitchUser);

            if (channelInfo) {
                tmiClient.say(channel, `Shoutout an ${twitchUser}! Schaut vorbei auf: ${channelInfo.channelUrl} | Aktuelle Kategorie: ${channelInfo.category}`);
                tmiClient.say(channel, `/shoutout ${twitchUser}`);

            } else {
                tmiClient.say(channel, `Leider ist ${twitchUser} aktuell offline.`);
            }

        }

        if (command === '!followage') {
            helper.getTwitchBearerToken(tags.username, twitchClient, twitchSecret).then(data => {
                const bearT = data.bearerToken;
                helper.getUserInfo(twitchClient, bearT, data.username).then(userData => {
                    helper.getFollowDate(userData.clientId, userData.accessToken, userData.userId).then(data => {
                        const followedDate = new Date(data.followDate);
                        const formattedDate = followedDate.toLocaleDateString('de-DE');
                        const response = 'Du folgst seit: ' + formattedDate;
                        tmiClient.say(channel, response);
                    });
                });
            }).catch(error => {
                console.error('Fehler:', error);
            });
        }

        if (command === '!poker') {

            let pokerSpiel = new Poker(channel);
            aktiveAnmeldungen.set(channel, pokerSpiel);
            console.log(aktiveAnmeldungen);
            console.log(channel);

            pokerSpiel.pokerPlayers.clear();

            if (pokerSpiel.pokerPlayers.has(tags.username)) {
                tmiClient.say(channel, 'Du bist bereits angemeldet.');
            } else {
                pokerSpiel.pokerPlayers.add(tags.username);
                tmiClient.say(channel, `${tags.username} hat sich für das Poker-Spiel angemeldet.`);
            }

            pokerEndTime = pokerSpiel.endTime;

            tmiClient.say(channel, 'Das Poker-Spiel hat begonnen! Du hast 30 Sekunden Zeit, um dich anzumelden. Benutze !joinpoker um teilzunehmen.');

            let pokerTimer = setInterval(() => {
                const remainingTime = Math.max(0, Math.ceil((pokerEndTime - Date.now()) / 1000));

                if (remainingTime > 0) {
                    tmiClient.say(channel, `Noch ${remainingTime} Sekunden, um dich anzumelden! Benutze !joinpoker.`);
                } else {
                    clearInterval(pokerTimer);

                    if (pokerSpiel.pokerPlayers.size < 2) {
                        tmiClient.say(channel, 'Die Anmeldefrist ist abgelaufen. Nicht genügend Spieler angemeldet. Das Spiel wird nicht gestartet.');
                        aktiveAnmeldungen.delete(channel);
                    } else {
                        tmiClient.say(channel, `Die Anmeldefrist ist abgelaufen. ${pokerSpiel.pokerPlayers.size} Spieler sind angemeldet. Das Spiel wird bald starten.`);
                        aktiveAnmeldungen.delete(channel);
                        pokerSpiel.pokerSpiel(tmiClient, channel);
                    }
                }
            }, 15000);
            
        }

        if (command === '!joinpoker') {
            if (aktiveAnmeldungen.has(channel)) {
                if (aktiveAnmeldungen.get(channel).startTime > aktiveAnmeldungen.get(channel).endTime) {
                    tmiClient.say(channel, 'Derzeit gibt es keine offene Lobby. Du kannst nicht beitreten.');
                    return;
                }

                if (aktiveAnmeldungen.get(channel).pokerPlayers.has(tags.username)) {
                    tmiClient.say(channel, 'Du bist bereits angemeldet.');
                } else {
                    aktiveAnmeldungen.get(channel).pokerPlayers.add(tags.username);
                    tmiClient.say(channel, `${tags.username} hat sich für das Poker-Spiel angemeldet.`);
                }
            }
        }

        if (command === '!leavepoker') {
            if (aktiveAnmeldungen.has(channel)) {
                if (aktiveAnmeldungen.get(channel).pokerPlayers.has(tags.username)) {
                    aktiveAnmeldungen.get(channel).pokerPlayers.delete(tags.username);
                    tmiClient.say(channel, `${tags.username} hat das Poker-Spiel verlassen.`);
                } else {
                    tmiClient.say(channel, `${tags.username} ist nicht für das Poker-Spiel angemeldet.`);
                }
            } else {
                tmiClient.say(channel, `${tags.username}, aktuell ist keine Partie geplant.`);
            }
        }

        if (command === '!whisperme'){
            var fromUserId = tags['user-id'];

            /** curl -X POST 'https://api.twitch.tv/helix/whispers?from_user_id=12826&to_user_id=141981764' \
            *    -H 'Authorization: Bearer ln6n5azzuliqq57gmncybxrno4fy' \
            *   -H 'Client-Id: hof5gwx0su6onys0nyan9c87zr6t'
            *   -d '{"message":"Hello, friend!"}'
            */

            console.log("Da flüstert wer mit mir ...", fromUserId);
            tmiClient.whisper(tags.username, "Na du schelm? Gefaellt dir das?");
        }
        
        if (command === '!refresh_timer'){
            let remainingTimeMs = spotify.getRemainingTime();
            console.log('Remanining Time: '+ remainingTimeMs );
        }
        
        if (command === '!active_cliets'){
            console.log(activeWsClients);
        }
        if (command === '!setgame'){
            
        }
        if (command === '!getBlister'){
            await sql.connect(authConfig);
            const result = await sql.query`SELECT TOP 5 id FROM tbl_cards ORDER BY NEWID()`;
            blisterCards = result.recordset.map(row => row.id);

            console.log('Blister gesetzt');
            if(activeWsClients !=[] ){
                helper.sendAll({"cmd":"alert", "triggerName":"basicBlister", "blisterCards":blisterCards});
            }
        }

        /** OVERLAY - TRIGGER */
        if (videoCommands[command] || audioCommands[command]) {
            console.log("Trigger erkannt: ", command);
            const triggerFile = videoCommands[command] || audioCommands[command];
            if (activeWsClients.length > 0) {
                helper.sendAll(activeWsClients, { "cmd": "trigger", "triggerName": triggerFile });
            }
        }
        
    }

    // Überprüfe, ob die Nachricht einen Trigger als eigenständiges Wort enthält
    if (Object.keys(videoTrigger).some(trigger => message.includes(trigger))) {
        // Ein automatischer Trigger wurde erkannt
        const triggerFile = videoTrigger[message.split(' ').find(word => videoTrigger[word])];
        if (activeWsClients.length > 0) {
            helper.sendAll(activeWsClients, { "cmd": "trigger", "triggerName": triggerFile });
        }
    }
    
});


/*SERVERSTART*/

httpsServer.listen(port, () => {
    
    setInterval(async () => {
        try {
            
            const track = await spotify.getCurrentTrack();
            recentlyPlayedTracks = await spotify.fetchRecentlyPlayedTracks();

            if (track === undefined || track === '') {
                console.log('ERROR: Aktuell keine Songinformationen verfügbar');
                helper.sendAll(activeWsClients, { "cmd": "notPlaying" });
            } else {
                console.log('Spotify-Track-Data: ', track);
            }
    
            if (track && track.cmd === 'notPlaying') {
                console.log(`<app.js 585 Not playing>`);
                helper.sendAll(activeWsClients, track);
            } else if (track !== '') {
                const currentTrackJson = '/app/views/spotify/info/current_track.json';
                try {
                    fs.writeFileSync(currentTrackJson, JSON.stringify({ track: track }, null, 2), 'utf8');
                    console.log(`Track-Daten wurden in ${currentTrackJson} gespeichert.`);
                    helper.sendAll(activeWsClients, {
                        "cmd": "trackUpdate",
                        "data": JSON.stringify({ track: track })
                    });
                } catch (error) {
                    console.error('Fehler beim Schreiben der Datei:', error);
                }
            }
        } catch (error) {
            console.error('Fehler in setInterval:', error);
        }
    }, 15000); // 15 Sekunden Intervall
    
    
});    


