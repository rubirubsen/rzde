/**
 * Logger Module with Ansi-Colors 
 * ---------------------------------------------------------------------------
 * console2025.log('twitch', 'Neuer Follower!', 'info');
 * console2025.log('sql', 'Datenbankverbindung hergestellt', 'log');
 * console2025.log('server', 'Server gestartet', 'info');
 * console2025.log('spotify', 'API-Anfrage fehlgeschlagen', 'error');
 * console2025.log('helper', 'Hilfsfunktion ausgeführt', 'warn');
 * 
 */

// ANSI-Farbcodes
const COLORS = {
    // Reset
    RESET: '\x1b[0m',

    // Textfarben
    WHITE: '\x1b[37m',
    BLACK: '\x1b[30m',
    RED: '\x1b[31m',
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[34m',
    MAGENTA: '\x1b[35m',
    CYAN: '\x1b[36m',
    PURPLE: '\x1b[38;5;93m', // Helleres Lila

    // Hintergrundfarben
    BG_BLACK: '\x1b[40m',
    BG_RED: '\x1b[41m',
    BG_GREEN: '\x1b[42m',
    BG_YELLOW: '\x1b[43m',
    BG_BLUE: '\x1b[44m',
    BG_MAGENTA: '\x1b[45m',
    BG_CYAN: '\x1b[46m',
    BG_WHITE: '\x1b[47m',
    BG_PURPLE: '\x1b[48;5;93m', // Helleres Lila als Hintergrund
    BG_DARK_GRAY: '\x1b[48;5;235m', // Dunkles Grau
    BG_LIGHT_GRAY: '\x1b[48;5;250m', // Helles Grau
    BG_DARK_GREEN: '\x1b[48;5;22m', // Dunkles Grün
};

// Dienst-spezifische Farbkonfigurationen
const SERVICE_COLORS = {
    sql: {
        log: `${COLORS.CYAN}${COLORS.BG_DARK_GRAY}`, // Cyan auf dunklem Grau (neutral)
        info: `${COLORS.WHITE}${COLORS.BG_BLUE}`, // Weiß auf Blau (informativ)
        warn: `${COLORS.BLACK}${COLORS.BG_YELLOW}`, // Schwarz auf Gelb (Warnung)
        error: `${COLORS.WHITE}${COLORS.BG_RED}`, // Weiß auf Rot (Fehler)
    },
    server: {
        log: `${COLORS.WHITE}${COLORS.BG_DARK_GRAY}`, // Weiß auf dunklem Grau (neutral)
        info: `${COLORS.WHITE}${COLORS.BG_CYAN}`, // Weiß auf Cyan (informativ)
        warn: `${COLORS.BLACK}${COLORS.BG_YELLOW}`, // Schwarz auf Gelb (Warnung)
        error: `${COLORS.WHITE}${COLORS.BG_RED}`, // Weiß auf Rot (Fehler)
    },
    twitch: {
        log: `${COLORS.WHITE}${COLORS.BG_PURPLE}`, // Weiß auf Lila (neutral, Twitch-Thema)
        info: `${COLORS.WHITE}${COLORS.BG_MAGENTA}`, // Weiß auf Magenta (informativ)
        warn: `${COLORS.BLACK}${COLORS.BG_YELLOW}`, // Schwarz auf Gelb (Warnung)
        error: `${COLORS.WHITE}${COLORS.BG_RED}`, // Weiß auf Rot (Fehler)
    },
    spotify: {
        log: `${COLORS.WHITE}${COLORS.BG_DARK_GREEN}`, // Weiß auf dunklem Grün (neutral, Spotify-Thema)
        info: `${COLORS.BLACK}${COLORS.BG_GREEN}`, // Schwarz auf Grün (informativ)
        warn: `${COLORS.BLACK}${COLORS.BG_YELLOW}`, // Schwarz auf Gelb (Warnung)
        error: `${COLORS.WHITE}${COLORS.BG_RED}`, // Weiß auf Rot (Fehler)
    },
    helper: {
        log: `${COLORS.BLACK}${COLORS.BG_LIGHT_GRAY}`, // Schwarz auf hellem Grau (neutral)
        info: `${COLORS.BLACK}${COLORS.BG_CYAN}`, // Schwarz auf Cyan (informativ)
        warn: `${COLORS.BLACK}${COLORS.BG_YELLOW}`, // Schwarz auf Gelb (Warnung)
        error: `${COLORS.WHITE}${COLORS.BG_RED}`, // Weiß auf Rot (Fehler)
    },
    websocket: {
        log: `${COLORS.BLUE}${COLORS.BG_WHITE}`, // Weiß auf dunklem Blau (neutral, WebSocket-Thema)
        info: `${COLORS.WHITE}${COLORS.BLACK}`, // Schwarz auf Blau (informativ)
        warn: `${COLORS.BLACK}${COLORS.BG_YELLOW}`, // Schwarz auf Gelb (Warnung)
        error: `${COLORS.WHITE}${COLORS.BG_RED}`, // Weiß auf Rot (Fehler)
    }
};



class console2025{
    /**
     * Interne Hilfsfunktion zum Loggen von Nachrichten oder JSON-Objekten.
     * @param {string} service - Der Dienstname (z. B. 'twitch', 'sql', 'server')
     * @param {string|Object} message - Die Nachricht oder das JSON-Objekt zum Loggen
     * @param {string} level - Das Log-Level ('log', 'info', 'warn', 'error')
     * @private
     */
    static _log(service, message, level) {
        // Validierung des Dienstes
        if (!service || typeof service !== 'string') {
            console.error(`${COLORS.RED}Ungültiger Dienst: ${service}${COLORS.RESET}`);
            return;
        }

        // Validierung des Log-Levels
        if (!['log', 'info', 'warn', 'error'].includes(level)) {
            console.error(`${COLORS.RED}Ungültiges Log-Level: ${level}${COLORS.RESET}`);
            return;
        }

        // Dienst-spezifische Farben abrufen
        const serviceColors = SERVICE_COLORS[service.toLowerCase()];
        if (!serviceColors) {
            console.error(`${COLORS.RED}Unbekannter Dienst: ${service}${COLORS.RESET}`);
            return;
        }

        // Farbe basierend auf Log-Level auswählen
        const color = serviceColors[level];
        if (!color) {
            console.error(`${COLORS.RED}Unbekanntes Log-Level für Dienst ${service}: ${level}${COLORS.RESET}`);
            return;
        }

        // Log-Methode basierend auf Level auswählen
        const logMethod = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error,
        }[level];

        // Nachricht formatieren
        let formattedMessage;
        if (typeof message === 'string') {
            formattedMessage = message;
        } else if (message !== null && typeof message === 'object') {
            try {
                // JSON-Objekt mit Einrückung formatieren
                formattedMessage = JSON.stringify(message, null, 2);
            } catch (error) {
                // Fallback bei JSON-Formatierungsfehlern (z. B. zirkuläre Referenzen)
                console.error(`${COLORS.RED}Fehler beim Formatieren des JSON-Objekts: ${error.message}${COLORS.RESET}`);
                formattedMessage = `[Unformatiertes Objekt] ${String(message)}`;
            }
        } else {
            console.error(`${COLORS.RED}Ungültige Nachricht: ${String(message)}${COLORS.RESET}`);
            return;
        }

        // Loggen
        logMethod(`${color}[${service.toUpperCase()}] ${formattedMessage}${COLORS.RESET}`);
    }
    
        /**
     * Loggt eine Standardnachricht oder ein JSON-Objekt.
     * @param {string} service - Der Dienstname (z. B. 'twitch', 'sql', 'server')
     * @param {string|Object} message - Die Nachricht oder das JSON-Objekt zum Loggen
     */
        static log(service, message) {
            console2025._log(service, message, 'log');
        }
    
        /**
         * Loggt eine informative Nachricht oder ein JSON-Objekt.
         * @param {string} service - Der Dienstname (z. B. 'twitch', 'sql', 'server')
         * @param {string|Object} message - Die Nachricht oder das JSON-Objekt zum Loggen
         */
        static info(service, message) {
            console2025._log(service, message, 'info');
        }
    
        /**
         * Loggt eine Warnung oder ein JSON-Objekt.
         * @param {string} service - Der Dienstname (z. B. 'twitch', 'sql', 'server')
         * @param {string|Object} message - Die Nachricht oder das JSON-Objekt zum Loggen
         */
        static warn(service, message) {
            console2025._log(service, message, 'warn');
        }
    
        /**
         * Loggt einen Fehler oder ein JSON-Objekt.
         * @param {string} service - Der Dienstname (z. B. 'twitch', 'sql', 'server')
         * @param {string|Object} message - Die Nachricht oder das JSON-Objekt zum Loggen
         */
        static error(service, message) {
            console2025._log(service, message, 'error');
        }
}


export default console2025;