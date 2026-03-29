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

import protocol from './signals.json' with {type: 'json'}

//--- CONSTANTS ---------------------------------------------------------------

// websocket connection uri
const uri = "ws://127.0.0.1:8080";

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
        console.log(`WS Error`);
        console.log(e);
    });

    // handle incoming messages - pass to handler function (implemented by each game)
    ws.addEventListener("message", (e) => {
        if(!(type && type in signals)) {
            console.log(`Message type invalid: ${type}`);
            return;
        }
    
        if(!verifyBody(type, body)) {
            console.log(`Received signal ${type} with invalid body format`);
            return;
        }

        if(type === protocol.signals.ERROR.name) {
            console.log(`Client reports error: ${data_obj.message}`);
            return;
        }

        if(!(ws.handler && type in handler)) { // check that the handler can support this message type
            sendError(`Unsupported message type: ${type}`);
            return;
        }

        try {
            handler[type](body);
        }
        catch(e){
            sendError(ws, e);
        }
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
 * @param {*} type
 * @param {*} body
 */
const send = (ws, type, body) => {
    if(!type in protocol.signals) {
        console.log(`Tried to send signal of invalid type ${type}`);
        return;
    }
    if(protocol.signals[type].sender !== "client") {
        console.log(`Tried to send unauthorized signal of type ${type}`);
        console.log(`(must be sent by ${protocol.signals[type].sender})`);
        return;
    }
    if(!verifyBody(type, body)) {
        console.log(`Tried to send signal ${type} with invalid body format`);
        return;
    }
    if(ws.readyState === WebSocket.OPEN){
        console.log(`Sent signal ${type} with ${body}`);
        ws.send(JSON.stringify({type, body}));
    }
}

/**
 * @author Will Mungas
 * @param {*} ws 
 * @param {*} msg 
 */
const sendError = (ws, msg) => {
    send(ws, protocol.signals.ERROR.name, {message: msg});
}

/**
 * @author Will Mungas
 * @param {*} type 
 * @param {*} body 
 * @returns true if the body is valid for the signal of the given type
 */
function verifyBody(type, body) {
    let ret;
    const has = Object.keys(body);
    const needed = [...protocol.signals[type].fields]; // performs a shallow copy
    for(const key of needed) {
        if(!has.includes(needed)) { // this is absolutely an error
            console.log(`Field ${key} missing`);
            console.log(`(required for signal ${type})`);
            ret = false;
        }
    }

    if(has.length !== 0) {
        // this is not necessarily an error, but should be logged
        console.log(`Extraneous fields (not required for signal ${type}):`);
        for(const key of has) {
            console.log(key);
        }
    }

    return ret;
}

//--- EXPORTS -----------------------------------------------------------------

export const ws_client = {
    init, 
    send,
    uri,
    signals: protocol.signals
};