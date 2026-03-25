//-----------------------------------------------------------------------------
/**
 * @file websocket-client.js
 * @author Will Mungas, Connor Hekking
 * 
 * Frontend module to handle common websocket setup and operations from the 
 * client side
 * 
 * Initially adapted from: 
 * https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications
 */
//-----------------------------------------------------------------------------

//--- EXPORTS -----------------------------------------------------------------

export const ws_client = {
    init, 
    send,
    uri,
    types
};

//--- CONSTANTS ---------------------------------------------------------------

// websocket connection uri
const uri = "ws://127.0.0.1:8080";

const types = {
    TEACHING: "teaching",
    MULTI: "multiplayer",
    STUDY: "study"
};

//--- FUNCTIONS ---------------------------------------------------------------

/**
 * @author Connor Hekking, Will Mungas
 * 
 * Handles setting up event listeners on a new client websocket
 * 
 * @param {*} ws websocket to add event listeners to
 * @param {*} handler 
 */
const init = (ws, handler) => {
    // handle open event
    ws.addEventListener("open", () => {
        console.log("CONNECTED");
        sendWebsocket('hi');
    });

    // handle error events
    ws.addEventListener("error", (e) => {
        console.log(`ERROR`);
        console.log(e);
    });

    // handle incoming messages - pass to handler function (implemented by each game)
    ws.addEventListener("message", (e) => {
        console.log(`RECEIVED: ${e.data}`);
        handler(e.data);
    });

    // handle close event
    websocket.addEventListener("close", () => {
        console.log("DISCONNECTED");
    });
    console.log("client websocket initialized");
}

/**
 * @author Connor Hekking, Will Mungas
 * Logs messages before sending on a websocket 
 * 
 * @param {*} ws 
 * @param {*} message 
 */
const send = (ws, message) => {
    ws.send(message);
    console.log("sent " + message);
}


