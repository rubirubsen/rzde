import dotenv from 'dotenv';
import sql from 'mssql';

dotenv.config();

const redBgYellowText = '\x1b[41m\x1b[93m';
const yellowBgRedText = '\x1b[103m\x1b[31m';
const reset = '\x1b[0m'; // Zurücksetzen der Formatierung

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_SECRET,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME,
  options: {
    encrypt: true, // Für Azure SQL-Datenbanken
    trustServerCertificate: true, // Für Produktionsserver ändern
  },
  pool: {
    max: 10,  // Maximal 10 gleichzeitige Verbindungen
    min: 0,
    idleTimeoutMillis: 30000,  // Timeout für inaktive Verbindungen
  },
  connectionTimeout: 15000,  // Verbindungstimeout (z.B. 15 Sekunden)
  requestTimeout: 30000,     // Anfrage-Timeout (z.B. 30 Sekunden)
};

// Pool nur einmal erstellen und wiederverwenden
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('✅ MSSQL-Datenbank verbunden');
        return pool;
    })
    .catch(err => {
        console.error('❌ Fehler beim Verbinden mit der DB:', err);
    });

// Export für Wiederverwendung in anderen Modulen
export { sql, poolPromise };