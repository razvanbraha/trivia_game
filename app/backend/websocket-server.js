const {WebSocketServer} = require("ws");

function startWebSocketServer(server) {

    const wss = new WebSocketServer({ server: server });

    wss.on("connection", (ws) => {
        console.log("client connected");
        ws.on('error', console.error);

        ws.on("message", (data) => {
            if(data.toString() === "ping") {
                ws.send("pong");
                console.log("Ping recieved");
            } else {
                console.log(`Message recieved: ${data}`);
            }
        });
    });

    wss.on('error', (e) => {
        console.error(`Error: ${e}`);
    });

    console.log(`websocket server running.`);
}

module.exports = startWebSocketServer;