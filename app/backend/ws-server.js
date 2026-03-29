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
const {WebSocketServer, WebSocket} = require("ws");

// Include sessions.js for starting/joining sessions
// const {joinSession} = require("./game/sessions");

// The above import needs to happen later(lazy import) so as not to cause circular dependency at build time.

//--- CONSTANTS ---------------------------------------------------------------

// Websocket signal types and info (for validation)
// See Protocol Design doc: https://docs.google.com/document/d/1AECEhSD00eCI4x1JvMkMOrN-8QpCe1HHBtuGOK77fag
const signals = require('../frontend/public/js/signals.json');

//--- GLOBALS -----------------------------------------------------------------



//--- FUNCTIONS ---------------------------------------------------------------

/**
 * Starts a web socket server and initializes route handling for messages
 * @author Connor Hekking
 * @param {http.Server} server http server to link the websocket server to
 */
function startWebSocketServer(server) {

    const wss = new WebSocketServer({ server: server });

    wss.on("connection", (ws) => {
        // Establish client connection
        console.log(`Client connected.`);
        ws.on('error', console.error);
        ws.handler = null;
        ws.on("message", (data) => {onMessage(ws, data)});
    });
    console.log(`Websocket server running.`);
}

/**
 * Handles an incoming message
 * @param {WebSocket} ws Websocket sending the message
 * @param {Object} data Data object from message
 * @returns 
 */
function onMessage(ws, data) {
    // explicitly handle ping
    if(data.toString() === "ping") {
        ws.send("pong");
        console.log("Ping received");
        return;
    }
    
    console.log(`Message recieved: ${data}`);

    // Catch any message format issues
    const data_obj = JSON.parse(data.toString());
    const type = data_obj.type;
    const body = data_obj.body;

    if(!(type && type in signals)) {
        console.log(`Message type invalid: ${type}`);
        return;
    }

    if(!verifyBody(type, body)) {
        console.log(`Received signal ${type} with invalid body format`);
        return;
    }

    switch(type) {
        case protocol.signals.ERROR.name:
            console.log(`Client reports error: ${data_obj.message}`);
            break;
        case protocol.signals.JOIN.name:
            if(!joinSession(ws, body.code)) {
                sendError(ws, `Failed to join game session with code: ${data_obj.body.game_code}`);
            }
            break;
        default:
            if(!(ws.handler && type in ws.handler)) { // check that the handler can support this message type
                sendError(`Unsupported message type: ${type}`);
                break;
            }
            try {
                ws.handler[type](body);
            }
            catch(e){
                sendError(ws, e);
            }
            break;
    }
                
}

/**
 * Confirms that a message (incoming or outgoing has the correct body contents per the protocol)
 * @param {*} type 
 * @param {*} body 
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

/**
 * Handles sending out a generic message with our protocol on a socket
 * @param {WebSocket} ws Client websocket to send to
 * @param {String} error_message error message text
 */
function sendWebSocketMessage(ws, type, body) {
    if(!type in protocol.signals) {
        console.log(`Tried to send invalid message type ${type}`);
        return;
    }
    if(protocol.signals[type].sender !== "server") {
        console.log(`Tried to send unauthorized signal of type ${type}`);
        console.log(`(must be sent by ${protocol.signals[type].sender})`);
        return;
    }
    if(!verifyBody(type, body)) {
        console.log(`Tried to send signal ${type} with invalid body format`);
        return;
    }
    if(ws.readyState === WebSocket.OPEN){
        ws.send(JSON.stringify({type, body}));
    }
}

/**
 * Handles sending out an error message with our protocol on a socket
 * @param {WebSocket} ws Client websocket to send to
 * @param {String} msg error message text
 */
function sendError(ws, msg) {
    sendWebSocketMessage(ws, protocol.signals.ERROR.name, {message: msg});
}

/**
 * Handles closing out a websocket connection with a closing reason
 * @param {WebSocket} ws Client websocket to close
 * @param {String} reason closing message text
 */
function closeWebsocket(ws, reason) {
    ws.close(1000, reason);
}

//--- EXPORTS -----------------------------------------------------------------

// Export server start for use in server.js
exports.startWebSocketServer = startWebSocketServer;
// Export general websocket functions
exports.sendWebSocketMessage = sendWebSocketMessage;
exports.sendError = sendError;
exports.closeWebsocket = closeWebsocket;
// Export message types for use in games
exports.signals = protocol.signals;
