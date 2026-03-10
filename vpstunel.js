const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let esp32Socket = null;

wss.on('connection', (ws, req) => {
  console.log('Client connected:', req.socket.remoteAddress);
  
  // Erstes WS = ESP32
  if (!esp32Socket) {
    esp32Socket = ws;
    ws.on('message', (data) => {
      console.log('ESP32:', data.toString());
    });
    app.locals.esp32Connected = true;  // Status setzen
  }
});

app.get('/', (req, res) => {
  if (app.locals.esp32Connected) {
    res.send('✅ ESP32 connected!');
  } else {
    res.send('❌ ESP32 not connected');
  }
});

app.post('/tunnel', (req, res) => {
  if (esp32Socket) {
    esp32Socket.send(req.body);  // HTTP → WS
    res.json({status: 'sent'});
  } else {
    res.status(503).send('ESP32 offline');
  }
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Gateway on port ${PORT}`);
});

