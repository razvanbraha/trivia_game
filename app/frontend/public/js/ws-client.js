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

//--- CONSTANTS ---------------------------------------------------------------

// websocket connection uri
const uri = "ws://127.0.0.1:8080";

const msg_types = {
    JOIN: 1,
    START: 2,
    QUESTION: 3,
    CHOICES: 4,
    READY: 5, 
    ANSWER: 6,
    CLOSE: 7, 
    CONTINUE: 8,
    RESULTS: 9,
    DONE: 10,
    ERROR: 11,
};

const game_types = {
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
 * @param {()} handler function to handle messages sent on the websocket
 * @param {()} first function to call on the open event 
 */
const init = (ws, handler, first) => {
    // handle open event
    ws.addEventListener("open", () => {
        console.log("CONNECTED");
        send(ws, 'hi');
        first();
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
    ws.addEventListener("close", () => {
        console.log("DISCONNECTED");
    });

    // ensure the socket will close on page redirection
    window.addEventListener("pagehide", () => ws.close());
    window.addEventListener("unload", () => ws.close())

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

//--- EXPORTS -----------------------------------------------------------------

export const ws_client = {
    init, 
    send,
    uri,
    msg_types,
    game_types
};