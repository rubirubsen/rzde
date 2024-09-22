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

export const twitchLogin = function(req, res) {
    const client_id = process.env.TWITCHAPIUSER; // Deine Twitch Client-ID hier
    const redirect_uri = encodeURIComponent(redirect_uri_env); // URL, zu der Twitch nach dem Login zurückkehrt
    const scope = 'channel:manage:broadcast user:read:chat'; // Beispiel-Scope, passe es nach Bedarf an
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