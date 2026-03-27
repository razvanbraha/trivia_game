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

// Websocket message types
// See API Endpoint Design - https://docs.google.com/document/d/12ijNjsGuGOg7Xqv12Mo_Kprgvlrn7opl86L4AKaVjaU/edit?usp=sharing
const messages = {
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
}

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
    try {
        const data_obj = JSON.parse(data.toString());

        // Report error and don't pass to session
        if(data_obj.type === messages.ERROR) {
            console.log(`Client reports error: ${data_obj.message}`);
            return;
        }

        // may want to explicitly handle low-level messages like joining the game first
        // HERE

        // defer to the game, if the game accepts this type of message
        if(ws.handler && ws.accepts(data_obj.type)) {
            ws.handler(ws, data_obj);
            return;
        }
    
        // TODO move up, default just becomes the last in a chain of if-x-y()-return
        // Otherwise handle a few root level messages
        switch(data_obj.type) {
            case messages.JOIN:
                const {joinSession} = require("./game/sessions");
                if(!joinSession(ws, data_obj)) {
                    sendError(ws, `Failed to join game session with code: ${data_obj.body.game_code}`);
                }
                break;
            default:
                sendError(ws, "Message type is invalid.");
                break;
        }
    } catch (e) {
        // This catches any cascading error from joinSession, or handler.
        sendError(ws, "Message format is invalid.");
    }
}


/**
 * Handles sending out a generic message with our protocol on a socket
 * @param {WebSocket} ws Client websocket to send to
 * @param {String} error_message error message text
 */
function sendWebSocketMessage(ws, message) {
    if(ws.readyState === WebSocket.OPEN){
        ws.send(JSON.stringify(message));
    }
}

/**
 * Handles sending out an error message with our protocol on a socket
 * @param {WebSocket} ws Client websocket to send to
 * @param {String} error_message error message text
 */
function sendError(ws, error_message) {
    sendWebSocketMessage(ws, {
        "type": messages.ERROR,
        "message": error_message,
    });
}

/**
 * Handles closing out a websocket connection with a closing code and reason
 * @param {WebSocket} ws Client websocket to close
 * @param {Number} code closing message code
 * @param {String} reason closing message text
 */
function closeWebsocket(ws, code, reason) {
    ws.close(code, reason);
}

//--- EXPORTS -----------------------------------------------------------------

// Export server start for use in server.js
exports.startWebSocketServer = startWebSocketServer;
// Export general websocket functions
exports.sendWebSocketMessage = sendWebSocketMessage;
exports.sendError = sendError;
exports.closeWebsocket = closeWebsocket;
// Export message types for use in games
exports.messages = messages;
