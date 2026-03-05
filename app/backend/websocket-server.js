const {WebSocketServer} = require("ws");

function startWebSocketServer() {

    const wss = new WebSocketServer({ port: 8081 });

    wss.on("connection", (ws) => {
        console.log("client connected");
        ws.on('error', console.error);

        ws.on("message", (data) => {
        console.log(`Message recieved: ${data}`);
        });

        ws.on('ping', () => {
            console.log(`Ping recieved`);
        });
    });

    wss.on("open", () => {
    console.log("client opened");
    });

    wss.on('error', (e) => {
        console.error(`Error: ${e}`);
    });

    console.log(`websocket server running at port ${wss.options.port}.`);
}

module.exports = startWebSocketServer;