# Verwende das offizielle Nginx-Image als Basis
FROM nginx:latest

# Installiere benötigte Pakete
RUN apt-get update && \
    apt-get install -y \
    libnginx-mod-http-rtmp \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Kopiere die Nginx-Konfigurationsdatei in den Container
COPY nginx.conf /etc/nginx/nginx.conf

# Exponiere die RTMP- und HTTP-Ports
EXPOSE 1935 80

# Starte Nginx
CMD ["nginx", "-g", "daemon off;"]