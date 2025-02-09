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
import { JSDOM } from 'jsdom';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';  
import { sql, poolPromise } from './bot_modules/sql.js';
import { TwitchUser } from './bot_modules/user.js';

dotenv.config()

/** Express für API **/
const express = (await import('express')).default;
const app = express();
const port = 3000;
const videoCommands = JSON.parse(fs.readFileSync('./views/datasets/videoCommands.json', 'utf-8'));
const audioCommands = JSON.parse(fs.readFileSync('./views/datasets/audioCommands.json', 'utf-8'));
const videoTrigger = JSON.parse(fs.readFileSync('./views/datasets/videoTrigger.json', 'utf-8'));
const emoteTrigger = JSON.parse(fs.readFileSync('./views/datasets/emoteTrigger.json', 'utf-8'));
const audioTrigger = JSON.parse(fs.readFileSync('./views/datasets/audioTrigger.json', 'utf-8'));

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
const options = {
    key: fs.readFileSync('./ssl/privkey.pem'),
    cert: fs.readFileSync('./ssl/fullchain.pem')
};
const tmiClient = new tmi.client(twitchConfig);
const httpsServer = https.createServer(options, app);
const wss = new WebSocket.Server({server:httpsServer});

let aktiveAnmeldungen = new Map();
let recentlyPlayedTracks;
let pokerEndTime = Date.now();
let socketClient;
let activeWsClients = [];
let blisterCards;
let skipVotes = new Set(); // Speichert User, die abgestimmt haben
let votingActive = false; // Status der Abstimmung
let foundTrigger = null;
let triggerType = null;

const red = '\x1b[31m';
const whiteBgRedText = '\x1b[31m\x1b[47m';
const redBgWhiteText = '\x1b[41m\x1b[37m';
const whiteBgGreenText = '\x1b[32m\x1b[47m'; 
const blueBgWhiteText = '\x1b[44m\x1b[37m';

const reset = '\x1b[0m'; // Zurücksetzen der Formatierung


function checkForTriggers(message, triggerList) {
    return Object.keys(triggerList).find(trigger => 
        message.split(' ').includes(trigger)
    );
}

// Middleware für json und Parsing von Formulardaten
app.use(express.json());

app.use(cors({
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }));
app.use(express.urlencoded({ extended: true })); 

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Promise Rejection:', reason);
});




/** Websocket Logik */
wss.on('connection', function connection(ws, req) {

    const parameters = new URL(req.url, `http://${req.headers.host}`);
    const clientType = parameters.searchParams.get('client_type');  // Holen des client_type-Parameters
    
    const ip = req.socket.remoteAddress;
    
       // Generiere eine eindeutige UUID für jede Verbindung
    const uniqueId = uuidv4();  // Erstelle eine neue UUID

    ws.id = uniqueId;  // Setze die UUID als die eindeutige ID des WebSockets

    // Speichere den clientType in der WebSocket-Instanz oder einer globalen Map
    ws.clientType = clientType;  // Dies hilft, den Client später zu identifizieren

    // Füge die Verbindung zu den aktiven WebSocket-Clients hinzu
    activeWsClients.push({ id: uniqueId, ws, clientType });  // Speichere die UUID und clientType

    console.log(`[WS] Verbunden mit Rubi von IP: ${ip}, Client-Typ: ${clientType}. Damit haben wir ${activeWsClients.length} aktiven WS-Verbindungen.`);
    const connections = activeWsClients.map(client => ({
        id: client.id,
        clientType: client.clientType
      }));
    console.log(`${redBgWhiteText}[WS] Aktive Verbindungen:${reset}`);
    console.log(`${blueBgWhiteText}${JSON.stringify(connections, null, 2)}${reset}`);

    
    
    ws.on('message', function incoming(message) {
        // Überprüfen, ob die empfangene Nachricht ein Buffer ist
        if (Buffer.isBuffer(message)) {
            message = message.toString();  // Buffer in String umwandeln
        }
        
        console.log('Nachricht erhalten:', message);
        
        try {
            // Wenn die Nachricht ein JSON-String mit escaped Anführungszeichen enthält
            let messageData = JSON.parse(message);
            
            // Wenn 'msg' ein verschachteltes JSON ist, dekodiere es
            if (messageData.msg) {
                let innerMessage = messageData.msg;  // Das ist der inner JSON-String
                
                // Entferne die Escape-Zeichen und parse erneut
                innerMessage = JSON.parse(innerMessage);  
                
                console.log('Innere Nachricht:', innerMessage);
            }
        } catch (error) {
            console.error('Fehler beim Parsen der Nachricht:', error);
        }
        
        // Sende die Nachricht zurück an den Server
        ws.send(JSON.stringify({"cmdReceived": true, "msg": message}));
    });

    ws.isAlive = true;
    ws.on('pong', () => ws.isAlive = true);

    ws.on('close', () => {
        console.log(`+++ WSS CLOSED +++`);
        activeWsClients = activeWsClients.filter(client => client.id !== ws.id);
        console.log(`Entfernte CLIENT-ID: ${ws.id}`);
        const connections = activeWsClients.map(client => ({
            id: client.id,
            clientType: client.clientType
          }));
        console.log(`${redBgWhiteText}[WS] Aktive Verbindungen:${reset}`);
        console.log(`${blueBgWhiteText}${JSON.stringify(connections, null, 2)}${reset}`);
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


// Routing

app.get('/', (req, res) => {
    res.send("rzde API - admin@rubizockt.de");
});

app.get('/rss-feed', async (req, res) => {
    try {
        const titles = await helper.getRssFeed();  // Antwort speichern
        if (titles) {
            res.json(titles);  // Titel als Antwort zurückgeben
        } else {
            res.status(404).send('Kein Titel gefunden');
        }
    } catch (error) {
        console.error('Fehler beim Abrufen des RSS-Feeds:', error.message); // Detailierte Fehlernachricht
        res.status(500).send('Fehler beim Abrufen des RSS-Feeds');
    }
});

app.get('/health', async(req,res) => {
    res.status(200).send('ok');
})

/** Routen-Defintionen für SPOTIFY  **/
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

// Routing Twitch 
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
            "callback": "https://rubizockt.de:3000/twitch/callback",
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

/** WEBSEITEN - AUTH - Route */
app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Benutzername und Passwort sind erforderlich.');
    }

    try {
        const result = await poolPromise
        .request()
        .input('username', sql.VarChar, username) // Verhindert SQL-Injection
        .query('SELECT * FROM tblUser WHERE txtUsername = @username');

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
    
    const user = new TwitchUser(tags.username);
    await user.initializeFromDB();

    if (tags.bits) {
        const bits = parseInt(tags.bits);
        if (bits >= 1) {
            const msg = `${tags.username} hat ${bits} Bits gespendet!`;
            console.log('BIIIIIIIIIIIIIIITS: ',msg);
        }
    }
    
    if (message.startsWith('!')) {

        let args = message.split(' ');
        const command = args[0];
        
        let commandCount = await twitch.getCommandCountInDB(command);
        
        commandCount = commandCount + 1;
        
        twitch.updateCommandCountInDB(command, commandCount);

        if (command === '!setVolume') {
            let volumeValue = args[1]; // Holt das Argument, das die Lautstärke angibt
        
            // Überprüfe, ob das Argument eine Zahl ist und zwischen 0 und 100 liegt
            volumeValue = parseInt(volumeValue, 10);
        
            if (isNaN(volumeValue) || volumeValue < 0 || volumeValue > 100) {
                return;
            }
        
            if (tags.username === 'rubizockt') {
                try {
                    await spotify.setVolume(volumeValue);
                } catch (error) {
                }
            } else {
                tmiClient.say(channel, `${tags.username}, das hast Du leider nicht zu entscheiden.`);
            }
        }

        if (command === '!skip') {
            if (tags.username === 'rubizockt') {
                // Admin: Direkt skippen
                try {
                    await spotify.skipTrack();
                } catch (error) {
                    console.log('Fehler beim Skippen:', error);
                }
            } else {
                // Zuschauer-Abstimmung
                if (!votingActive) {
                    votingActive = true;
                    const viewerCount = await twitch.getViewerCount();
                    console.log(viewerCount);
                    const requiredPercentage = helper.getRequiredVotesPercentage(viewerCount);
                    const requiredVotes = Math.ceil(viewerCount * requiredPercentage);
    
                    tmiClient.say(channel, `Abstimmung gestartet! ${requiredVotes} Stimmen benötigt.`);
                    setTimeout(async () => {
                        if (skipVotes.size >= requiredVotes) {
                            tmiClient.say(channel, 'Genügend Stimmen! Song wird übersprungen...');
                            try {
                                await spotify.skipTrack();
                            } catch (error) {
                                console.log('Fehler beim Skippen:', error);
                            }
                        } else {
                            tmiClient.say(
                                channel,
                                `Abstimmung fehlgeschlagen: Nur ${skipVotes.size} von ${requiredVotes} Stimmen.`
                            );
                        }
                        skipVotes.clear();
                        votingActive = false;
                    }, 10000); // 10 Sekunden warten
                }
    
                if (!skipVotes.has(tags.username)) {
                    skipVotes.add(tags.username);
                    tmiClient.say(
                        channel,
                        `${tags.username} hat abgestimmt! (${skipVotes.size} Stimmen)`
                    );
                } else {
                    tmiClient.say(
                        channel,
                        `${tags.username} hat bereits abgestimmt.`
                    );
                }
            }
        }

        if (command === '!pause'){
            if(tags.username === 'rubizockt'){
                try {
                    await spotify.stopTrack();
                    
                }catch (error) {
                    console.log('Fehler beim Stoppen:', error);
                }
             }
        }

        if (command === '!play'){
            if(tags.username === 'rubizockt'){
                try {
                    await spotify.startPlaying();
                    
                }catch (error) {
                    console.log('Fehler beim Abspielen:', error);
                } 
             }
        }

        if (command === '!songinfo') {

            try {
                let { trackName, artistNames } = await spotify.getCurrentTrack();
                tmiClient.say(channel, `Ihr hört ${trackName} von ${artistNames}.`);
            } catch (error) {
                console.error("Fehler beim Abrufen der Songinformationen:", error);
                tmiClient.say(channel, "Es gab ein Problem beim Abrufen der Songinformationen.");
            }

        }

        if (command === '!lastplayed'){
            let username = tags.username;
            tmiClient.say(channel, `${username}, die letzten 50 Tracks der bisher gehörten Songs findest du hier: https://rubizockt.de/spotify/playlist/last-played`);
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
                const user = new TwitchUser(tags.username);
                
                await user.initializeFromDB();

                if (user.displayName === user.username) {
                    console.log(`Benutzer ${user.username} nicht gefunden, erstelle ihn in der DB...`);
                    await user.createInDB();  // Erstelle den Benutzer in der DB
                }
                
                user.songRequestCount = user.songRequestCount + 1;
                await user.updateSongRequestCountInDB();
                const songRequestCount = user.songRequestCount;  // Hol dir die Songrequest-Anzahl

                trackId = await spotify.addToQueue(trackId);
                let track = await spotify.getTrackById(trackId);
                tmiClient.say(channel, `Ich habe ${track.name}  eingefügt in die Warteschlange. ${user.displayName} hat schon ${songRequestCount} Songs eingefügt`);	
                
            } catch (error) {
                console.error("Fehler beim Abrufen der Songinformationen:",error);
            }
        }

        if (command === '!so') {

            let twitchUser = args.slice(1).join(' ');

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
            twitch.getTwitchBearerToken(tags.username, twitchClient, twitchSecret).then(data => {
                const bearT = data.bearerToken;
                twitch.getUserInfo(twitchClient, bearT, data.username).then(userData => {
                    twitch.getFollowDate(userData.clientId, userData.accessToken, userData.userId).then(data => {
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

        if (command === '!news') {

            tmiClient.say(channel, `🧐 Moment mal, ich checke, was es Neues gibt! 📰`);      
            helper.sendAll(activeWsClients, { "cmd": "trigger", "triggerName": "newsTime"});
            setTimeout(() => {
                tmiClient.say(channel, `🎉 Sollte jetzt jeden Moment zu sehen sein 🚀 Ach ja, die liebe Technik manchmal... Mooment.Kommt.`);
            }, 3000);
        }

        if (command === '!poker') {

            let pokerSpiel = new Poker(channel);
            aktiveAnmeldungen.set(channel, pokerSpiel);

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
        
        if (command === '!activeWsClients'){
            console.log(activeWsClients);
        }

        if (command === '!setgame' && tags.username.toLowerCase() === 'rubizockt') {
            
            
            const gameName = args.slice(1).join(" "); // Das Spiel, das gesetzt werden soll
            let clientId = twitchConfig.identity.username;
        
            try {
                let setGame = await twitch.setGame(gameName);  // Aufruf der asynchronen Funktion
                
                // Überprüfe, ob die Rückgabe erfolgreich war
                if (setGame.msg === 'true') {
                    tmiClient.say(channel, `Spiel: ${gameName} gesetzt.`);
                } else {
                    tmiClient.say(channel, `Spiel: ${gameName} nicht gesetzt. Fehler: ${setGame.error}`);
                }
            } catch (error) {
                console.error('Fehler beim Setzen des Spiels:', error);
                tmiClient.say(channel, 'Es gab einen Fehler beim Setzen des Spiels.');
            }

        } else if (command === '!setgame') {
            // Wenn der Benutzer nicht 'rubizockt' ist
            tmiClient.say(channel, 'Du hast keine Berechtigung, diesen Befehl auszuführen.');
        }

        if (command === '!newsmp3') {
            fetch('https://www.deutschlandfunk.de/nachrichten-100.html')
                .then(response => response.text())  // Hole den HTML-Inhalt der Seite
                .then(html => {
                    // Verwende jsdom, um den HTML-Inhalt zu analysieren
                    const dom = new JSDOM(html);
                    const doc = dom.window.document;
                    
                    // Finde den Button auf der geladenen Seite und hole die URL
                    const audioButton = doc.querySelector('.b-button-play');
                    if (audioButton) {
                        const audioUrl = audioButton.getAttribute('data-audio');
                        tmiClient.say(channel, `Die aktuelle Radiosendung vom Deutschlandfunk hier hören: ${audioUrl}`);
                    } else {
                        tmiClient.say(channel, "Button nicht gefunden auf der Seite!");
                    }
                })
                .catch(error => {
                    tmiClient.say(channel, 'Fehler beim Abrufen der Seite:', error);
                });
        }

        /** OVERLAY - TRIGGER */
        if (videoCommands[command] || audioCommands[command]) {
            
            console.log("Mediatrigger erkannt: ", command);

            const triggerFile = videoCommands[command] || audioCommands[command];
            if (activeWsClients.length > 0) {

                helper.sendAll(activeWsClients, { "cmd": "trigger", "triggerName": triggerFile });

            }
        }

        twitch.updateCommandCountInDB(command, commandCount);
    }

    // Überprüfe, ob die Nachricht einen Trigger als eigenständiges Wort enthält
    foundTrigger = checkForTriggers(message, videoTrigger);
    if (foundTrigger) {
        triggerType = "video";
    }

    // Überprüfe Emote-Trigger, nur wenn kein Video-Trigger gefunden wurde
    if (!foundTrigger) {
        foundTrigger = checkForTriggers(message, emoteTrigger);
        if (foundTrigger) {
            triggerType = "emote";
        }
    }

    // Überprüfe Audio-Trigger, nur wenn weder Video- noch Emote-Trigger gefunden wurden
    if (!foundTrigger) {
        foundTrigger = checkForTriggers(message, audioTrigger);
        if (foundTrigger) {
            triggerType = "audio";
        }
    }

    if (foundTrigger) {
        console.log(`Trigger "${foundTrigger}" vom Typ ${triggerType} erkannt.`);
        
        // Ermitteln des zugehörigen Triggers aus der entsprechenden Liste
        let triggerFile;
        switch (triggerType) {
            case "video":
                triggerFile = videoTrigger[foundTrigger];
                break;
            case "emote":
                triggerFile = emoteTrigger[foundTrigger];
                break;
            case "audio":
                triggerFile = audioTrigger[foundTrigger];
                break;
        }
    
        if (activeWsClients.length > 0) {
            helper.sendAll(activeWsClients, { 
                "cmd": "trigger", 
                "triggerName": triggerFile, 
                "triggerType": triggerType 
            });
        }
    }


    try{
        user.messageCount++;
        await user.updateMessageCountInDB();
    }catch(error){
        console.error(`${redBgWhiteText}Fehler im Chat-Handler: `, error, `${reset}`)
    }
    

});


/*SERVERSTART*/
httpsServer.listen(port, () => {
    
    setInterval(async () => {
        try {
            
            const track = await spotify.getCurrentTrack();
            recentlyPlayedTracks = await spotify.fetchRecentlyPlayedTracks();

            if (track === undefined || track === '') {
                helper.sendAll(activeWsClients, { "cmd": "notPlaying" });
            } else {
            }
    
            if (track && track.cmd === 'notPlaying') {
                helper.sendAll(activeWsClients, track);
            } else if (track !== '') {
                const currentTrackJson = '/app/views/spotify/info/current_track.json';
                try {
                    fs.writeFileSync(currentTrackJson, JSON.stringify({ track: track }, null, 2), 'utf8');
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