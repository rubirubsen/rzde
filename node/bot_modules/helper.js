
import http from 'https';

// Funktion zur Generierung einer Zufallszahl
export const randomNumber = function(maxVal) {
    // Generiere eine zufällige Dezimalzahl zwischen 0 und 1
    const randomDecimal = Math.random();
    // Skaliere die zufällige Dezimalzahl auf den gewünschten Bereich
    const randomInteger = Math.floor(randomDecimal * maxVal) + 1;
    return randomInteger;
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
