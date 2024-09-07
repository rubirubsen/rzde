# Choose a base image that suits your needs.
# For example, you can use Ubuntu as the base image.
FROM ubuntu:latest

# Update the package lists and install necessary dependencies.
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    unzip \
    openssl

# Set the working directory to the UnrealIRCd directory.
WORKDIR /unrealircd

# Copy the local UnrealIRCd source code archive to the container.
COPY unrealircd-latest.tar.gz /unrealircd/unrealircd-latest.tar.gz

# Extract the UnrealIRCd source code.
RUN tar xzf unrealircd-latest.tar.gz && \
    rm unrealircd-latest.tar.gz

# Set the working directory to the extracted UnrealIRCd directory.
WORKDIR /unrealircd/unrealircd*

# Build and install UnrealIRCd.
RUN ./Config && \
    make && \
    make install

# Generate self-signed SSL certificate.
RUN openssl req -new -x509 -nodes -out /unrealircd/conf/ssl.pem -keyout /unrealircd/conf/ssl.pem -days 3650 -subj '/CN=IRC Server'

# Copy UnrealIRCd configuration file with SSL/TLS enabled.
COPY unrealircd.conf /unrealircd/conf/unrealircd.conf

# Expose the necessary ports for IRC communication.
EXPOSE 6667
EXPOSE 6697

# Set the entrypoint command to start UnrealIRCd.
CMD ["unrealircd", "-F"]