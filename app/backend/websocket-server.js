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
const {WebSocketServer} = require("ws");

// Include sessions.js for starting/joining sessions
const {createSession, joinSession} = require("./game/sessions");

//--- CONSTANTS ---------------------------------------------------------------

// Websocket message types
// See API Endpoint Design - https://docs.google.com/document/d/12ijNjsGuGOg7Xqv12Mo_Kprgvlrn7opl86L4AKaVjaU/edit?usp=sharing
const messages = {
    INIT: 1,
    JOIN: 2,
    START: 3,
    QUESTION: 4,
    CHOICES: 5,
    READY: 6, 
    ANSWER: 7,
    CLOSE: 8, 
    CONTINUE: 9,
    RESULTS: 10,
    DONE: 11,
    ERROR: 12,
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

        ws.on("message", (data) => {
            if(data.toString() === "ping") {
                ws.send("pong");
                console.log("Ping recieved");
            } else {
                console.log(`Message recieved: ${data}`);
                // Catch any message format issues
                try {
                    const data_obj = JSON.parse(data);

                    // Report error and don't pass to session
                    if(data_obj.type === messages.ERROR) {
                        console.log(`Client reports error: ${data_obj.message}`);
                        return;
                    }
                
                    if(ws.handler === null) {
                        // Send to sessions to create/join
                        switch(data_obj.type) {
                            case messages.INIT:
                                res = createSession(ws, data_obj);
                                if(!res) {
                                    // Send error
                                    sendWebSocketMessage(ws, {
                                        "type": messages.ERROR,
                                        "message": "Session could not be created.",
                                    });
                                }
                                break;
                            case messages.JOIN:
                                res = joinSession(ws, data_obj);
                                if(!res) {
                                    // Send error
                                    sendWebSocketMessage(ws, {
                                        "type": messages.ERROR,
                                        "message": "Session could not be joined.",
                                    });
                                }
                                break;
                            default:
                                sendWebSocketMessage(ws, {
                                        "type": messages.ERROR,
                                        "message": "Message type is invalid.",
                                    });
                                break;
                        }
                    } else {
                        // Send to handler if exists
                        ws.handler.receiveMessage(ws, data_obj);
                    }
                } catch (e) {
                    sendWebSocketMessage(ws, {
                        "type": messages.ERROR,
                        "message": "Message format is invalid",
                    });
                }
            }
        });
    });
    console.log(`Websocket server running.`);
}


/**
 * Handles sending out a generic message with our protocol on a socket
 * @param {WebSocket} ws Client websocket to send to
 * @param {String} error_message error message text
 */
function sendWebSocketMessage(ws, message) {
    ws.send(JSON.stringify(message));
}

/**
 * Handles sending out an error message with our protocol on a socket
 * @param {WebSocket} socket Client websocket to send to
 * @param {String} error_message error message text
 */
function sendError(socket, error_message) {
    sendWebSocketMessage(socket, {
        "type": messages.ERROR,
        "message": error_message,
    });
}

/**
 * Handles closing out a websocket connection with a closing code and reason
 * @param {WebSocket} socket Client websocket to close
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
