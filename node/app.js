import dotenv from 'dotenv';
import WebSocket from 'ws';
import tmi from 'tmi.js';
import Poker from './bot_modules/poker.js';
import * as helper from './bot_modules/helper.js';
import * as twitch from './bot_modules/twitch.js';
import * as spotify from './bot_modules/spotify.js';
import https from 'https';
import http from 'http';
import fs from 'fs';
import sql from 'mssql';

dotenv.config();

let aktiveAnmeldungen = new Map();
let pokerEndTime = Date.now();
let socketClient;
let activeWsClients = [];


/** Express für API **/
const express = (await import('express')).default;
const app = express();
const port = 3000;

const overlayAuth = process.env.OVERLAY_SECRET;
const authConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_SECRET,
    server: 'rubizockt.de',
    database: process.env.DB_NAME,
    options: {
        encrypt: true, // For Azure SQL Database
        trustServerCertificate: true // Change to false for production
    }
};
// Middleware zum Parsen von JSON-Daten
app.use(express.json());

// Middleware zum Parsen von URL-kodierten Formulardaten
app.use(express.urlencoded({ extended: true }));

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


const videoCommands = {
    '!15000volt': '15000volt',
    '!1700mark': '1700mark',
    '!2000later': '2000later',
    '!antworten': 'antworten',
    '!archbtw': 'archbtw',
    '!atemlos': 'breathtaking',
    '!bathroom': 'bathroom',
    '!binichdabei': 'binichdabei',
    '!bluescreen': 'bluescreen',
    '!boom': 'boom',
    '!camping': 'camper',
    '!cat': 'cat',
    '!chicks': 'chicks',
    '!cringe': 'cringe',
    '!crowdstrike': 'crowdstrike',
    '!dds': 'dds',
    '!diegrünen': 'diegrünen',
    '!disconnect': 'disconnect',
    '!drei': 'drei',
    '!eier': 'eier',
    '!ente': 'ente',
    '!eww': 'eww',
    '!fax': 'fax',
    '!feuer': 'fire',
    '!freshavocado': 'freshavocado',
    '!gefahr': 'gefahr',
    '!geringverdiener': 'geringverdiener',
    '!goat': 'goat',
    '!groovy': 'groovy',
    '!hahaschwanz': 'hahaschwanz',
    '!hase': 'hase',
    '!highscore': 'highscore',
    '!isso': 'isso',
    '!kristellmett': 'kristellmett',
    '!keininstrument': 'keininstrument',
    '!lametta': 'lametta',
    '!later': 'later',
    '!macke': 'macke',
    '!megalangweilig': 'megalangweilig',
    '!megaboom': 'megaboom',
    '!megaburp': 'megaburp',
    '!mindblown': 'mindblown',
    '!nachhause': 'nachhause',
    '!ninja': 'ninja',
    '!nice': 'nice',
    '!nein': 'nein',
    '!noo' : 'noo',
    '!ohgott': 'ohgott',
    '!ok': 'ok',
    '!ouha': 'ouha',
    '!plan': 'plan',
    '!pikatwerk': 'pikatwerk',
    '!preis': 'preis',
    '!radar': 'radar',
    '!rage': 'rage',
    '!ratedw': 'ratedw',
    '!schabernack': 'schabernack',
    '!sheeshdigga': 'sheeshdigga',
    '!sheeshmittwoch': 'sheeshmittwoch',
    '!smash': 'smash',
    '!stop': 'stop',
    '!sos': 'sos',
    '!stimm': 'stimm',
    '!stimme': 'stimme',
    '!sun': 'sun',
    '!super': 'super',
    '!tastadatur': 'tastadatur',
    '!tastethesun': 'tastethesun',
    '!technikstreams': 'technikstreams',
    '!tos': 'tos',
    '!unverzueglich': 'unverzueglich',
    '!verwaehlung': 'verwaehlung',
    '!verwaltung': 'verwaltung',
    '!wasted': 'wasted',
    '!what': 'what',
    '!why': 'why',
    '!windofs': 'windofs',
    '!wissen': 'wissen',
    '!wtf': 'wtf',
    '!xbox': 'xbox'
};

const audioCommands = {
    '!200puls':"200puls",
    '!achtung':"achtung",
    '!ahshit':"ahshit",
    '!alarm':"alarm",
    '!alexa':"alexa",
    '!amrad':"amrad",
    '!arrogant':"arrogant",
    '!babam':"babam",
    '!baeh':"baeh",
    '!banned':"banned",
    '!beckenrand':"beckenrand",
    '!belastend':"belastend",
    '!berndruhe':"berndruhe",
    '!biele':"biele",
    '!bleibtso':"bleibtso",
    '!bloed':"bloed",
    '!bluetooth':"bluetooth",
    '!bock':"bock",
    '!bombe':"bombe",
    '!bonk':"bonk",
    '!burp':"burp",
    '!bzzt':"bzzt",
    '!chirp':"chirp",
    '!cmake':"cmake",
    '!coin':"coin",
    '!cookie':"cookie",
    '!cyberbacher':"cyberbacher",
    '!dasistgeil':"dasistgeil",
    '!dc':"dc",
    '!dergeht':"dergeht",
    '!deutlich':"deutlich",
    '!diagnose':"diagnose",
    '!dickmove':"dickmove",
    '!dingdong':"dingdong",
    '!dogshit':"dogshit",
    '!drogenfahndung':"drogenfahndung",
    '!dumm':"dumm",
    '!dusollstatmen':"dusollstatmen",
    '!eeeeeee':"eeeeee",
    '!eigenleben':"eigenleben",
    '!erdbeerkäse':"erdbeerkäse",
    '!erika':"erika",
    '!eyey':"eyey",
    '!fail':"fail",
    '!falscheentscheidung':"falscheentscheidung",
    '!fart':"fart",
    '!fbi':"fbi",
    '!fettbemmen':"fettbemmen",
    '!fetzig':"fetzig",
    '!fia':"fia",
    '!fickerberg':"fickerberg",
    '!gefallen':"gefallen",
    '!gege':"gege",
    '!geier':"geier",
    '!gewitter':"gewitter",
    '!gibsmir':"gibsmir",
    '!gigi':"gigi",
    '!gurke':"gurke",
    '!hallo':"hallo",
    '!happybirthday':"happybirthday",
    '!heim':"heim",
    '!heiss':"heiss",
    '!hellodaddy':"hellodaddy",
    '!heulleise':"heulleise",
    '!hilfe':"hilfe",
    '!hodensack':"hodensack",
    '!horn':"horn",
    '!howdareyou':"howdareyou",
    '!hunger':"hunger",
    '!hurz':"hurz",
    '!ichbinreich':"ichbinreich",
    '!icq':"icq",
    '!immerdiesegurken':"immerdiesegurken",
    '!indertat':"indertat",
    '!internet':"internet",
    '!irre':"irre",
    '!javapeek':"javapeek",
    '!jfpeek':"jfpeek",
    '!jo':"jo",
    '!kabelmaus':"kabelmaus",
    '!kaching':"kaching",
    '!kacken':"kacken",
    '!kaiuwe':"kaiuwe",
    '!kammamamachen':"kammamamachen",
    '!kassette':"kassette",
    '!klapse':"klapse",
    '!knock':"knock",
    '!komisch':"komisch",
    '!kranplätze':"kranplätze",
    '!langweilig':"langweilig",
    '!leviosa':"leviosa",
    '!lieferung':"lieferung",
    '!life':"life",
    '!listen':"listen",
    '!luegen':"lügen",
    '!machhinne':"machhinne",
    '!miez':"miez",
    '!miregal':"miregal",
    '!mlem':"mlem",
    '!muhaha':"muhaha",
    '!mussraus':"mussraus",
    '!mypenis':"mypenis",
    '!natuerlich':"natuerlich",
    '!nebenrisiken':"nebenrisiken",
    '!neee':"neee",
    '!nerf':"nerf",
    '!newdevice':"newdevice",
    '!nichtlesen':"nichtlesen",
    '!nom':"nom",
    '!numpad':"numpad",
    '!okgurke':"okgurke",
    '!onoff':"onoff",
    '!ostdeutsch':"ostdeutsch",
    '!over9000':"over9000",
    '!ovpn':"ovpn",
    '!pain':"pain",
    '!penisistpenis':"penisistpenis",
    '!pfu':"pfu",
    '!ping':"ping",
    '!powerlevel':"powerlevel",
    '!prickelnd':"prickelnd",
    '!prima':"prima",
    '!prost':"prost",
    '!pun':"pun",
    '!purge':"purge",
    '!quack':"quack",
    '!quak':"quak",
    '!regal':"regal",
    '!russencyber':"russencyber",
    '!rustikal':"rustikal",
    '!sabbelnich':"sabbelnich",
    '!samen':"samen",
    '!schaffen':"schaffen",
    '!scheissding':"scheissding",
    '!scheissemitscheisse':"scheissemitscheisse",
    '!schienenersatzverkehr':"schienenersatzverkehr",
    '!schlag':"schlag",
    '!shame':"shame",
    '!shutdown':"shutdown",
    '!shutup':"shutup",
    '!sketchyshit':"sketchyshit",
    '!sleepmode':"sleepmode",
    '!startup':"startup",
    '!subbomb':"subbomb",
    '!superhot':"superhot",
    '!sus':"sus",
    '!svpn':"svpn",
    '!teams':"teams",
    '!telegram':"telegram",
    '!theone':"theone",
    '!tief':"tief",
    '!toasty':"toasty",
    '!tolleswort':"tolleswort",
    '!tralala':"tralala",
    '!trinken':"trinken",
    '!uhtini':"uhtini",
    '!usb':"usb",
    '!uwop':"uwop",
    '!viecher':"viecher",
    '!visca':"visca",
    '!voicejoin':"voicejoin",
    '!vorwärts':"vorwärts",
    '!vpn':"vpn",
    '!wakeup':"wakeup",
    '!waruumääh':"waruumääh",
    '!washierlos':"washierlos",
    '!wasmachen':"wasmachen",
    '!water':"water",
    '!waweb':"waweb",
    '!wetfart':"wetfart",
    '!whip':"whip",
    '!willnichtmehr':"willnichtmehr",
    '!winamp':"winamp",
    '!wow':"wow",
    '!wvpn':"wvpn",
    '!wwm':"wwm",
    '!yay':"yay",
    '!zerstörer':"zerstörer",
    '!zombie':"zombie",
    '!zweischoppe':"zweischoppe",
    '!zonk':"zonk"
};

const videoTrigger = {
    'KEKW': 'vid_kekw',
    'Kappa' : 'kappa',
    'LUL' : 'lol',
    'LOL' : 'lol',
    'lol' : 'lol',
    'SeemsGood' : 'noice',
    'nice': 'noice',
    'rubizo420' : 'vid_420'
};

const emoteTrigger = {
    'rubizoDancer' : 'rubizodancer',
    'KEKW':'emo_kekw',
    'rubizo420' : 'emo_rubizo420',
}

const client = new tmi.client(twitchConfig);
const httpsServer = https.createServer(options, app);
const wss = new WebSocket.Server({ server: httpsServer });



function sendAll (message) {
    for (var i=0; i<activeWsClients.length; i++) {
        activeWsClients[i].send(JSON.stringify(message));
    }
}

wss.on('connection', function connection(ws, req) {
    socketClient = ws;
    const parameters = new URL(req.url, `http://${req.headers.host}`);
    const uid = parameters.searchParams.get('uid');
    if (uid == process.env.OVERLAY_SECRET) {
        console.log(`[WS] Verbunden mit Rubi`);
    } else {
        ws.close();
    }

    activeWsClients.push(socketClient);
    

    ws.on('close', () => {
        console.log(`+++ WSS CLOSED +++`);
        console.log('WebSocket-Verbindung geschlossen');
        activeWsClients = activeWsClients.filter(client => client !== socketClient);
    });
});

/** Routen-Defintionen für Spotify-Auth **/
app.get('/spotify/login', (req, res) => {
    spotify.getAccessToken(req,res)
});

app.get('/spotify/callback', async (req, res) => {
    spotify.callbackProcess(req,res);
});

app.get('/spotify/info/track', async(req, res) => {
    try {
        const trackFilePath = '/app/views/spotify/info/current_track.txt';
        const artistFilePath = '/app/views/spotify/info/current_artist.txt';
        const jsonFilePath = '/app/views/spotify/info/current_track.json';

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
                artistNames: artistNames
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
            res.status(404).json({ error: 'Keine aktuellen Track-Daten verfügbar' });
        }
    } catch (error) {
        console.error('Fehler beim Lesen oder Speichern der Track-Daten:', error);
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

app.get('/', (req, res) => {
    res.send("rzde API - admin@rubizockt.de");
});


/** Twitch - Bot **/
app.get('/twitch/login', async(req,res) => {
    twitch.twitchLogin(twitchConfig,req,res);
});

app.get('/twitch/callback', async(req, res) => {
    console.log(res);
    res.send("Twitch-Login succesfull!")
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
/** OVERLAY - CONTROL */
app.post('/overlay/control/command', (req, res) => {
    const { cmd, message, auth } = req.body;
    const overlayAuth = process.env.OVERLAY_SECRET;
    
    if (auth === overlayAuth) {
        if(socketClient){
            console.log(message);
            sendAll({"cmd":"trigger","triggerName": message });
        } else {
            console.log("No Client");
        }
        res.status(200).send('Command sent');
    } else {
        res.status(403).send('Unauthorized');
    }
});

/** WEBSEITEN - AUTH */
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

client.connect();

client.on('connected', (address, port) => {
    console.log(`Verbunden mit ${address}:${port}`);
});

client.on('chat', async (channel, user, message, self) => {
    if (self) return;
    
    console.log(message);

    if (message.startsWith('!')) {
        let args = message.split(' ');
        const command = args[0];

        if (command === '!songinfo') {
            try {
                let { trackName, artistNames } = await getLastPlayed();
                console.log("title: ", trackName);
                console.log("artist: ", artistNames);
                client.say(channel, `Ihr hört ${trackName} von ${artistNames}.`);
            } catch (error) {
                console.error("Fehler beim Abrufen der Songinformationen:", error);
                client.say(channel, "Es gab ein Problem beim Abrufen der Songinformationen.");
            }
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
            
                trackId = await spotify.addToQueue(trackId);
                console.log('TRACKID: ', trackId);

                let track = await spotify.getTrackById(trackId);
                console.log('TRACK-TRACK: ',track);
                client.say(channel, `Ich habe ${track.name} eingefügt in die Warteschlange.`);

            } catch (error) {
                console.error("Fehler beim Abrufen der Songinformationen:");
            }
        }

        if (command === '!demotest') {
            client.say(channel, "Test");
        }

        if (command === '!followage') {
            helper.getTwitchBearerToken(user.username, twitchClient, twitchSecret).then(data => {
                const bearT = data.bearerToken;
                helper.getUserInfo(twitchClient, bearT, data.username).then(userData => {
                    helper.getFollowDate(userData.clientId, userData.accessToken, userData.userId).then(data => {
                        const followedDate = new Date(data.followDate);
                        const formattedDate = followedDate.toLocaleDateString('de-DE');
                        const response = 'Du folgst seit: ' + formattedDate;
                        if(activeWsClients != []){
                            sendAll(response);
                        }
                        client.say(channel, response);
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

            if (pokerSpiel.pokerPlayers.has(user.username)) {
                client.say(channel, 'Du bist bereits angemeldet.');
            } else {
                pokerSpiel.pokerPlayers.add(user.username);
                client.say(channel, `${user.username} hat sich für das Poker-Spiel angemeldet.`);
            }

            pokerEndTime = pokerSpiel.endTime;

            client.say(channel, 'Das Poker-Spiel hat begonnen! Du hast 30 Sekunden Zeit, um dich anzumelden. Benutze !joinpoker um teilzunehmen.');

            let pokerTimer = setInterval(() => {
                const remainingTime = Math.max(0, Math.ceil((pokerEndTime - Date.now()) / 1000));

                if (remainingTime > 0) {
                    client.say(channel, `Noch ${remainingTime} Sekunden, um dich anzumelden! Benutze !joinpoker.`);
                } else {
                    clearInterval(pokerTimer);

                    if (pokerSpiel.pokerPlayers.size < 2) {
                        client.say(channel, 'Die Anmeldefrist ist abgelaufen. Nicht genügend Spieler angemeldet. Das Spiel wird nicht gestartet.');
                        aktiveAnmeldungen.delete(channel);
                    } else {
                        client.say(channel, `Die Anmeldefrist ist abgelaufen. ${pokerSpiel.pokerPlayers.size} Spieler sind angemeldet. Das Spiel wird bald starten.`);
                        aktiveAnmeldungen.delete(channel);
                        pokerSpiel.pokerSpiel(client, channel);
                    }
                }
            }, 15000);
        }

        if (command === '!joinpoker') {
            if (aktiveAnmeldungen.has(channel)) {
                if (aktiveAnmeldungen.get(channel).startTime > aktiveAnmeldungen.get(channel).endTime) {
                    client.say(channel, 'Derzeit gibt es keine offene Lobby. Du kannst nicht beitreten.');
                    return;
                }

                if (aktiveAnmeldungen.get(channel).pokerPlayers.has(user.username)) {
                    client.say(channel, 'Du bist bereits angemeldet.');
                } else {
                    aktiveAnmeldungen.get(channel).pokerPlayers.add(user.username);
                    client.say(channel, `${user.username} hat sich für das Poker-Spiel angemeldet.`);
                }
            }
        }

        if (command === '!leavepoker') {
            if (aktiveAnmeldungen.has(channel)) {
                if (aktiveAnmeldungen.get(channel).pokerPlayers.has(user.username)) {
                    aktiveAnmeldungen.get(channel).pokerPlayers.delete(user.username);
                    client.say(channel, `${user.username} hat das Poker-Spiel verlassen.`);
                } else {
                    client.say(channel, `${user.username} ist nicht für das Poker-Spiel angemeldet.`);
                }
            } else {
                client.say(channel, `${user.username}, aktuell ist keine Partie geplant.`);
            }
        }

        if (command === '!whisperme'){
            client.whisper(user.username, "Na du schelm? Gefaellt dir das?");
        }
        
        if (command === '!refresh_timer'){
            let remainingTimeMs = spotify.getRemainingTime();
            console.log('Remanining Time: '+ remainingTimeMs );
        }
        
        if (command === '!active_cliets'){
            console.log(activeWsClients);
        }

        /** OVERLAY - TRIGGER */
        if (videoCommands[command]) {
            console.log("Trigger erkannt: ", command);
            // Nur den Dateinamen senden
            const videoFile = videoCommands[command];
            if(activeWsClients != [] ){
                sendAll({"cmd":"trigger", "triggerName":videoFile});
            }
        } else if (audioCommands[command]) {
            // Nur den Dateinamen senden
            const audioFile = audioCommands[command];
            if(activeWsClients != [] ){
                sendAll({"cmd":"trigger", "triggerName":audioFile});
            }
        } 
    }

    // Überprüfe, ob die Nachricht einen Trigger als eigenständiges Wort enthält
    const words = message.split(/\s+/);
    
    console.log(words);

    for (const [trigger, keyword] of Object.entries(videoTrigger)) {
        const occurrences = words.filter(word => word === trigger).length;
        if (occurrences > 0) {
            console.log('TRIGGER GEFUNDEN: ', trigger);
            console.log('KEYWORD WIRD GESENDET: ', keyword);
            if(activeWsClients != [] ){
                sendAll({"cmd":"trigger", "triggerName": keyword});
            }; // Beende die Schleife nach dem ersten gefundenen Trigger
        }
    }

    for (const [trigger, keyword] of Object.entries(emoteTrigger)) {
        const occurrences = words.filter(word => word === trigger).length;
        if (occurrences > 0) {
            console.log(`TRIGGER GEFUNDEN: ${trigger} (${occurrences} Mal)`);
            console.log(`KEYWORD WIRD GESENDET: ${keyword} (${occurrences} Mal)`);
            if(activeWsClients != [] ){
                for (let i = 0; i < occurrences; i++) {
                    sendAll({"cmd":"trigger", "triggerName":keyword});
                }
            }
        }
    }
});

httpsServer.listen(port, () => {
    
    setInterval(async () => {
        
        const track = await spotify.getCurrentTrack();
        
        if (track.cmd  == 'notPlaying'){
            
            sendAll(track);

        }else if (track) {
            const currentTrackJson = '/app/views/spotify/info/current_track.json';

            let existingTrack = null;
            
            if (fs.existsSync(currentTrackJson)) {
                existingTrack = JSON.parse(fs.readFileSync(currentTrackJson, 'utf8')).track;

            }
            if (JSON.stringify(existingTrack.trackName) !== JSON.stringify(track.trackName)) {

                sendAll({"cmd":"trackUpdate", "trackInfo": track });
                fs.writeFileSync(currentTrackJson, JSON.stringify({ track: track }));
                console.log(`Aktueller Song aktualisiert: ${JSON.stringify(track)}`);
            } else {
                console.log('Kein neuer Song, keine Aktualisierung notwendig.');
            }
        
        }
    }, 15000); // 15 Sekunden Intervall
    
    console.log(`HTTPS Server läuft auf Port ${port}`);
});