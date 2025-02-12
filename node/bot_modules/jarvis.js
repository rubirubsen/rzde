export function sendMessageToJarvis(message) {
    // Suche den Client mit client_type === 'jarvis'
    const jarvisClient = clients.find(client => client.client_type === 'jarvis');
    
    if (jarvisClient) {
        jarvisClient.ws.send(JSON.stringify(message));
        console.log("Nachricht an Jarvis gesendet:", message);
    } else {
        console.log("Jarvis ist nicht verbunden");
    }
}