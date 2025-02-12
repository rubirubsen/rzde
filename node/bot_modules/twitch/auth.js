import dotenv from 'dotenv';
import console2025 from '../logging';

dotenv.config({path: './../../.env'});
let accessToken;

const clientId = process.env.TWITCHAPIUSER; // Dein Twitch Client ID hier
const secret = process.env.TWICHAPISECRET; // Dein Twitch Secret hier
const redirect_uri_env = process.env.TWITCH_REDIRECT_URI; // URL, zu der Twitch nach dem Login zurückkehrt

export const twitchCallback = async function (code, scope, state, req, res) {
    const twitchAuthParams = new URLSearchParams();
    twitchAuthParams.append("client_id", clientId);
    twitchAuthParams.append("client_secret", secret);
    twitchAuthParams.append("code", code);
    twitchAuthParams.append("grant_type", "authorization_code");
    twitchAuthParams.append("redirect_uri", redirect_uri_env);
    callbackState = state;
    axios
        .post("https://id.twitch.tv/oauth2/token", twitchAuthParams)
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
            accessToken = response.data["access_token"]; //OAuth Token
            refreshToken = response.data["refresh_token"];
            expires_in = response.data["expires_in"];
            console.log("Twitch callback received with code:", code);

            startWebSocket();
            setInterval(() => {
                if (expires_in > 0) {
                    expires_in -= 300; // 5 Minuten in Sekunden
                    if (expires_in <= 300) {
                        refreshTokenFunction();
                    }
                }
            }, 300000);
        })
        .catch((error) => {
            console.error(error);
        });
};

export const getBroadcasterUserId = async () => {
    try {
        const response = await axios.get("https://api.twitch.tv/helix/users", {
            headers: {
                "Client-Id": clientId,
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const userId = response.data.data[0].id;
        console2025.log("twitch",`Broadcaster User ID:  ${userId}`, "info");
        return userId;
    } catch (error) {
        console2025.log("twitch",`Fehler beim Abrufen der Benutzer-ID: ${error.message}`, "error");
        return null;
    }
};
