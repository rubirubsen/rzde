import crypto from "crypto";
import dotenv from "dotenv";
import WebSocket from "ws";
import axios from "axios";
import { access } from "fs";
import { sql, poolPromise } from "../sql.js";
import console2025 from "../logging.js";

dotenv.config();

const clientId = process.env.TWITCHAPIUSER; // Dein Twitch Client ID hier
const secret = process.env.TWICHAPISECRET; // Dein Twitch Secret hier
const redirect_uri_env = process.env.TWITCH_REDIRECT_URI; // URL, zu der Twitch nach dem Login zurückkehrt


let accessToken;
let refreshToken;
let expires_in;
let state;
let callbackState;
let reconnectDelay = 10000;
let broadcaster_user_id = process.env.TWITCH_BROADCASTER_ID;

async function getBroadcasterUserId() {
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
}

async function refreshTokenFunction() {
    try {
        const response = await axios.post(
            "https://id.twitch.tv/oauth2/token",
            null,
            {
                params: {
                    grant_type: "refresh_token",
                    refresh_token: refreshToken,
                    client_id: clientId,
                    client_secret: secret,
                },
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        accessToken = response.data.access_token;
        expires_in = response.data.expires_in;
        console2025.log("twitch", `New Access Token aquired`);

        // Hier kannst du das neue Token speichern oder verwenden
    } catch (error) {
        console2025.log("twitch", `Error refreshing Twitch token:`, "error");
        throw error;
    }
}

export const twitchLogin = function (req, res) {
    const client_id = process.env.TWITCHAPIUSER; // Deine Twitch Client-ID hier
    const redirect_uri = encodeURIComponent(redirect_uri_env); // URL, zu der Twitch nach dem Login zurückkehrt
    const scope =
        "channel:manage:broadcast moderator:read:chatters user:read:chat bits:read channel:read:redemptions"; // Beispiel-Scope, passe es nach Bedarf an
    const response_type = "code"; // Für den Authorization Code Flow
    state = crypto.randomBytes(20).toString("hex"); // Generiere einen zufälligen String für Auth-Zwecke

    const url = `https://id.twitch.tv/oauth2/authorize?response_type=${response_type}&client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}&state=${state}`;
    res.redirect(url);
};

// EventSub WebSocket-Verbindung
function connectWebSocket() {
    const ws = new WebSocket("wss://eventsub.wss.twitch.tv/ws");

    ws.on("open", () => {
        console2025.log('websocket', "WebSocket verbunden", 'info');
    });

    ws.on("ping", () => {
        console2025.log('websocket','Ping bekommen', 'info');
    });

    ws.on("message", (data) => {
        const message = JSON.parse(data);

        // Überprüfe, ob es sich um die Session-Welcome-Nachricht handelt
        if ( message.metadata && message.metadata.message_type === "session_welcome" ) {

            const sessionId = message.payload.session.id;
            console2025.log('twitch', `Session ID erhalten:  ${sessionId}`, 'info');
            subscribeToEvents(sessionId);

        } else if ( message.metadata && message.metadata.message_type === "notification" ) {
            console2025.log('twitch', JSON.stringify(message), 'log');
            // Falls es sich nicht um die Session-Welcome-Nachricht handelt, handle das Event
            handleEvent(message.payload);
        } else if ( message.metadata && message.metadata.message_type === "session_keepalive" ) {
            console2025.log("twitch","Session Keepalive erhalten","log");
        }
    });

    ws.on("close", (code, reason) => {
        console2025.log('websocket', "WebSocket-Verbindung geschlossen", 'warn');
        console2025.log('websocket', `WebSocket closed with code: ${code} and reason: ${reason}`);
        setTimeout(connectWebSocket, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 60000); // exponentielle Rückverzögerung, max 60 Sekunden
    });

    ws.on("error", (err) => {
        console2025.log('websocket', `WebSocket Fehler: ${JSON.stringify(err)}`, 'error');
    });
}

// Subscription für Events (z. B. für Channel-Punkte-Einlösungen)
async function subscribeToEvents(sessionId) {
    broadcaster_user_id = await getBroadcasterUserId();

    const rewardPayload = {
        type: "channel.channel_points_custom_reward_redemption.add",
        version: "1",
        condition: {
            broadcaster_user_id: broadcaster_user_id,
        },
        transport: {
            method: "websocket",
            session_id: sessionId,
        },
    };

    const streamOnlinePayload = {
        type: "stream.online",
        version: "1",
        condition: {
            broadcaster_user_id: broadcaster_user_id,
        },
        transport: {
            method: "websocket",
            session_id: sessionId,
        },
    };

    const chatPayload = {
        type: "channel.chat.message",
        version: "1",
        condition: {
            broadcaster_user_id: broadcaster_user_id,
            "user_id": "27766960"
        },
        transport: {
            method: "websocket",
            session_id: sessionId,
        },
    };

    const streamOfflinePayload = {
        type: "stream.offline",
        version: "1",
        condition: {
            broadcaster_user_id: broadcaster_user_id,
        },
        transport: {
            method: "websocket",
            session_id: sessionId,
        },
    };

    try {
        // Subscription via REST API statt WebSocket senden
        const rewardPayloadResponse = await axios.post(
            "https://api.twitch.tv/helix/eventsub/subscriptions",
            rewardPayload,
            {
                headers: {
                    "Client-Id": clientId, // Deine Twitch Client-ID hier
                    Authorization: `Bearer ${accessToken}`, // Dein User Access Token hier
                    "Content-Type": "application/json",
                },
            }
        );
        console.log( "Subscription erfolgreich erstellt:", rewardPayloadResponse.data);

        const streamOnlineResponse = await axios.post(
            "https://api.twitch.tv/helix/eventsub/subscriptions",
            streamOnlinePayload,
            {
                headers: {
                    "Client-Id": clientId, // Deine Twitch Client-ID hier
                    Authorization: `Bearer ${accessToken}`, // Dein User Access Token hier
                    "Content-Type": "application/json",
                },
            }
        );
        console.log( "Subscription erfolgreich erstellt:", streamOnlineResponse.data);
        
        const streamOfflineResponse = await axios.post(
            "https://api.twitch.tv/helix/eventsub/subscriptions",
            streamOfflinePayload,
            {
                headers: {
                    "Client-Id": clientId, // Deine Twitch Client-ID hier
                    Authorization: `Bearer ${accessToken}`, // Dein User Access Token hier
                    "Content-Type": "application/json",
                },
            }
        );

        const chatResponse = await axios.post(
            "https://api.twitch.tv/helix/eventsub/subscriptions",
            chatPayload,
            {
                headers: {
                    "Client-Id": clientId, // Deine Twitch Client-ID hier
                    Authorization: `Bearer ${accessToken}`, // Dein User Access Token hier
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("Subscription erfolgreich erstellt:",streamOfflineResponse.data);

    } catch (error) {
        console.error("Fehler beim Erstellen der Subscription:",error.response ? error.response.data : error.message);
    }
}

// Event-Handling (Verarbeiten der empfangenen Twitch-Events)
function handleEvent(eventData) {
    console2025.log("twitch",`Empfangenes Event:  ${eventData}`, "info");
    // Verarbeite das Event
    if (eventData.subscription.type === "channel.channel_points_custom_reward_redemption.add") {
        const redemption = eventData.event;
        console2025.log("twitch", `Punkte eingelöst: ${redemption.reward.title} von ${redemption.user_name}`, "info");
    }
}

// Die WebSocket-Verbindung öffnen und abonnieren
function startWebSocket() {
    if (accessToken) {
        connectWebSocket(); // Nur starten, wenn der Token gesetzt ist
    } else {
        console.log('websocket', "Kein gültiges Access-Token vorhanden", 'error');
    }
}

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

export async function twitchTokenRefresh() {
    try {
        const response = await axios.post(
            "https://id.twitch.tv/oauth2/token",
            null,
            {
                params: {
                    grant_type: "refresh_token",
                    refresh_token: refreshToken,
                    client_id: clientId,
                    client_secret: secret,
                },
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        const newAccessToken = response.data.access_token;
        console2025.log("twitch", `New Access Token aquired,`, "info");

        // Hier kannst du das neue Token speichern oder verwenden
        return newAccessToken;
    } catch (error) {
        console2025.log('twitch', `Error refreshing Twitch token:`, 'error');
        throw error;
    }
}

// Funktion zum Abrufen der Kanalinfos
export async function getChannelInfo(user) {
    const token = accessToken;

    const url = `https://api.twitch.tv/helix/streams?user_login=${user}`;
    const headers = {
        Authorization: `Bearer ${token}`,
        "Client-Id": clientId, // Ersetze durch deinen Client ID
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
    const userId = await getBroadcasterUserId();
    if (!userId) return 0;

    try {
        const response = await axios.get(
            `https://api.twitch.tv/helix/chat/chatters?broadcaster_id=${userId}&moderator_id=${userId}`,
            {
                headers: {
                    "Client-Id": clientId,
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        console2025.log("twitch", `${response.data}`, "log");
        return response.data.data.length; // Die Anzahl der Chat-Teilnehmer
    } catch (error) {
        console2025.log("twitch", `Fehler beim Abrufen der Zuschaueranzahl:`, "error");
        return 0; // Fallback bei Fehler
    }
}

// Funktion zum Abrufen des Follow-Datums von Twitch
export const getFollowDate = async function (clientId, accessToken, fromId) {
    console2025.log("twitch", `User requested Follow-Age: ${fromId}`, "info");
    const url = `https://api.twitch.tv/helix/users/follows?from_id=${fromId}&to_id=27766960`;
    // TODO: to_id dynamisieren!
    const headers = new Headers();
    headers.append("Client-ID", clientId);
    headers.append("Authorization", `Bearer ${accessToken}`);

    const requestOptions = {
        method: "GET",
        headers: headers,
    };

    return fetch(url, requestOptions)
        .then((response) => response.json())
        .then((data) => {
            console2025.log("twitch", `DATA: ${data}`);
            const followDate = data[0].followed_at;
            return { followDate };
        });
};

// Funktion zum Abrufen eines Twitch Bearer Tokens
export const getTwitchBearerToken = async function (
    username,
    clientId,
    clientSecret
) {
    clientId = clientId;
    clientSecret = clientSecret;
    try {
        const response = await fetch("https://id.twitch.tv/oauth2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: "client_credentials",
            }),
        });

        const data = await response.json();
        const bearerToken = data.access_token;
        return { username, bearerToken };
    } catch (error) {
        console2025.log("twitch",`Error: ${error}`, "error");
        return null;
    }
};

// Whisper TODO // WiP
export function twitchWhisper() {
    let streamerID = "";
    let userID = "";
    let whisperMessage = "";

    const url = `https://api.twitch.tv/helix/whispers?from_user_id=${streamerID}&to_user_id=${userID}?message=${whisperMessage}`;

    const options = {
        method: "POST",
        Authorization: `Bearer ${token}`,
        "Client-Id": `${clientId}`,
        "Content-Type": "application/x-www-form-urlencoded",
    };

    let data = `{"message":"${whiserMessage}"}`;

    let result = "";

    const req = http.request(url, options, (res) => {
        console.log(res.statusCode);
        res.setEncoding("utf8");

        res.on("data", (chunk) => {
            result += chunk;
        });

        res.on("end", () => {
            console.log(result);
        });
    });

    req.on("error", (e) => {
        console.error(e);
    });

    req.write(data);
    req.end();
}

// Funktion zum Abrufen von Benutzerinformationen von Twitch
export const getUserInfo = function (clientId, accessToken, userLogin) {
    const url = `/helix/channels/followers?broadcaster_id=27766960`;

    const headers = new Headers();
    headers.append("Client-ID", clientId);
    headers.append("Authorization", `Bearer ${accessToken}`);

    const requestOptions = {
        method: "GET",
        headers: headers,
    };
    return fetch(url, requestOptions)
        .then((response) => response.json())
        .then((data) => {
            const creationDate = data.data[0].created_at;
            const userId = data.data[0].id;
            return { clientId, accessToken, userId, userLogin, creationDate };
        });
};

export async function setGame(gameName) {
    try {
        // Spiel-ID holen
        const response = await fetch(
            `https://api.twitch.tv/helix/games?name=${gameName}`,
            {
                headers: {
                    "Client-ID": clientId,
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const data = await response.json();

        if (data && data.data && data.data.length > 0) {
            const gameId = data.data[0].id; // Hole die Spiel-ID

            // Setze das Spiel über die Twitch-API
            const apiUrl = `https://api.twitch.tv/helix/channels?broadcaster_id=${clientId}`;

            const patchResponse = await fetch(apiUrl, {
                method: "PATCH",
                headers: {
                    "Client-ID": clientId,
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    game_id: gameId, // Setze das Spiel mit der ID
                }),
            });

            const patchData = await patchResponse.json();

            if (patchData.error) {
                console2025.log("twitch",`Fehler:  ${patchData.error}`, "error");
                return { msg: "false", error: patchData.error };
            } else {
                console2025.log("twitch", `Das Spiel wurde auf "${gameName}" gesetzt`, "info");
                return { msg: "true" };
            }
        } else {
            return { msg: "notfound" };
        }
    } catch (error) {
        console2025.log("twitch",`Fehler beim Abrufen der Spiel-ID: ${error}`, "error");
        return { msg: "false", error: error };
    }
}

export async function getCommandCountInDB(command) {
    const cleanedCommand = command.replace(/[^a-zA-Z0-9_]/g, "") || command;

    try {
        let pool = await poolPromise;
        let result = await pool
            .request()
            .input("command", sql.VarChar, cleanedCommand) // Typ angeben!
            .query(`SELECT frequency FROM tbl_commands WHERE command = @command`); // Nur benötigte Spalte abrufen!

        if (result.recordset.length > 0) {
            const parsedCount = parseInt(result.recordset[0].frequency, 10); // Sicherstellen, dass es eine Ganzzahl ist
            return parsedCount;
        } else {
            console.log(`${command} nicht in der DB gefunden.`);
            return 0; // Rückgabe eines sicheren Standardwerts
        }
    } catch (err) {
        console.error("Fehler beim Abrufen von Command:", err);
        return null; // Fehlerhandling verbessern
    }
}

export async function updateCommandCountInDB(command, commandCount) {
    const cleanedCommand = command.replace(/[^a-zA-Z0-9_]/g, "") || command;
    const parsedCount = parseInt(commandCount, 10); // Sicherstellen, dass es eine Ganzzahl ist

    if (isNaN(parsedCount)) {
        console.error(`Ungültiger Wert für commandCount: ${commandCount}`);
        return; // Abbrechen, wenn keine gültige Zahl
    }

    try {
        const pool = await poolPromise;
        const now = new Date();

        // Parametrisierte Abfrage zur Sicherheit
        await pool
            .request()
            .input("command", sql.VarChar, cleanedCommand)
            .input("frequency", sql.Int, commandCount)
            .input("date_now", sql.DateTime, now).query(`
                MERGE tbl_commands AS target
                USING (SELECT @command AS command) AS source
                ON target.command = source.command
                WHEN MATCHED THEN 
                    UPDATE SET frequency = @frequency, date_last_used = @date_now
                WHEN NOT MATCHED THEN 
                    INSERT (command, frequency, date_added, date_last_used) 
                    VALUES (@command, @frequency, @date_now, @date_now);
            `);

        console.log("sql", `${command} x ${commandCount}`, "info");
    
    } catch (err) {
        console2025.log("sql", `Fehler beim Aktualisieren des CommandCounts:  ${err}`, "error");
    }
}
