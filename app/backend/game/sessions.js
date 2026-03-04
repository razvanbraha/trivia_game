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

//--- EXPORTS -----------------------------------------------------------------

// TODO add exports for use in gameAPI.js

//--- CONSTANTS ---------------------------------------------------------------

// 'enum' of all possible game types
const sessionTypes = {
    TEACHING: "teaching",
    MULTIPLAYER: "multiplayer",
    STUDY: "study"
};

//--- GLOBALS -----------------------------------------------------------------

// list of all open game sessions for the server to keep track of
const sessions = [];

//--- FUNCTIONS ---------------------------------------------------------------

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
 * @author Will Mungas
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