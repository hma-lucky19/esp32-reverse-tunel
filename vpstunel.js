const express = require("express");
const WebSocket = require("ws");
const http = require("http");

const app = express();
app.use(express.raw({type:"*/*"}));

const server = http.createServer(app);
const wss = new WebSocket.Server({server});

let lastSeen = 0;
let esp = null;
let requests = {};

wss.on("connection", ws => {

    console.log("ESP32 connected");
    esp = ws;
    lastSeen = Date.now();

    ws.on("close", ()=>{
        console.log("ESP32 disconnected");
        lastSeen = Date.now(); // wichtig!
        esp = null;
    });

    ws.on("message", msg=>{
        lastSeen = Date.now(); // jede Aktivität zählt
        const data = JSON.parse(msg);

        const res = requests[data.id];
        if(!res) return;

        res.status(data.status);

        if(data.headers){
            for(const h in data.headers){
                res.setHeader(h,data.headers[h]);
            }
        }

        res.send(Buffer.from(data.body,"base64"));

        delete requests[data.id];
    });

});

app.all("*",(req,res)=>{

    const now = Date.now();

    // 🔴 wirklich offline (zu lange weg)
    if(!esp && (now - lastSeen > 120000)){
        res.status(503).send("ESP32 offline");
        return;
    }

    // 🟡 kurz disconnected → nicht crashen!
    if(!esp){
        res.status(503).send("ESP32 reconnecting...");
        return;
    }

    const id = Date.now().toString() + Math.random().toString().substring(2, 6);
    requests[id] = res;

    const payload = {
        id:id,
        method:req.method,
        path:req.originalUrl,
        headers:req.headers,
        body:req.body.toString("base64")
    };

    esp.send(JSON.stringify(payload));
});
