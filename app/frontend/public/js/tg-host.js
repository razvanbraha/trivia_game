//--- HEADER ------------------------------------------------------------------
/**
 * @file host.js
 * 
 * @author Will Mungas
 * 
 * Script to run on the host version of the teaching game page
 *  
 */
//--- INCLUDE -----------------------------------------------------------------

import {ws_client} from "../websocket-client.js"

//--- SETUP -------------------------------------------------------------------

const game_states = {
    LOBBY: 0,
    WAITING: 1,
    QUESTION_SERVED: 2,
    ANSWERS_SERVED: 3,
    RESPONSE_LIVE: 4,
    RESPONSE_SENT: 5,
    RESPONSE_CLOSED: 6
};

let current_state = game_states.LOBBY;

const question_html = 
`
`;

const answer_html = 
`
`;

//--- MAIN SIGNAL HANDLER -----------------------------------------------------
/**
 * @author Will Mungas
 * Handles all incoming (server) websocket signals
 * 
 * @param {*} data data received from the websocket
 */
function handler(data) {
    switch(data.type) {
        case "QUESTION":

        case "CHOICES":
        
        case "READY":

        case "CLOSE":

        case "RESULTS":

        case "DONE":
    }
};

//--- SPECIFIC SIGNALS --------------------------------------------------------

function handle_question() {

}

function handle_error() {

}

//--- SCRIPT ------------------------------------------------------------------

// first get the code from localStorage
const code = localStorage.getItem("code");
if(!code) {
    // if nothing was stored in localStorage
    // you have arrived at this page without creating a game
    console.log("unable to join game; have you created one?");
}

// initiate websocket connection to this code
const ws = new WebSocket(ws_client.uri);

// setup handlers
ws_client.init(ws, handler);

// initiate joining the game as host
ws.send(JSON.stringify(
    {
        type: "JOIN",
        body: {
            game_type: ws_client.types.TEACHING,
            game_code: JSON(code)
        }
    }
));



