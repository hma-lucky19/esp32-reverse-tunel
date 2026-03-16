const express = require("express");
const WebSocket = require("ws");

const app = express();
const server = require("http").createServer(app);
const wss = new WebSocket.Server({ server });

let espSocket = null;

wss.on("connection", (ws, req) => {
    console.log("ESP32 connected");
    espSocket = ws;

    ws.on("close", () => {
        console.log("ESP32 disconnected");
        espSocket = null;
    });
});

app.use(async (req, res) => {

    if (!espSocket) {
        res.status(503).send("ESP32 offline");
        return;
    }

    const id = Date.now();

    const payload = {
        id: id,
        method: req.method,
        path: req.originalUrl
    };

    espSocket.send(JSON.stringify(payload));

    const listener = (msg) => {
        const data = JSON.parse(msg);

        if (data.id === id) {
            res.status(200).send(data.body);
            espSocket.off("message", listener);
        }
    };

    espSocket.on("message", listener);
});

server.listen(3000, () => {
    console.log("Tunnel server running");
});
