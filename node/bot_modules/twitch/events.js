import console2025 from "../logging.js";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config({ path: './../../.env' });


const clientId = process.env.TWITCHAPIUSER; // Dein Twitch Client ID hier
const secret = process.env.TWICHAPISECRET; // Dein Twitch Secret hier
const redirect_uri_env = process.env.TWITCH_REDIRECT_URI; // URL, zu der Twitch nach dem Login zurückkehrt
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const broadcaster_user_id = process.env.TWITCH_BROADCASTER_ID;
const reconnectDelay = 10000;
let accessToken = '';
let currentSessionId = '';
let activeSubscriptions = []; 



export const TWITCH_EVENTS = {
    CHANNEL_POINTS_REDEMPTION: {
        type: 'channel.channel_points_custom_reward_redemption.add',
        version: '1',
        condition: (broadcaster_user_id) => ({
            broadcaster_user_id,
        }),
    },
    STREAM_ONLINE: {
        type: 'stream.online',
        version: '1',
        condition: (broadcaster_user_id) => ({
            broadcaster_user_id,
        }),
    },
    STREAM_OFFLINE: {
        type: 'stream.offline',
        version: '1',
        condition: (broadcaster_user_id) => ({
            broadcaster_user_id,
        }),
    },
    CHAT_MESSAGE: {
        type: 'channel.chat.message',
        version: '1',
        condition: (broadcaster_user_id, user_id) => ({
            broadcaster_user_id,
            user_id, // Dynamisch, z. B. aus Umgebungsvariablen
        }),
    },
};

export async function getBroadcasterUserId() {
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

export async function showEventSubscriptions() {
    // Validierung von clientId und accessToken
    if (!clientId) {
        console2025.error('twitch', 'Client-ID fehlt. Bitte stelle sicher, dass clientId definiert ist.');
        throw new Error('Client-ID fehlt');
    }
    if (!accessToken) {
        console2025.error('twitch', 'Access-Token fehlt. Bitte stelle sicher, dass accessToken definiert ist.');
        throw new Error('Access-Token fehlt');
    }

    try {
        const response = await axios.get('https://api.twitch.tv/helix/eventsub/subscriptions', {
            headers: {
                'Client-Id': clientId,
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        // Überprüfen, ob die Antwort gültige Daten enthält
        if (!response.data || !Array.isArray(response.data.data)) {
            console2025.error('twitch', 'Ungültige Antwort von der Twitch-API: Keine Subscriptions gefunden.');
            throw new Error('Ungültige Antwort von der Twitch-API');
        }

        // IDs aus der data-Eigenschaft extrahieren
        activeSubscriptions = response.data.data.map(subscription => subscription.id);

        // Erfolgreiche Antwort und activeSubscriptions protokollieren
        console2025.info('twitch', {
            message: 'EventSub Subscriptions abgerufen',
            total: response.data.total,
            activeSubscriptions: activeSubscriptions,
        });

        // Optional: Gesamte Antwort protokollieren (für Debugging)
        console2025.log('twitch', { message: 'Vollständige Antwort', data: response.data });

        return activeSubscriptions;
    } catch (error) {
        // Fehler protokollieren
        if (error.response) {
            console2025.error('twitch', {
                message: 'Fehler beim Abrufen der EventSub Subscriptions',
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data,
            });
        } else {
            console2025.error('twitch', { message: 'Fehler beim Abrufen der EventSub Subscriptions', error: error.message });
        }
        throw error;
    }
}

/**
 * Entfernt mehrere EventSub-Subscriptions anhand ihrer IDs.
 * @param {string[]} subscriptionIds - Array von Subscription-IDs, die entfernt werden sollen
 * @returns {Promise<{ successful: string[], failed: { id: string, error: string }[] }>} - Ergebnisse der Entfernungen
 */
export async function unsubscribeEvents(subscriptionIds) {
    // Validierung von Eingaben
    if (!clientId) {
        console2025.error('twitch', 'Client-ID fehlt. Bitte stelle sicher, dass clientId definiert ist.');
        throw new Error('Client-ID fehlt');
    }
    if (!accessToken) {
        console2025.error('twitch', 'Access-Token fehlt. Bitte stelle sicher, dass accessToken definiert ist.');
        throw new Error('Access-Token fehlt');
    }
    if (!Array.isArray(subscriptionIds) || subscriptionIds.length === 0) {
        console2025.error('twitch', 'Ungültige oder leere Liste von Subscription-IDs.');
        throw new Error('Ungültige oder leere Liste von Subscription-IDs');
    }

    // Ergebnisse speichern
    const results = {
        successful: [],
        failed: [],
    };

    // Batch-Größe für Rate-Limits (z. B. 10 Anfragen pro Batch)
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < subscriptionIds.length; i += batchSize) {
        batches.push(subscriptionIds.slice(i, i + batchSize));
    }

    // Verarbeite Batches nacheinander mit Verzögerung
    for (const batch of batches) {
        const batchPromises = batch.map(async (subscriptionId) => {
            const result = await unsubscribeSingleEvent(subscriptionId, clientId, accessToken);
            if (result.success) {
                results.successful.push(result.id);
            } else {
                results.failed.push({ id: result.id, error: result.error });
            }
        });

        // Warte auf alle Anfragen im aktuellen Batch
        await Promise.all(batchPromises);

        // Verzögerung zwischen Batches (z. B. 1 Sekunde)
        if (batches.indexOf(batch) < batches.length - 1) {
            console2025.info('twitch', 'Warte auf Rate-Limit-Verzögerung zwischen Batches...');
            await delay(1000);
        }
    }

    // Ergebnisse protokollieren
    console2025.info('twitch', {
        message: 'Entfernung der Subscriptions abgeschlossen',
        successful: results.successful.length,
        failed: results.failed.length,
    });

    if (results.failed.length > 0) {
        console2025.warn('twitch', {
            message: 'Einige Subscriptions konnten nicht entfernt werden',
            failed: results.failed,
        });
    }

    return results;
}

/**
 * Bereinigt obsolete Subscriptions, die nicht mit der aktuellen Session-ID übereinstimmen.
 * @returns {Promise<void>}
 */
export async function cleanupObsoleteSubscriptions() {
    if (!currentSessionId) {
        console2025.error('twitch', 'Keine aktuelle Session-ID verfügbar.');
        return;
    }

    try {
        // Alle aktuellen Subscriptions abrufen
        const subscriptions = await axios.get('https://api.twitch.tv/helix/eventsub/subscriptions', {
            headers: {
                'Client-Id': clientId,
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        const subscriptionData = subscriptions.data.data;
        console2025.info('twitch', {
            message: 'Alle Subscriptions abgerufen',
            total: subscriptions.data.total,
        });

        // Identifiziere obsolete Subscriptions (mit alter Session-ID)
        const obsoleteSubscriptionIds = subscriptionData
            .filter(sub => sub.transport.method === 'websocket' && sub.transport.session_id !== currentSessionId)
            .map(sub => sub.id);

        if (obsoleteSubscriptionIds.length > 0) {
            console2025.info('twitch', {
                message: 'Obsolete Subscriptions gefunden',
                count: obsoleteSubscriptionIds.length,
                ids: obsoleteSubscriptionIds,
            });

            // Lösche obsolete Subscriptions
            const results = await unsubscribeEvents(obsoleteSubscriptionIds);
            console2025.info('twitch', {
                message: 'Bereinigung der obsoleten Subscriptions abgeschlossen',
                successful: results.successful.length,
                failed: results.failed.length,
            });

            if (results.failed.length > 0) {
                console2025.warn('twitch', {
                    message: 'Einige Subscriptions konnten nicht entfernt werden',
                    failed: results.failed,
                });
            }
        } else {
            console2025.info('twitch', 'Keine obsoleten Subscriptions gefunden.');
        }

        // Aktualisiere die Liste der aktiven Subscriptions
        const updatedSubscriptions = await axios.get('https://api.twitch.tv/helix/eventsub/subscriptions', {
            headers: {
                'Client-Id': clientId,
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        activeSubscriptions = updatedSubscriptions.data.data
            .filter(sub => sub.transport.method === 'websocket' && sub.transport.session_id === currentSessionId)
            .map(sub => sub.id);

        console2025.info('twitch', {
            message: 'Liste der aktiven Subscriptions aktualisiert',
            count: activeSubscriptions.length,
        });
    } catch (error) {
        console2025.error('twitch', {
            message: 'Fehler beim Bereinigen der obsoleten Subscriptions',
            error: error.response ? error.response.data : error.message,
        });
    }
}

export async function unsubscribeSingleEvent(subscriptionId) {
    try {
        const response = await axios.delete(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${subscriptionId}`, {
            headers: {
                'Client-Id': clientId,
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        console2025.info('twitch', `Subscription ${subscriptionId} erfolgreich entfernt.`);
        return { id: subscriptionId, success: true };
    } catch (error) {
        if (error.response && error.response.status === 404) {
            // 404 bedeutet, dass die Subscription bereits gelöscht ist
            console2025.info('twitch', {
                message: `Subscription ${subscriptionId} bereits gelöscht (404 Not Found).`,
            });
            return { id: subscriptionId, success: true }; // Behandle 404 als Erfolg
        } else {
            // Andere Fehler protokollieren
            if (error.response) {
                console2025.error('twitch', {
                    message: `Fehler beim Entfernen der Subscription ${subscriptionId}`,
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                });
            } else {
                console2025.error('twitch', {
                    message: `Fehler beim Entfernen der Subscription ${subscriptionId}`,
                    error: error.message,
                });
            }
            return { id: subscriptionId, success: false, error: error.message };
        }
    }
}

/**
 * Erstellt Subscriptions für gewünschte Events mit der aktuellen Session-ID.
 * @param {string} sessionId - Die aktuelle WebSocket-Session-ID
 * @returns {Promise<void>}
 */
export async function subscribeToEvents(sessionId, accessToken) {
    accessToken = accessToken;
    if (!sessionId) {
        console2025.error('twitch', 'Keine Session-ID verfügbar.');
        return;
    }

    if (!broadcaster_user_id) {
        console2025.error('twitch', 'Broadcaster User-ID konnte nicht abgerufen werden.');
        return;
    }

    // Liste der gewünschten Subscriptions
    const desiredSubscriptions = [
        {
            type: "channel.channel_points_custom_reward_redemption.add",
            condition: { broadcaster_user_id },
        },
        {
            type: "stream.online",
            condition: { broadcaster_user_id },
        },
        {
            type: "stream.offline",
            condition: { broadcaster_user_id },
        },
        {
            type: "channel.chat.message",
            condition: { broadcaster_user_id, user_id: "27766960" },
        },
    ];

    try {
        // Alle aktuellen Subscriptions abrufen, um Duplikate zu vermeiden
        const currentSubscriptions = await axios.get('https://api.twitch.tv/helix/eventsub/subscriptions', {
            headers: {
                'Client-Id': clientId,
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        const existingSubscriptions = currentSubscriptions.data.data;

        // Erstelle Subscriptions nur, wenn sie noch nicht existieren
        for (const desired of desiredSubscriptions) {
            const exists = existingSubscriptions.some(sub =>
                sub.type === desired.type &&
                JSON.stringify(sub.condition) === JSON.stringify(desired.condition) &&
                sub.transport.method === 'websocket' &&
                sub.transport.session_id === sessionId
            );

            if (!exists) {
                const payload = {
                    type: desired.type,
                    version: "1",
                    condition: desired.condition,
                    transport: {
                        method: "websocket",
                        session_id: sessionId,
                    },
                };

                const response = await axios.post(
                    "https://api.twitch.tv/helix/eventsub/subscriptions",
                    payload,
                    {
                        headers: {
                            "Client-Id": clientId,
                            "Authorization": `Bearer ${accessToken}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                console2025.info('twitch', {
                    message: `Subscription erfolgreich erstellt: ${desired.type}`,
                    subscriptionId: response.data.data[0].id,
                });
            } else {
                console2025.info('twitch', {
                    message: `Subscription bereits vorhanden: ${desired.type}`,
                });
            }
        }

        // Aktualisiere die Liste der aktiven Subscriptions
        activeSubscriptions = (await axios.get('https://api.twitch.tv/helix/eventsub/subscriptions', {
            headers: {
                'Client-Id': clientId,
                'Authorization': `Bearer ${accessToken}`,
            },
        })).data.data.map(sub => sub.id);
    } catch (error) {
        console2025.error('twitch', {
            message: 'Fehler beim Erstellen der Subscriptions',
            error: error.response ? error.response.data : error.message,
        });
    }
}

// Event-Handling (Verarbeiten der empfangenen Twitch-Events)
export function handleEvent(eventData) {
    console2025.log("twitch",`Empfangenes Event:  ${eventData}`, "info");
    // Verarbeite das Event
    if (eventData.subscription.type === "channel.channel_points_custom_reward_redemption.add") {
        const redemption = eventData.event;
        console2025.log("twitch", `Punkte eingelöst: ${redemption.reward.title} von ${redemption.user_name}`, "info");
    }
}


