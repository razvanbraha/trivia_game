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

//--- EXPORTS -----------------------------------------------------------------

// TODO add exports for other files

//--- CONSTANTS ---------------------------------------------------------------

const messages = {
// See API Endpoint Design - https://docs.google.com/document/d/12ijNjsGuGOg7Xqv12Mo_Kprgvlrn7opl86L4AKaVjaU/edit?usp=sharing
    INIT: 1,
    START: 2,
    QUESTION: 3,
    CHOICES: 4,
    READY: 5, 
    ANSWER: 6,
    CLOSE: 7, 
    CONTINUE: 8,
    RESULTS: 9,
    DONE: 10,
}

const states = {
    LOBBY: 1, // lobby state - awaiting game start 
    SHOW_QUESTION: 2, // state of each turn when game reveals the question
    SHOW_ANSWERS: 3, // state of each turn when game reveals answer choices
    RECEIVE_RESPONSES: 4, // state of each turn when game accepts responses
    AWAIT_NEXT: 5, // state of each turn when game waits for teacher to proceed & shows player progress
    FINAL: 6, // final state: game shows final results & waits for game to end
    // After final state, game is closed out
}

//--- GLOBALS -----------------------------------------------------------------

let state = ""; // the current state
let host = {}; // the host WebSocket connection
let players = []; // list of player WebSocket connections

//--- FUNCTIONS ---------------------------------------------------------------

/**
 * Entry point for a teaching session thread: initializes data, registers
 * callbacks for all events, start waiting in "Lobby" state
 * @param {} data common session data
 */
const initTeachingSession = (data) => {

}

/**
 * Handles sending out a message with our protocol on a socket
 * @param {} socket 
 * @param {*} message 
 */
const sendMessage = (socket, message) => {

}

/**
 * Handles processing an incoming WebSocket message from a user, validates
 * message format on our protocol
 * @param {} socket 
 * @param {*} message 
 */
const receiveMessage = (socket, message) => {

}

// TODO add event handlers for the various events give the game state
// These will alter the game state and process user messages

/**
 * Begins gameplay
 */
const startTeachingGame = () => {

}

