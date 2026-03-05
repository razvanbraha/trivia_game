// https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications

const wsUri = "ws://127.0.0.1:8080";
const websocket = new WebSocket(wsUri);

function startWebsocket() {
    websocket.addEventListener("open", () => {
        console.log("CONNECTED");
        pingInterval = setInterval(() => {
            console.log(`SENT: ping`);
            websocket.send("ping");
        }, 1000);
        sendWebsocket('hi');
    });

    websocket.addEventListener("error", (e) => {
        console.log(`ERROR`);
        console.log(e);
    });

    websocket.addEventListener("message", (e) => {
        console.log(`RECEIVED: ${e.data}`);
    });
    console.log("client websocket initialized");

    // websocket.addEventListener("message", (e) => {
    //     const message = JSON.parse(e.data);
    //     log(`RECEIVED: ${message.iteration}: ${message.content}`);
    //     counter++;
    // });
}

function sendWebsocket(message) {
    // const msg = {
    //     time: Date(),
    //     content: message,
    // };
    // websocket.send(JSON.stringify(message));
    // console.log("sent " + JSON.stringify(message));
    websocket.send(message);
    console.log("sent " + message);
}

function disconnectWebsocket() {
    websocket.addEventListener("close", () => {
        console.log("DISCONNECTED");
        clearInterval(pingInterval);
    });
}

startWebsocket();