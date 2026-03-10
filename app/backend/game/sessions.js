//--- HEADER ------------------------------------------------------------------
/**
 * @file session.js
 * 
 * @author Will Mungas, Connor Hekking
 * 
 * Keeps track of game sessions and handles starting/joining games
 */
//--- INCLUDE -----------------------------------------------------------------

// TODO require() things
const {messages} = require("../websocket-server");
const {teachingGame} = require("./teaching-game");

//--- CONSTANTS ---------------------------------------------------------------

// 'enum' of all possible game types
const sessionTypes = {
    TEACHING: "teaching",
    MULTIPLAYER: "multiplayer",
    STUDY: "study"
};

// Possible code range
const code_range = 10000;

//--- GLOBALS -----------------------------------------------------------------

// list of all open game sessions for the server to keep track of
const sessions = [];

//--- FUNCTIONS ---------------------------------------------------------------

/**
 * Generates a unique room code
 * @author Connor Hekking
 */
function generateRoomCode() {
    const randomCode = () => {
        Math.floor(Math.random() * code_range);
    }
    let code = -1;
    let duplicate = true;

    // Generate random codes until one found which isn't taken
    while(duplicate) {
        code = randomCode();
        duplicate = sessions.some((session) => session.code === code);
    }

    return code;
}

/**
 * Creates an object with data common to all game sessions
 * @author Connor Hekking
 */
const createCommonSessionData = (host, type) => {
    return {
        code: generateRoomCode(),
        host: host,
        type: type,
    };
};

/**
 * Checks if authentication token is valid
 * @author Connor Hekking
 */
const isTokenValid = (auth_token) => {
    // TODO implement
    return true;
};

/**
 * Creates a game session of a given type running on a new thread
 * @author Connor Hekking
 * @param {WebSocket} ws the websocket of the new game session host
 * @param {Object} data the data of the request to create the new session
 * @return true/false whether the creation was successful
 */
const createSession = (ws, data) => {
    //TODO threads not implemented
    const type = data.game_type;
    const auth_token = data.auth_token;
    
    if(!isTokenValid(auth_token)) {
        return false;
    }


    switch(type) {
        case sessionTypes.TEACHING:
            let session_data = createCommonSessionData(ws, sessionTypes.TEACHING);
            sessions.push(teachingGame(session_data)); 
            break;
        case sessionTypes.MULTIPLAYER:
            // TODO implement
            return false;
            break;
        case sessionTypes.STUDY:
            // TODO implement
            return false;
            break;
    }

    // start the thread, add data to sessions []
    return true;
};

/**
 * Joins an existing game session
 * @author Connor Hekking
 * @param {WebSocket} ws the websocket of the new game session host
 * @param {Object} data the data of the request to create the new session
 * @return true/false whether the creation was successful
 */
const joinSession = (ws, data) => {
    const code = data.game_code;
    const type = data.game_type;

    switch(type) {
        case sessionTypes.TEACHING:
            let found_session = false;
            for(const session in sessions) {
                if(session.code === code && session.state === teachingGame.STATES.LOBBY) {
                    session.playerJoin(ws);
                    found_session = true;
                    break;
                }
            }
            return found_session;
            break;
        case sessionTypes.MULTIPLAYER:
            // TODO implement
            return false;
            break;
    }
}

//--- EXPORTS -----------------------------------------------------------------

// TODO add exports for use in gameAPI.js

// Export create/join for websocket-server to use
exports.createSession = createSession;
exports.joinSession = joinSession;