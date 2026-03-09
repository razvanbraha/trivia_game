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
                try {
                    const data_obj = JSON.parse(data);
                
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

                                break;
                        }
                    } else {
                        // Send to handler if exists
                        ws.handler.receiveMessage(ws, data_obj);
                    }
                } catch (e) {
                    sendWebSocketMessage(socket, {
                        "type": messages.ERROR,
                        "message": "Message format is invalid",
                    });
                }
            }
        });
    });
    console.log(`Websocket server running.`);
}

function sendWebSocketMessage(ws, message) {
    ws.send(JSON.stringify(message));
}

function closeWebsocket(ws, code, reason) {
    ws.close(code, reason);
}

//--- EXPORTS -----------------------------------------------------------------

// Export server start for use in server.js
exports.startWebSocketServer = startWebSocketServer;
// Export general send message function
exports.sendWebSocketMessage = sendWebSocketMessage;
// Export close websocket function
exports.closeWebsocket = closeWebsocket;
// Export message types for use in games
exports.messages = messages;
