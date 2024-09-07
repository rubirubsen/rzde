import dotenv from 'dotenv';
dotenv.config();

export const twitchLogin = async function(twitchConfig,req, res){
    const client_id = 'vnziuw3gqfu8axrbf90jzh4ng9q2cp';
    const client_secret = twitchConfig.identity.password;
    const twitch_uri = 'https://rubizockt.de:3000/twitch/callback';
    const scope = 'channel:bot';
    const state = 'rubizockt';
    const responseType = 'token';

    const url = `https://id.twitch.tv/oauth2/authorize?response_type=${responseType}&client_id=${client_id}&redirect_uri=${twitch_uri}&scope=${scope}&state=${state}`;
    res.redirect(url);
} 