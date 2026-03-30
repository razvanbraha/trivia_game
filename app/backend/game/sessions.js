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

// contains all sessions, keyed by code
const sessions = {};

//--- FUNCTIONS ---------------------------------------------------------------

/**
 * Generates a unique 4-character alphanumeric room code
 * @author Will Mungas
 */
function generateRoomCode() {
    const str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    // get a single random character from the above string
    const randomCharacter = () => {
        return str.charAt(Math.floor(Math.random() * str.length));
    }

    // generate a 4-character unique code string
    const randomCode = () => {
        return "" +
        randomCharacter() + 
        randomCharacter() + 
        randomCharacter() +
        randomCharacter();
    }

    let code = randomCode();
    while(code in sessions) {
        code = randomCode();
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

    const code = generateRoomCode();
    console.log(`Generated code ${code}`);

    const data = {
        code,
        type,
        start_time: Date.now(),
    };

    //TODO multiple game types
    if(type === sessionTypes.TEACHING) {
        sessions[code] = new teachingGame(data);
        console.log(`[Sessions]: added new session ${code}`);
    } else {
        return null;
    }

    return code;
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
    const name = data.name;
    
    // game-type agnostic: only matters to the code that runs the game
    // similarly, the code that runs the game doesn't care what session code
    // the game is hosted at
    if(code in sessions) {
        sessions[code].join(ws, name);
        return true;
    }
    return false;
}

const sessionExists = (code) => {
    return code && code in sessions;
}


/**
 * Removes any sessions from memory which are ended, or have gone on too long.
 * @author Connor Hekking
 * @param {teachingGame} session the session to remove
 */
const removeSessions = () => {
    const now = Date.now();

    for(const session in sessions) {
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
    }
}

//--- ALWAYS RUNNING -----------------------------------------------------------------

const sessionsRemover = setInterval(removeSessions, SESSION_EXPIRE_CHECK_TIME);

//--- EXPORTS -----------------------------------------------------------------

exports.sessionExists = sessionExists;
// Export create/join for websocket-server to use
exports.createSession = createSession;
exports.joinSession = joinSession;