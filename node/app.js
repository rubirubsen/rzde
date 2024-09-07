import dotenv from 'dotenv';
import axios from 'axios';
import bcrypt from 'bcrypt';
import WebSocket from 'ws';
import tmi from 'tmi.js';
import Poker from './bot_modules/poker.js';
import { randomNumber, getUserInfo, getFollowDate, getTwitchBearerToken } from './bot_modules/helper.js';
import * as helper from './bot_modules/helper.js';
import * as twitch from './bot_modules/twitch.js';
import * as spotify from './bot_modules/spotify.js';
import https from 'https';
import http from 'http';
import url from 'url';
import fs from 'fs';
import sql from 'mssql';
import { error } from 'console';

dotenv.config();
 
const authConfig = {
    user: 'sa',
    password: 'K4ff33p0tt.',
    server: 'rubizockt.de',
    database: 'rzde',
    options: {
        encrypt: true, // For Azure SQL Database
        trustServerCertificate: true // Change to false for production
    }
};

/** Express für API **/
const express = (await import('express')).default;
const app = express();
const port = 3000;
const overlayAuth = process.env.OVERLAY_SECRET;

// Middleware zum Parsen von JSON-Daten
app.use(express.json());

// Middleware zum Parsen von URL-kodierten Formulardaten
app.use(express.urlencoded({ extended: true }));

const options = {
    key: fs.readFileSync('./ssl/privkey.pem'),
    cert: fs.readFileSync('./ssl/fullchain.pem')
};

const httpsServer = https.createServer(options, app);

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

const client = new tmi.client(twitchConfig);

const videoCommands = {
    '!15000volt': '15000volt.webm',
    '!1700mark': '1700mark.webm',
    '!2000later': '2000later.webm',
    '!antworten': 'antworten.webm',
    '!archbtw': 'archbtw.webm',
    '!atemlos': 'breathtaking.webm',
    '!bathroom': 'bathroom.webm',
    '!binichdabei': 'binichdabei.webm',
    '!bluescreen': 'bluescreen.webm',
    '!boom': 'boom.webm',
    '!camping': 'camper.webm',
    '!cat': 'cat.webm',
    '!chicks': 'chicks.webm',
    '!cringe': 'cringe.webm',
    '!crowdstrike': 'crowdstrike.webm',
    '!dds': 'dds.webm',
    '!diegrünen': 'diegrünen.webm',
    '!disconnect': 'disconnect.webm',
    '!drei': 'drei.webm',
    '!eier': 'eier.webm',
    '!ente': 'ente.webm',
    '!fax': 'fax.webm',
    '!feuer': 'fire.webm',
    '!freshavocado': 'freshavocado.webm',
    '!gefahr': 'gefahr.webm',
    '!geringverdiener': 'geringverdiener.webm',
    '!goat': 'goat.webm',
    '!groovy': 'groovy.webm',
    '!hahaschwanz': 'hahaschwanz.webm',
    '!hase': 'hase.webm',
    '!highscore': 'highscore.webm',
    '!isso': 'isso.webm',
    '!kristellmett': 'kristellmett.webm',
    '!keininstrument': 'keininstrument.webm',
    '!lametta': 'lametta.webm',
    '!later': 'later.webm',
    '!macke': 'macke.webm',
    '!megalangweilig': 'megalangweilig.webm',
    '!megaboom': 'megaboom.webm',
    '!megaburp': 'megaburp.webm',
    '!mindblown': 'mindblown.webm',
    '!nachhause': 'nachhause.webm',
    '!ninja': 'ninja.webm',
    '!nice': 'nice.webm',
    '!nein': 'nein.webm',
    '!ohgott': 'ohgott.webm',
    '!ouha': 'ouha.webm',
    '!plan': 'plan.webm',
    '!pikatwerk': 'pikatwerk.webm',
    '!preis': 'preis.webm',
    '!radar': 'radar.webm',
    '!rage': 'rage.webm',
    '!ratedw': 'ratedw.webm',
    '!schabernack': 'schabernack.webm',
    '!sheeshdigga': 'sheeshdigga.webm',
    '!sheeshmittwoch': 'sheeshmittwoch.webm',
    '!smash': 'smash.webm',
    '!stop': 'stop.webm',
    '!sos': 'sos.webm',
    '!stimm': 'stimm.webm',
    '!stimme': 'stimme.webm',
    '!sun': 'sun.webm',
    '!super': 'super.webm',
    '!tastadatur': 'tastadatur.webm',
    '!tastethesun': 'tastethesun.webm',
    '!technikstreams': 'technikstreams.webm',
    '!tos': 'tos.webm',
    '!unverzueglich': 'unverzueglich.webm',
    '!verwaehlung': 'verwaehlung.webm',
    '!verwaltung': 'verwaltung.webm',
    '!wasted': 'wasted.webm',
    '!what': 'what.webm',
    '!why': 'why.webm',
    '!windofs': 'windofs.webm',
    '!wissen': 'wissen.webm',
    '!wtf': 'wtf.webm',
    '!xbox': 'xbox.webm'
};

const audioCommands = {
    '!200puls':"200puls.mp3",
    '!achtung':"achtung.mp3",
    '!ahshit':"ahshit.mp3",
    '!alarm':"alarm.mp3",
    '!alexa':"alexa.mp3",
    '!amrad':"amrad.mp3",
    '!arrogant':"arrogant.mp3",
    '!babam':"babam.mp3",
    '!baeh':"baeh.mp3",
    '!banned':"banned.mp3",
    '!beckenrand':"beckenrand.mp3",
    '!belastend':"belastend.mp3",
    '!berndruhe':"berndruhe.mp3",
    '!biele':"biele.mp3",
    '!bleibtso':"bleibtso.mp3",
    '!bloed':"bloed.mp3",
    '!bluetooth':"bluetooth.mp3",
    '!bock':"bock.mp3",
    '!bombe':"bombe.mp3",
    '!bonk':"bonk.mp3",
    '!burp':"burp.mp3",
    '!bzzt':"bzzt.mp3",
    '!chirp':"chirp.mp3",
    '!cmake':"cmake.mp3",
    '!coin':"coin.mp3",
    '!cookie':"cookie.mp3",
    '!cyberbacher':"cyberbacher.mp3",
    '!dasistgeil':"dasistgeil.mp3",
    '!dc':"dc.mp3",
    '!dergeht':"dergeht.mp3",
    '!deutlich':"deutlich.mp3",
    '!diagnose':"diagnose.mp3",
    '!dickmove':"dickmove.mp3",
    '!dingdong':"dingdong.mp3",
    '!dogshit':"dogshit.mp3",
    '!drogenfahndung':"drogenfahndung.mp3",
    '!dumm':"dumm.mp3",
    '!dusollstatmen':"dusollstatmen.mp3",
    '!eeeeeee':"eeeeee.mp3",
    '!eigenleben':"eigenleben.mp3",
    '!erdbeerkäse':"erdbeerkäse.mp3",
    '!erika':"erika.mp3",
    '!eyey':"eyey.mp3",
    '!fail':"fail.mp3",
    '!falscheentscheidung':"falscheentscheidung.mp3",
    '!fart':"fart.mp3",
    '!fbi':"fbi.mp3",
    '!fettbemmen':"fettbemmen.mp3",
    '!fetzig':"fetzig.mp3",
    '!fia':"fia.mp3",
    '!fickerberg':"fickerberg.mp3",
    '!gefallen':"gefallen.mp3",
    '!gege':"gege.mp3",
    '!geier':"geier.mp3",
    '!gewitter':"gewitter.mp3",
    '!gibsmir':"gibsmir.mp3",
    '!gigi':"gigi.mp3",
    '!gurke':"gurke.mp3",
    '!hallo':"hallo.mp3",
    '!happybirthday':"happybirthday.mp3",
    '!heim':"heim.mp3",
    '!heiss':"heiss.mp3",
    '!hellodaddy':"hellodaddy.mp3",
    '!heulleise':"heulleise.mp3",
    '!hilfe':"hilfe.mp3",
    '!hodensack':"hodensack.mp3",
    '!horn':"horn.mp3",
    '!howdareyou':"howdareyou.mp3",
    '!hunger':"hunger.mp3",
    '!hurz':"hurz.mp3",
    '!ichbinreich':"ichbinreich.mp3",
    '!icq':"icq.mp3",
    '!immerdiesegurken':"immerdiesegurken.mp3",
    '!indertat':"indertat.mp3",
    '!internet':"internet.mp3",
    '!irre':"irre.mp3",
    '!javapeek':"javapeek.mp3",
    '!jfpeek':"jfpeek.mp3",
    '!jo':"jo.mp3",
    '!kabelmaus':"kabelmaus.mp3",
    '!kaching':"kaching.mp3",
    '!kacken':"kacken.mp3",
    '!kaiuwe':"kaiuwe.mp3",
    '!kammamamachen':"kammamamachen.mp3",
    '!kassette':"kassette.mp3",
    '!klapse':"klapse.mp3",
    '!knock':"knock.mp3",
    '!komisch':"komisch.mp3",
    '!kranplätze':"kranplätze.mp3",
    '!langweilig':"langweilig.mp3",
    '!leviosa':"leviosa.mp3",
    '!lieferung':"lieferung.mp3",
    '!life':"life.mp3",
    '!listen':"listen.mp3",
    '!lknock':"lknock.mp3",
    '!luegen':"lügen.mp3",
    '!machhinne':"machhinne.mp3",
    '!miez':"miez.mp3",
    '!miregal':"miregal.mp3",
    '!mlem':"mlem.mp3",
    '!muhaha':"muhaha.mp3",
    '!mussraus':"mussraus.mp3",
    '!mypenis':"mypenis.mp3",
    '!natuerlich':"natuerlich.mp3",
    '!nebenrisiken':"nebenrisiken.mp3",
    '!neee':"neee.mp3",
    '!nerf':"nerf.mp3",
    '!newdevice':"newdevice.mp3",
    '!nichtlesen':"nichtlesen.mp3",
    '!nom':"nom.mp3",
    '!numpad':"numpad.mp3",
    '!okgurke':"okgurke.mp3",
    '!onoff':"onoff.mp3",
    '!ostdeutsch':"ostdeutsch.mp3",
    '!over9000':"over9000.mp3",
    '!ovpn':"ovpn.mp3",
    '!pain':"pain.mp3",
    '!penisistpenis':"penisistpenis.mp3",
    '!pfu':"pfu.mp3",
    '!ping':"ping.mp3",
    '!powerlevel':"powerlevel.mp3",
    '!prickelnd':"prickelnd.mp3",
    '!prima':"prima.mp3",
    '!prost':"prost.mp3",
    '!pun':"pun.mp3",
    '!purge':"purge.mp3",
    '!quack':"quack.mp3",
    '!quak':"quak.mp3",
    '!regal':"regal.mp3",
    '!russencyber':"russencyber.mp3",
    '!rustikal':"rustikal.mp3",
    '!sabbelnich':"sabbelnich.mp3",
    '!samen':"samen.mp3",
    '!schaffen':"schaffen.mp3",
    '!scheissding':"scheissding.mp3",
    '!scheissemitscheisse':"scheissemitscheisse.mp3",
    '!schienenersatzverkehr':"schienenersatzverkehr.mp3",
    '!schlag':"schlag.mp3",
    '!shame':"shame.mp3",
    '!shutdown':"shutdown.mp3",
    '!shutup':"shutup.mp3",
    '!sketchyshit':"sketchyshit.mp3",
    '!sleepmode':"sleepmode.mp3",
    '!startup':"startup.mp3",
    '!subbomb':"subbomb.mp3",
    '!superhot':"superhot.mp3",
    '!sus':"sus.mp3",
    '!svpn':"svpn.mp3",
    '!teams':"teams.mp3",
    '!telegram':"telegram.mp3",
    '!theone':"theone.mp3",
    '!tief':"tief.mp3",
    '!toasty':"toasty.mp3",
    '!tolleswort':"tolleswort.mp3",
    '!tralala':"tralala.mp3",
    '!trinken':"trinken.mp3",
    '!uhtini':"uhtini.mp3",
    '!usb':"usb.mp3",
    '!uwop':"uwop.mp3",
    '!viecher':"viecher.mp3",
    '!visca':"visca.mp3",
    '!voicejoin':"voicejoin.mp3",
    '!vorwärts':"vorwärts.mp3",
    '!vpn':"vpn.mp3",
    '!wakeup':"wakeup.mp3",
    '!waruumääh':"waruumääh.mp3",
    '!washierlos':"washierlos.mp3",
    '!wasmachen':"wasmachen.mp3",
    '!water':"water.mp3",
    '!waweb':"waweb.mp3",
    '!wetfart':"wetfart.mp3",
    '!whip':"whip.mp3",
    '!willnichtmehr':"willnichtmehr.mp3",
    '!winamp':"winamp.mp3",
    '!wow':"wow.mp3",
    '!wvpn':"wvpn.mp3",
    '!wwm':"wwm.mp3",
    '!yay':"yay.mp3",
    '!zerstörer':"zerstörer.mp3",
    '!zombie':"zombie.mp3",
    '!zweischoppe':"zweischoppe.mp3",
    '!zonk':"zonk.mp3"
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

let access_token = '';
let refresh_token = '';
let aktiveAnmeldungen = new Map();
let pokerEndTime = Date.now();
let socketClient;
let activeWsClients = [];

/** Websocket für weiterleitung an andere Dienste  **/
const wss = new WebSocket.Server({ server: httpsServer });

function sendAll (message) {
    for (var i=0; i<activeWsClients.length; i++) {
        activeWsClients[i].send(message);
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
app.get('/overlay/control/:command', (req, res) => {
    const { command } = req.params;
    const { code } = req.query;

    if (code === overlayAuth) {
        if(socketClient){
            sendAll(command);
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
            // Nur den Dateinamen senden
            const videoFile = videoCommands[command];
            if(activeWsClients != [] ){
                sendAll(videoFile);
            }
        } else if (audioCommands[command]) {
            // Nur den Dateinamen senden
            const audioFile = audioCommands[command];
            if(activeWsClients != [] ){
                sendAll(audioFile);
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
                sendAll(keyword);
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
                    sendAll(keyword);
                }
            }
        }
    }
});

httpsServer.listen(port, () => {
    
    setInterval(async () => {
        const track = await spotify.getCurrentTrack();
        if (track) {
            const currentTrackJson = '/app/views/spotify/info/current_track.json';
            let existingTrack = null;
            
            if (fs.existsSync(currentTrackJson)) {
                existingTrack = JSON.parse(fs.readFileSync(currentTrackJson, 'utf8')).track;
            }
            
            if (JSON.stringify(existingTrack) !== JSON.stringify(track)) {
                sendAll(`{"cmd":"trackUpdate", "trackInfo": ${JSON.stringify(track)}}`);
                fs.writeFileSync(currentTrackJson, JSON.stringify({ track: track }));
                console.log(`Aktueller Song aktualisiert: ${JSON.stringify(track)}`);
            } else {
                console.log('Kein neuer Song, keine Aktualisierung notwendig.');
            }
        }
    }, 15000); // 15 Sekunden Intervall
    
    console.log(`HTTPS Server läuft auf Port ${port}`);
});