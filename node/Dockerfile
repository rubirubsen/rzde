# Basisimage
FROM node:20

# Arbeitsverzeichnis im Container
WORKDIR /app

# Abhängigkeiten installieren
COPY package.json package-lock.json /app/
RUN npm ci --production
RUN npm install

# Anwendungscode kopieren
COPY . /app

# Umgebungsvariable konfigurieren
ENV PORT=8123

# Container-Port freigeben
EXPOSE $PORT

# Startbefehl
CMD ["npm", "start"]
