# rzde - Docker Compose Setup  

Dieses Projekt enthält eine Docker-Compose-Konfiguration für die Infrastruktur von **rubizockt.de**. Es integriert mehrere Dienste, um Webanwendungen, Chats, Datenbanken und Streaming-Funktionen bereitzustellen.  

## Enthaltene Dienste  

### 1. **RTMP-Server**  
NGINX-basierter RTMP-Server für Video-Streaming.  
- **Ports:**  
  - `8080` (HTTP)  
  - `1935` (RTMP)  

### 2. **MSSQL-Datenbank**  
Microsoft SQL Server für relationale Daten und Plattform-spezifische Funktionen.  
- **Port:** `1433`  

### 3. **MySQL-Datenbank**  
MySQL-Datenbank für allgemeine Backend-Daten.  
- **Port:** `3306`  

### 4. **NGINX-Webserver**  
NGINX dient als Webserver und Proxy, inklusive HTTPS-Unterstützung.  
- **Ports:**  
  - `80` (HTTP)  
  - `443` (HTTPS)  

### 5. **PHP-FPM**  
Ein PHP-FPM-Container für die Verarbeitung von PHP-Anwendungen.  

### 6. **Node.js**  
Node.js-Service für Backend-Anwendungen und WebSocket-Funktionen.  
- **Port:** `3000`  

### 7. **IRC-Server**  
Inspircd, ein IRC-Server für Chat-Systeme.  
- **Ports:**  
  - `6667` (Standard)  
  - `6697` (TLS)  

### 8. **TeamSpeak-Server**  
TeamSpeak für Sprachkommunikation.  
- **Ports:**  
  - `9987/udp` (Voice)  
  - `10011` (Query)  
  - `30033` (File Transfer)  

---

## Anforderungen  

- **Docker** und **Docker-Compose** müssen installiert sein.  
- Eine `.env`-Datei für sensible Daten wie Passwörter wird empfohlen. (.env copy-files liegen bei) 

---

## Installation  
1. Klone das Repository:
  ```bash
  git clone https://github.com/rubirubsen/rzde.git
  cd rzde
  ```
2. Passe Passwörter und Konfigurationen in der docker-compose.yml oder .env-Datei an.

3. Starte die Dienste:
  ```
  docker-compose up -d
  ```

4. Überprüfe die Logs, um sicherzustellen, dass alles korrekt läuft:
  ```
  docker-compose logs -f
  ```
