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