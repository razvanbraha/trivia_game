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

import protocol from '../config/protocol.json' with {type: 'json'};
console.log("Read protocol", protocol);

//--- CONSTANTS ---------------------------------------------------------------

// websocket connection uri
const uri = "ws://127.0.0.1:8080";

//--- HELPER ------------------------------------------------------------------

/**
 * @author Will Mungas
 * @description Helper (not exported) to verify the body format for a signal
 * @param {*} type 
 * @param {*} body 
 * @returns true if the body is valid for the signal of the given type
 */
function verifyBody(signal, body) {
    let ret = true;
    const has = Object.keys(body); // keys in the body
    const needed = signal.fields;

    for(const key of needed) {
        if(!has.includes(key)) { // this is absolutely an error
            console.log(`Field ${key} missing`);
            console.log(`(required for signal ${signal.id})`);
            ret = false;
        }
        else {
            const idx = has.indexOf(key);
            has.splice(idx, 1);
        }
    }

    if(has.length !== 0) {
        // this is not necessarily an error, but should be logged
        console.log(`Extraneous fields (not required for signal ${signal.id}):`);
        for(const key of has) {
            console.log(key);
        }
    }
    if(!ret) {
        console.log(`Errors for body:`, body);
    }

    return ret;
}

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
        send(ws, protocol.signals.ACK, {msg: "hi"});
        first();
    });

    // handle error events
    ws.addEventListener("error", (e) => {
        console.log(`WS Error`);
        console.log(e);
    });

    // handle incoming messages - pass to handler function (implemented by each game)
    ws.addEventListener("message", (data) => receive(ws, handler, data));

    // handle close event
    ws.addEventListener("close", () => {
        console.log("DISCONNECTED");
    });

    // ensure the socket will close on page redirection
    window.addEventListener("pagehide", () => ws.close());
    window.addEventListener("unload", () => ws.close())

    console.log("client websocket initialized");
}

function receive(ws, handler, data) {
    const data_obj = JSON.parse(data.toString());
    const type = data_obj.type;
    const body = data_obj.body;

    if(!(type && type in protocol.signals)) {
        console.log(`Received signal with missing/invalid type:`, data_obj);
        return;
    }

    console.log(`Received signal ${type} with body`, body);
    const signal = protocol.signals[type];

    if(!verifyBody(signal, body)) {
        console.log(`Error: invalid body format for ${type}`);
        sendError(ws, `Invalid format for ${type}`);
        return;
    }

    if(signal === protocol.signals.ERROR) {
        console.log(`Server reports error: ${body.message}`);
        return;
    }
 
    if(signal === protocol.signals.ACK) {
        console.log(`Server sends ACK: ${body.msg}`);
        return;
    }

    if(!(handler && type in handler)) { // check that the handler can support this message type
        sendError(`Error: handler does not support ${type}`);
        return;
    }
    
    handler[type](body);
}

/**
 * @author Connor Hekking, Will Mungas
 * 
 * @description Logs messages and performs verification, then sends them over 
 * a websocket.
 * 
 * @param {*} ws websocket connection to send via
 * @param {String} type type of message (must be valid for a client)
 * @param {*} body body of message (must be in correct format)
 */
const send = (ws, signal, body) => {
    if(!signal) {
        console.log("Tried to send null signal");
        return false;
    }
    if(!(signal.id in protocol.signals)) {
        console.log(`Tried to send signal of invalid type ${signal.id}`);
        return false;
    }
    const sender = signal.sender;
    if(!(sender === "client" || sender === "all")) {
        console.log(`Tried to send unauthorized signal of type ${signal.id}`);
        console.log(`(must be sent by ${signal.sender})`);
        return false;
    }
    if(!verifyBody(signal, body)) {
        console.log(`Tried to send signal ${signal.id} with invalid body format`);
        return false;
    }
    if(ws.readyState === WebSocket.OPEN){
        ws.send(JSON.stringify({type: signal.id, body}));
        console.log(`Sent signal ${signal.id} with body`, body);
        return true;
    }
    return false;
}

/**
 * @author Will Mungas
 * @description send an error message on a websocket
 * @param {*} ws 
 * @param {*} err
 */
const sendError = (ws, err) => {
    send(ws, protocol.signals.ERROR, {err});
}

//--- EXPORTS -----------------------------------------------------------------

export const ws_client = {
    init, 
    send,
    uri,
    signals: protocol.signals,
    games: protocol.games
};