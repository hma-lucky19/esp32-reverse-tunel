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
app.get('/', async (req, res) => {
    // Warte bis zu 5 Sekunden, falls der ESP32 gerade erst reconnectet
    let attempts = 0;
    while (!esp32Socket && attempts < 5) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
    }

    if (esp32Socket && esp32Socket.readyState === WebSocket.OPEN) {
        pendingResponse = res;
        esp32Socket.send("GET_HTML");
    } else {
        res.status(503).send("ESP32 verbindet sich noch... bitte Seite neu laden.");
    }
        const action = req.query.action;
    if (action) {
        // Schicke den Befehl (z.B. "L1_ON") an den ESP32
        esp32Socket.send(action);
        // Nach dem Klick laden wir die Seite nach 1 Sekunde neu, um den Status zu sehen
        return res.send("<script>setTimeout(() => { window.location.href = '/'; }, 1000);</script>Befehl gesendet...");
    }
});
