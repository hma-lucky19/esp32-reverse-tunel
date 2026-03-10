// sehr vereinfachtes Beispiel, nicht produktionsreif

const net = require("net");
const express = require("express");

let espSocket = null;

// TCP-Server für ESP32
const tcpServer = net.createServer((socket) => {
  espSocket = socket;
  // hier müsstest du auch die JSON-Frames lesen, etc.
});

tcpServer.listen(9000);

// HTTP-Server für Browser
const app = express();

app.use(express.text({ type: "*/*" })); // Body als Text

app.all("*", async (req, res) => {
  if (!espSocket) {
    return res.status(503).send("ESP32 not connected");
  }

  const id = Date.now(); // simple ID
  // Request-JSON fürs ESP bauen
  const payload = JSON.stringify({
    id,
    method: req.method,
    path: req.path,
    query: req.originalUrl.split("?")[1] || "",
    body: req.body || ""
  });

  // Länge + JSON an ESP schicken
  const len = Buffer.byteLength(payload);
  const header = Buffer.alloc(4);
  header.writeUInt32BE(len);
  espSocket.write(Buffer.concat([header, Buffer.from(payload)]));

  // Jetzt Antwort von ESP lesen -> passend parsen (id vergleichen) -> an Browser senden.
  // Der Code dafür ist etwas ausführlicher (Buffer-Handling, mehrere Requests parallel etc.).
});

app.listen(process.env.PORT || 3000);
