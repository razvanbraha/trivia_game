//--- HEADER ------------------------------------------------------------------
/**
 * @file websocket-server.js
 * 
 * @author Connor Hekking
 * 
 * Handles websocket server connections and routes messages
 */
//--- INCLUDE -----------------------------------------------------------------

// Include ws package for ability to use websocket server
const {WebSocket} = require("ws");

// Include sessions.js for starting/joining sessions
// const {joinSession} = require("./game/sessions");

// The above import needs to happen later(lazy import) so as not to cause circular dependency at build time.

//--- CONSTANTS ---------------------------------------------------------------


// Websocket signal types and info (for validation)
// See Protocol Design doc: https://docs.google.com/document/d/1AECEhSD00eCI4x1JvMkMOrN-8QpCe1HHBtuGOK77fag
const protocol = require("../protocol.json");
// console.log("TEST: check protocol.json inclusion", protocol);

//--- GLOBALS -----------------------------------------------------------------



//--- HELPERS -----------------------------------------------------------------


/**
 * @author Will Mungas
 * @description Helper (not exported) to verify the body format for a signal
 * @param {*} type 
 * @param {*} body 
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
 * Receives an incoming message: performs validation and handles response if
 * valid - passes to handler object unless message is type ERROR or ACK
 * 
 * @param {WebSocket} ws Websocket sending the message
 * @param {Object} data Data object from message
 * @returns 
 */
function receive(ws, handler, data) {
    // explicitly handle ping
    if(data.toString() === "ping") {
        ws.send("pong");
        console.log("Ping received");
        return;
    }
    
    let data_obj;
    
    try { 
        const data_str = data.toString();
        data_obj = JSON.parse(data_str);
        
    }
    catch(e) {
        console.log(`Error parsing JSON: ${data_str}`, e);
        console.log()
    }

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

    if(signal === protocol.signals.ACK) {
        console.log(`Client sends ACK: "${body.msg}"`);
        send(ws, protocol.signals.ACK, {msg: "hi :)"});
        return;
    }

    if(signal === protocol.signals.ERROR) {
        console.log(`Client reports error: ${body.message}`);
        return;
    }

    if(!(handler && type in handler)) { // check that the handler can support this message type
        sendError(`Error: handler does not support ${type}`);
        return;
    }
    
    handler[type](ws, body);        
}

/**
 * Handles sending out a generic message with our protocol on a socket
 * 
 * @param {WebSocket} ws Client websocket to send to
 * @param {*} signal signal object, must be from protocol.signals
 * @param {*} body body object of the signal
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
    if(!(sender === "server" || sender === "all")) {
        console.log(`Tried to send unauthorized signal of type ${signal.id}`);
        console.log(`(must be sent by ${signal.sender})`);
        return false;
    }
    if(!verifyBody(signal, body)) {
        console.log(`Tried to send signal ${signal.id} with invalid body format`);
        return false;
    }
    if(ws.readyState === WebSocket.OPEN){
        ws.send(JSON.stringify({type: signal.id, body}))
        console.log(`Sent signal ${signal.id} with body`, body);
        
        return true;
    }
    return false;
}

/**
 * Handles sending out an error message with our protocol on a socket
 * @param {WebSocket} ws Client websocket to send to
 * @param {String} err error message text
 */
function sendError(ws, err) {
    send(ws, protocol.signals.ERROR, {err});
}

/**
 * Handles closing out a websocket connection with a closing reason
 * @param {WebSocket} ws Client websocket to close
 * @param {String} reason closing message text
 */
function close(ws, reason) {
    ws.close(1000, reason);
}

//--- EXPORTS -----------------------------------------------------------------

// Export general websocket functions
module.exports = {
    send, 
    sendError,
    receive,
    close,
    signals: protocol.signals
};
