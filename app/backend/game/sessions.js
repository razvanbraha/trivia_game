//--- HEADER ------------------------------------------------------------------
/**
 * @file session.js
 * 
 * @author Will Mungas, Connor Hekking
 * 
 * Keeps track of game sessions and handles starting/joining games
 */
//--- INCLUDE -----------------------------------------------------------------

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
    const randomCode = () => Math.floor(Math.random() * code_range);
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
const createCommonSessionData = (type) => {
    return {
        game_code: generateRoomCode(),
        game_type: type,
    };
};

/**
 * Creates a game session of a given type running on a new thread
 * @author Connor Hekking
 * @return The code of the newly created session
 */
const createSession = (type) => {
    //TODO threads not implemented

    let session_data = createCommonSessionData(type);
    //TODO multiple game types
    if(type === sessionTypes.TEACHING) {
        sessions.push(new teachingGame(session_data)); 
    } else {
        return null;
    }
    

    return session_data.game_code;
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
            for(const session of sessions) {
                if(session.code === code && session.state === teachingGame.STATES.LOBBY) {
                    session.join(ws);
                    found_session = true;
                    break;
                }
            }
            return found_session;
        case sessionTypes.MULTIPLAYER:
            // TODO implement
            return false;
        default:
            return false;
    }
}

/**
 * Checks if a game session exists with a given code
 * @author Connor Hekking
 * @param {Number} code the code to check
 * @return true/false whether the game session exists
 */
const sessionExists = (code) => {
    const exists = sessions.some((session) => 
        (session.code === code && session.state === teachingGame.STATES.LOBBY)
    );
    return exists;
}

/**
 * Removes a session from memory
 * @author Connor Hekking
 * @param {teachingGame} session the session to remove
 */
const removeSession = (session) => {
    const idx = sessions.findIndex(s => s.code === session.code);
    if(idx > -1) {
        sessions.splice(idx, 1);
    }
}

//--- EXPORTS -----------------------------------------------------------------

exports.sessionExists = sessionExists;
// Export create/join for websocket-server to use
exports.createSession = createSession;
exports.joinSession = joinSession;
exports.removeSession = removeSession;