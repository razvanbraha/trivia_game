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

// Time until any session automatically expires, regardless of state
const SESSION_AUTO_EXPIRE_TIME = 30 * 60 * 1000; // 30mins(ms)

// Time between sessions automatically checking for expired sessions
const SESSION_EXPIRE_CHECK_TIME = 2 * 60 * 1000; // 2mins(ms)

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
 * Creates a game session of a given type running on a new thread
 * @author Connor Hekking
 * @return The code of the newly created session
 */
const createSession = (type) => {
    //TODO threads not implemented

    let session_data = {
        game_code: generateRoomCode(),
        game_type: type,
        start_time: Date.now(),
    };

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
    const code = data.code;
    const as = data.as;
    const name = data.name;
    
    // game-type agnostic: only matters to the code that runs the game
    // similarly, the code that runs the game doesn't care what session code
    // the game is hosted at
    if(code in sessions) {
        sessions[code].join(ws, as, name);
        return true;
    }
    return false;
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
 * Removes any sessions from memory which are ended, or have gone on too long.
 * @author Connor Hekking
 * @param {teachingGame} session the session to remove
 */
const removeSessions = () => {
    const now = Date.now();
    sessions.forEach((session) => {
        if(session.state == teachingGame.STATES.ENDED) {
            // Remove from sessions memory
            const idx = sessions.findIndex(s => s.code === session.code);
            if(idx > -1) {
                sessions.splice(idx, 1);
            }
        } else if(now - session.start_time > SESSION_AUTO_EXPIRE_TIME) {
            try {
                // Tell game to clear its own memory
                session.endGame(null, null);
            } catch (e) {
                console.log(`Failed to end expired session: ${e}`);
            }
            // Remove from sessions memory
            const idx = sessions.findIndex(s => s.code === session.code);
            if(idx > -1) {
                sessions.splice(idx, 1);
            }
        }
    })
    
}

//--- ALWAYS RUNNING -----------------------------------------------------------------

const sessionsRemover = setInterval(removeSessions, SESSION_EXPIRE_CHECK_TIME);

//--- EXPORTS -----------------------------------------------------------------

exports.sessionExists = sessionExists;
// Export create/join for websocket-server to use
exports.createSession = createSession;
exports.joinSession = joinSession;