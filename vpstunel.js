const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let esp32Socket = null;
let pendingResponse = null;

// Websocket-Verbindung vom ESP32
wss.on('connection', (ws) => {
    console.log("ESP32 verbunden!");
    esp32Socket = ws;
    
    ws.on('message', (data) => {
        // Wenn der ESP32 HTML sendet, schicken wir es an den wartenden Browser
        if (pendingResponse) {
            pendingResponse.send(data.toString());
            pendingResponse = null;
        }
    });

    ws.on('close', () => { esp32Socket = null; });
});

// Öffentliche URL: Leitet Anfragen an den ESP32 weiter
app.get('/', (req, res) => {
    if (!esp32Socket) return res.status(503).send("ESP32 nicht verbunden");

    const action = req.query.action;
    if (action) {
        // Schicke den Befehl (z.B. "L1_ON") an den ESP32
        esp32Socket.send(action);
        // Nach dem Klick laden wir die Seite nach 1 Sekunde neu, um den Status zu sehen
        return res.send("<script>setTimeout(() => { window.location.href = '/'; }, 1000);</script>Befehl gesendet...");
    }

    // Normaler Seitenaufruf: HTML vom ESP32 anfordern
    pendingResponse = res;
    esp32Socket.send("GET_HTML");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
