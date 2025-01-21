import crypto from 'crypto';
import dotenv from 'dotenv';
import axios  from 'axios';
import { access } from 'fs';

dotenv.config();

const clientId = process.env.TWITCHAPIUSER; // Dein Twitch Client ID hier
const secret = process.env.TWICHAPISECRET; // Dein Twitch Secret hier
const redirect_uri_env = process.env.TWITCH_REDIRECT_URI; // URL, zu der Twitch nach dem Login zurückkehrt

let accessToken;
let refreshToken;
let expires_in;
let state;
let callbackState;

async function getUserId() {
    try {
        const response = await axios.get('https://api.twitch.tv/helix/users', {
            headers: {
                'Client-Id': clientId,
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        const userId = response.data.data[0].id;
        console.log("User ID:", userId);
        return userId;
    } catch (error) {
        console.error('Fehler beim Abrufen der Benutzer-ID:', error.message);
        return null;
    }
}

export const twitchLogin = function(req, res) {
    const client_id = process.env.TWITCHAPIUSER; // Deine Twitch Client-ID hier
    const redirect_uri = encodeURIComponent(redirect_uri_env); // URL, zu der Twitch nach dem Login zurückkehrt
    const scope = 'channel:manage:broadcast moderator:read:chatters user:read:chat bits:read'; // Beispiel-Scope, passe es nach Bedarf an
    const response_type = 'code'; // Für den Authorization Code Flow
    state = crypto.randomBytes(20).toString('hex'); // Generiere einen zufälligen String für Auth-Zwecke

    const url = `https://id.twitch.tv/oauth2/authorize?response_type=${response_type}&client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}&state=${state}`;
    res.redirect(url);
};

export const twitchCallback = async function(code,scope,state, req, res) {
    const twitchAuthParams = new URLSearchParams();
    twitchAuthParams.append('client_id', clientId);
    twitchAuthParams.append('client_secret', secret);
    twitchAuthParams.append('code', code);
    twitchAuthParams.append('grant_type', 'authorization_code');
    twitchAuthParams.append('redirect_uri', redirect_uri_env);
    callbackState = state;
    axios.post('https://id.twitch.tv/oauth2/token', twitchAuthParams)
    .then((response) => {
        /**
         * {
            access_token: 'l8rm86sy3n3qiue802vhfjawx5ab6a',
            expires_in: 14904,
            refresh_token: 'u0j9j5hvlxuiany1ykelo98rni9kdftarrl88uqerroccqwi4p',
            scope: [ 'channel:manage:broadcast', 'user:read:chat' ],
            token_type: 'bearer'
            }
         */
        // Hier kannst du die Tokens aus der Response weiterverarbeiten
        accessToken = response.data['access_token'];
        refreshToken = response.data['refresh_token'];
        expires_in = response.data['expires_in'];

        setInterval(() => {
            if (expires_in > 0) {
                expires_in -= 300; // 5 Minuten in Sekunden
                if (expires_in <= 300) {
                    refreshTokenFunction();
                }
            }
        }, 300000); 
    }).catch((error) => {
        console.error(error);
    });
};

export async function twitchTokenRefresh() {
    try {
        
        const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: clientId,
                client_secret: secret
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const newAccessToken = response.data.access_token;
        console.log('New Access Token:', newAccessToken);

        // Hier kannst du das neue Token speichern oder verwenden
        return newAccessToken;
    } catch (error) {
        console.error('Error refreshing Twitch token:', error);
        throw error;
    }
}
async function refreshTokenFunction() {
    try {
        const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: clientId,
                client_secret: secret
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        accessToken = response.data.access_token;
        expires_in = response.data.expires_in;
        console.log('New Access Token:', accessToken);

        // Hier kannst du das neue Token speichern oder verwenden
    } catch (error) {
        console.error('Error refreshing Twitch token:', error);
        throw error;
    }
}
    // Funktion zum Abrufen der Kanalinfos
export async function getChannelInfo(user) {
    
    const token = accessToken
    
    const url = `https://api.twitch.tv/helix/streams?user_login=${user}`;
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Client-Id': clientId // Ersetze durch deinen Client ID
    };

    const response = await fetch(url, { headers });
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
        const streamInfo = data.data[0];
        const category = streamInfo.game_name; // Die Kategorie des aktuellen Streams
        const channelUrl = `https://www.twitch.tv/${user}`; // Kanal-URL
        
        return { channelUrl, category };

    } else {

        return null; // Falls der Stream offline ist

    }
}

export async function getViewerCount() {
    const userId = await getUserId();
    if (!userId) return 0;

    try {
        const response = await axios.get(
            `https://api.twitch.tv/helix/chat/chatters?broadcaster_id=${userId}&moderator_id=${userId}`,
            {
                headers: {
                    'Client-Id': clientId,
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );
        console.log(response.data);
        return response.data.data.length; // Die Anzahl der Chat-Teilnehmer
    } catch (error) {
        console.error('Fehler beim Abrufen der Zuschaueranzahl:', error.message);
        return 0; // Fallback bei Fehler
    }
}

// Funktion zum Abrufen des Follow-Datums von Twitch
export const getFollowDate = async function(clientId, accessToken, fromId) {
    console.log('User requested Follow-Age: ', fromId);
    const url = `https://api.twitch.tv/helix/users/follows?from_id=${fromId}&to_id=27766960`;
    // TODO: to_id dynamisieren!
    const headers = new Headers();
    headers.append('Client-ID', clientId);
    headers.append('Authorization', `Bearer ${accessToken}`);

    const requestOptions = {
        method: 'GET',
        headers: headers,
    };

    return fetch(url, requestOptions)
        .then(response => response.json())
        .then(data => {
            console.log('DATA: ', data);
            const followDate = data[0].followed_at;
            return { followDate };
        });
}

// Funktion zum Abrufen eines Twitch Bearer Tokens
export const getTwitchBearerToken = async function(username,clientId,clientSecret) {
    clientId = clientId
    clientSecret = clientSecret
    try {
        const response = await fetch('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'client_credentials',
            }),
        });

        const data = await response.json();
        const bearerToken = data.access_token;
        return { username, bearerToken };
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

// CURL Methoden für Slash-Commands [TWITCH] 
export function twitchWhisper(){
    let streamerID = '';
    let userID = '';
    let whisperMessage = '';

    const url = `https://api.twitch.tv/helix/whispers?from_user_id=${streamerID}&to_user_id=${userID}?message=${whisperMessage}`;

    const options = {
    method: 'POST',
    'Authorization': `Bearer ${token}`,
    'Client-Id': `${clientId}`,
    'Content-Type': 'application/x-www-form-urlencoded',
};

let data = `{"message":"${whiserMessage}"}`;

let result = '';

const req = http.request(url, options, (res) => {
    console.log(res.statusCode);

    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        result += chunk;
    });

    res.on('end', () => {
        console.log(result);
    });
});

req.on('error', (e) => {
    console.error(e);
});

req.write(data);
req.end();
}

// Funktion zum Abrufen von Benutzerinformationen von Twitch
export const getUserInfo = function(clientId, accessToken, userLogin) {
    const url = `/helix/channels/followers?broadcaster_id=27766960`;

    const headers = new Headers();
    headers.append('Client-ID', clientId);
    headers.append('Authorization', `Bearer ${accessToken}`);

    const requestOptions = {
        method: 'GET',
        headers: headers,
    };
    return fetch(url, requestOptions)
        .then(response => response.json())
        .then(data => {
            const creationDate = data.data[0].created_at;
            const userId = data.data[0].id;
            return { clientId, accessToken, userId, userLogin, creationDate };
        });
}

export async function setGame(gameName) {
    try {
        // Spiel-ID holen
        const response = await fetch(`https://api.twitch.tv/helix/games?name=${gameName}`, {
            headers: {
                'Client-ID': clientId,
                'Authorization': `Bearer ${accessToken}`,
            }
        });
        
        const data = await response.json();

        if (data && data.data && data.data.length > 0) {
        
            const gameId = data.data[0].id;  // Hole die Spiel-ID

            // Setze das Spiel über die Twitch-API
            const apiUrl = `https://api.twitch.tv/helix/channels?broadcaster_id=${clientId}`;
            
            const patchResponse = await fetch(apiUrl, {
                method: 'PATCH',
                headers: {
                    'Client-ID': clientId,
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    game_id: gameId  // Setze das Spiel mit der ID
                })
            });

            const patchData = await patchResponse.json();
            
            if (patchData.error) {
                console.log('Fehler:', patchData.error);
                return { 'msg': 'false', 'error': patchData.error };
            } else {
                console.log(`Das Spiel wurde auf "${gameName}" gesetzt.`);
                return { 'msg': 'true' };
            }

        } else {
            return { 'msg': 'notfound' };
        }
    } catch (error) {
        console.error('Fehler beim Abrufen der Spiel-ID:', error);
        return { 'msg': 'false', 'error': error };
    }
}
