// https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications

const wsUri = "ws://127.0.0.1/";
const websocket = new WebSocket(wsUri);

function startWebsocket() {
    websocket.addEventListener("open", () => {
        console.log("CONNECTED");
        pingInterval = setInterval(() => {
            console.log(`SENT: ping: ${counter}`);
            websocket.send("ping");
        }, 1000);
    });

    websocket.addEventListener("error", (e) => {
        console.log(`ERROR`);
    });

    websocket.addEventListener("message", (e) => {
        log(`RECEIVED: ${e.data}`);
    });

    // websocket.addEventListener("message", (e) => {
    //     const message = JSON.parse(e.data);
    //     log(`RECEIVED: ${message.iteration}: ${message.content}`);
    //     counter++;
    // });
}

function sendWebsocket() {
    const message = {
        iteration: counter,
        content: "ping",
    };
    websocket.send(JSON.stringify(message));
}

function disconnectWebsocket() {
    websocket.addEventListener("close", () => {
        log("DISCONNECTED");
        clearInterval(pingInterval);
    });
}