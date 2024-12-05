# rzde - Docker Compose Setup

This project contains a Docker Compose configuration for the **rubizockt.de** infrastructure. It integrates several services to provide web applications, chats, databases and streaming functions.

## Included services

### 1. **RTMP server**
NGINX-based RTMP server for video streaming.
- **Ports:**
- `8080` (HTTP)
- `1935` (RTMP)

### 2. **MSSQL database**
Microsoft SQL Server for relational data and platform-specific functions.
- **Port:** `1433`

### 3. **MySQL database**
MySQL database for general backend data.
- **Port:** `3306`

### 4. **NGINX web server**
NGINX serves as a web server and proxy, including HTTPS support.
- **Ports:**
- `80` (HTTP)
- `443` (HTTPS)

### 5. **PHP-FPM**
A PHP-FPM container for processing PHP applications.

### 6. **Node.js**
Node.js service for backend applications and WebSocket functions.
- **Port:** `3000`

### 7. **IRC server**
Inspircd, an IRC server for chat systems.
- **Ports:**
- `6667` (Default)
- `6697` (TLS)

### 8. **TeamSpeak Server**
TeamSpeak for voice communication.
- **Ports:**
- `9987/udp` (Voice)
- `10011` (Query)
- `30033` (File Transfer)

---

## Requirements

- **Docker** and **Docker-Compose** must be installed.
- A `.env` file for sensitive data such as passwords is recommended. (.env copy files are included)

---

## Installation
1. Clone the repository:
```bash
git clone https://github.com/rubirubsen/rzde.git
cd rzde
```
2. Adjust passwords and configurations in the docker-compose.yml or .env file.

3. Start the services:
```
docker-compose up -d
```

4. Check the logs to make sure everything is running correctly:
```
docker-compose logs -f
```
