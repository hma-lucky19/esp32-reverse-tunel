const express = require("express");
const WebSocket = require("ws");
const http = require("http");

const app = express();
app.use(express.raw({type:"*/*"}));

const server = http.createServer(app);
const wss = new WebSocket.Server({server});

let esp = null;
let requests = {};

wss.on("connection", ws => {

    console.log("ESP32 connected");
    esp = ws;

    ws.on("close", ()=>{
        console.log("ESP32 disconnected");
        esp = null;
    });

    ws.on("message", msg=>{
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

    if(!esp){
        res.status(503).send("ESP32 offline");
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

server.listen(3000,()=>{
    console.log("Tunnel running");
});
