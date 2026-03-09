//--- HEADER ------------------------------------------------------------------
/** 
 * File teaching-game.js
 * 
 * Authors: Will Mungas, Connor Hekking
 * 
 * Script for a thread running a teaching game to execute - registers several 
 * callbacks to handle different events based on game state
 */ 
//--- INCLUDE -----------------------------------------------------------------

// TODO require() stuff
const {messages, sendWebSocketMessage, closeWebsocket, sendError} = require("../websocket-server");


//--- OBJECT ---------------------------------------------------------------
// Declare this file as an object to be able to use multiple instances of it
class teachingGame {

    //--- CONSTANTS ---------------------------------------------------------------

    static STATES = {
        LOBBY: 1, // lobby state - awaiting game start 
        SHOW_QUESTION: 2, // state of each turn when game reveals the question
        SHOW_ANSWERS: 3, // state of each turn when game reveals answer choices
        RECEIVE_RESPONSES: 4, // state of each turn when game accepts responses
        AWAIT_NEXT: 5, // state of each turn when game waits for teacher to proceed & shows player progress
        FINAL: 6, // final state: game shows final results & waits for game to end
        // After final state, game is closed out
    }

    //--- STATE DATA -----------------------------------------------------------------

    // Given by sessions
    code = null; // Game join code
    host = null; // the host WebSocket connection
    type = null; // Type of game (should be "teaching")

    state = 0; // the current state
    players = []; // list of player WebSocket connections
    questions = []; // List of questions to be used by the game
    current_question_idx = 0; // Index of current question in game(increment on "CONTINUE")
    answers = {}; // Dict[{socket(player): List(answer #)}] - list indicies correspond to questions list
    // -1 = no answer
    points = {}; // Dict{socket(player): int}

    //--- FUNCTIONS ---------------------------------------------------------------

    constructor(data) {
        initTeachingSession(data);
    }

    /**
     * Entry point for a teaching session thread: initializes data, registers
     * callbacks for all events, start waiting in "Lobby" state
     * @param {} data common session data
     */
    initTeachingSession(data) {
        code = data.code;
        host = data.host;
        type = data.type;
        state = 1;
        players = [];

        // TODO what to send back to host? anything?
    }

    /**
     * Handles processing an incoming WebSocket message from a user, validates
     * message format on our protocol
     * @param {WebSocket} socket 
     * @param {Object} message 
     */
    receiveMessage(socket, message) {
        // TODO other validation?
        try {
            const type = message.type;

            // Handle all messages
            switch(type) {
                case (messages.START):
                    if (state === STATES.LOBBY && socket === host) {
                        this.startGame(socket, message);
                    } else if(socket !== host) {
                        this.sendError(socket, "Only host can contiinue.");
                    } else {
                        this.sendError(socket, "Game has already started.");
                    }
                    break;
                case (messages.ANSWER):
                    if (state === STATES.RECEIVE_RESPONSES && socket !== host) {
                        this.registerAnswer(socket, message);
                    } else if(socket === host) {
                        this.sendError(socket, "Host cannot submit an answer.");
                    } else {
                        this.sendError(socket, "Game is not accepting answers.");
                    }
                    break;
                case (messages.CONTINUE):
                    if (state === STATES.AWAIT_NEXT && socket === host) {
                        this.advanceQuestion(socket, message);
                    } else if (state === STATES.FINAL && socket === host) {
                        this.endGame(socket, message);
                    } else if(socket !== host) {
                        this.sendError(socket, "Only host can contiinue.");
                    }
                    else {
                        this.sendError(socket, "Game has already started.");
                    }
                    break;
                default:
                    this.sendError(socket, "Message type is invalid.");
                    break;
            }
        } catch (error) {
            this.sendError(socket, "Message format is invalid.");
        }
        
    }

    /**
     * Handles player joining the game through a websocket connection
     * @param {WebSocket} socket
     */
    playerJoin(socket) {
        this.players.push(socket);
    }

    // TODO add event handlers for the various events give the game state
    // These will alter the game state and process user messages

    /**
     * Configures settings from message, gets list of questions from database,
     * and sends out the first question.
     * @param {WebSocket} socket 
     * @param {Object} message 
     */
    startGame(socket, message) {
        // TODO load settings(&validate) and start
    }

    /**
     * Registers a player's answer in the game state.
     * @param {WebSocket} socket 
     * @param {Object} message 
     */
    registerAnswer(socket, message) {
        // TODO
    }

    /**
     * Sends out next question.
     * @param {WebSocket} socket 
     * @param {Object} message 
     */
    advanceQuestion(socket, message) {
        // TODO
    }

    

    /**
     * Sends out DONE signal then closes all connections
     * @param {WebSocket} socket 
     * @param {Object} message 
     */
    endGame(socket, message) {
        this.state = STATES.FINAL;
        // Close host
        sendWebSocketMessage(this.host, {
            "type": messages.DONE,
        });
        closeWebsocket(this.host, 0, "Game finished.");
        // Close players
        this.players.forEach((player) => {
            sendWebSocketMessage(player, {
                "type": messages.DONE,
            });
            closeWebsocket(player, 0, "Game finished.");
        });
    }
}

//--- EXPORTS -----------------------------------------------------------------

// TODO add exports for other files
module.teachingGame = teachingGame;
