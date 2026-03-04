//-----------------------------------------------------------------------------
/**
 * @file session.js
 * 
 * @author Will Mungas, Connor Hekking
 * 
 * Keeps track of game sessions and handles starting/joining games
 * 
 */
//-----------------------------------------------------------------------------

// list of all open game sessions for the server to keep track of
const sessions = [];

const sessionTypes = {
    TEACHING: "teaching",
    MULTIPLAYER: "multi",
    STUDY: "review"
};



/**
 * Creates an object with data common to all game sessions
 * @author Will Mungas
 */
const createCommonSessionData = () => {
    return {

    };
};

/**
 * Creates a game session of a given type running on a new thread
 * @param {String} type the type of session to create
 */
const createSession = (type) => {
    switch(type) {
        case sessionTypes.TEACHING:
            // TODO implement
            break;
        case sessionTypes.MULTIPLAYER:
            // TODO implement
            break;
        case sessionTypes.STUDY:
            // TODO implement
            break;
    }

    // start the thread, add data to sessions []
    return;
};

