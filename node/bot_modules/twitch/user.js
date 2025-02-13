// user.js
import { sql, poolPromise } from '../sql.js';

const purpleBgWhiteText = '\x1b[38;5;91m';
const YellowBgRedText = '\x1b[103m\x1b[31m';
const reset = '\x1b[0m'; // Zurücksetzen der Formatierung


class TwitchUser {
  constructor(username) {
    this.username = username.toLowerCase();
    this.displayName = username;
    this.isModerator = false;
    this.isVIP = false;
    this.isSubscriber = false;
    this.messageCount = 0;
    this.songRequestCount = 0;
  }

  // Holt User-Daten aus der DB anhand des Twitch-Benutzernamens
  async initializeFromDB() {
    try {
      const pool = await poolPromise;  // Verbindung aus dem Pool abrufen
      const result = await pool
      .request()
      .input("username", this.username) // Keine Typangabe nötig
      .query("SELECT * FROM tbl_user WHERE username = @username");

  
      if (result.recordset.length > 0) {
        const userData = result.recordset[0];
        this.displayName = userData.displayName;
        this.isModerator = userData.isMod;
        this.isVIP = userData.isVIP;
        this.isSubscriber = userData.isSub;
        this.messageCount = userData.messageCount;
        this.songRequestCount = userData.songRequestCount;
      } else {
        console.log(`User ${this.username} nicht in der DB gefunden.`);
        await this.createInDB();
        console.log('Neuer User angelegt: ', this.username);
      }
    } catch (err) {
      console.error("Fehler beim Abrufen der Benutzerdaten:", err);
    }
  }

  async updateSongRequestCountInDB() {
    try {
        let pool = await poolPromise; // Verwendet die bestehende DB-Verbindung
        await pool
            .request()
            .input("username", this.username)
            .input("songRequestCount", this.songRequestCount)
            .query("UPDATE tbl_user SET songRequestCount = @songRequestCount WHERE username = @username");
  
        console.log(`${purpleBgWhiteText}SongrequestCount ${this.username}: ${this.songRequestCount}.${reset}`);
    } catch (err) {
        console.error("Fehler beim Aktualisieren des SongrequestCounts:", err);
    }
  
  }

  async updateMessageCountInDB() {
    try {
      let pool = await poolPromise; 
      await pool
          .request()
          .input("username", sql.VarChar, this.username)
          .input("messageCount", sql.Int, this.messageCount)
          .query("UPDATE tbl_user SET messageCount = @messageCount WHERE username = @username");

      console.log(`${purpleBgWhiteText}MessageCount ${this.username}: ${this.messageCount}.${reset}`);
    } catch (err) {
        console.error("Fehler beim Aktualisieren des MessageCounts:", err);
    }
  }

  async createInDB() {
    try {
      let pool = await poolPromise; 
      await pool
          .request()
          .input("username", this.username)
          .input("displayName", this.displayName)
          .query("INSERT INTO tbl_user (username, displayName, isMod, isVIP, isSub, messageCount, songRequestCount) VALUES (@username, @displayName, 0, 0, 0, 0, 0)");
      console.log(`Neuer Benutzer ${this.username} in der Datenbank erstellt.`);
    } catch (err) {
        console.error("Fehler beim Einfügen des neuen Benutzers:", err);
    }
  }
}

export { TwitchUser };
