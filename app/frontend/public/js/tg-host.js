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

import {ws_client} from "./ws-client.js"

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
        case ws_client.msg_types.QUESTION:
            handle_question();
            break;
        case ws_client.msg_types.CHOICES:
            handle_choices();
            break;
        case ws_client.msg_types.READY:
            handle_ready();
            break;
        case ws_client.msg_types.CLOSE:
            handle_close();
            break;
        case ws_client.msg_types.RESULTS:
            handle_results();
            break;
        case ws_client.msg_types.DONE:
            handle_done();
            break;
        case ws_client.msg_types.ERROR:
            handle_error(data.message);
            break;
        default:
            console.log(`Unfamiliar message received:`);
            console.log(data);
            break;
    }
};

//--- SPECIFIC SIGNALS --------------------------------------------------------

function handle_question() {

}

function handle_choices() {

}

function handle_ready() {

}

function handle_close() {

}

function handle_results() {

}

function handle_done() {

}

function handle_error(msg) {
    console.log(msg);
}

//--- SIGNAL SENDERS ----------------------------------------------------------

function send_join(ws, code) {
    const data = {
        type: ws_client.msg_types.JOIN,
        body: {
            game_type: ws_client.types.TEACHING,
            game_code: JSON(code)
        }
    };
    ws.send(JSON.stringify(data));
}

function send_start() {

}

function send_continue() {

}

//--- BUTTON CALLBACKS --------------------------------------------------------

//--- BEGIN SCRIPT ------------------------------------------------------------

// first attempt to create a room
const fetchData = {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({type: "teaching"})
};

// initiate the game
fetch("/api/games", fetchData)
.then((res) => {
    if(!res.ok) {
        throw new Error("Failed to create game");
    }

    return res.json();
})
.then((data) => {
    const code = data.code;

    if(!code) {
        throw new Error("Did not receive code from server");
    }
    return fetch(`/api/games/${code}`);
})
.then((res) => {
    if(!res.ok) {
        throw new Error(`No game exists for ${code}`);
    }

    console.log(`Game created: ${code}; initiating Websocket connection`)
    // initiate websocket connection to this code
    const ws = new WebSocket(ws_client.uri);

    // setup handlers
    ws_client.init(ws, handler);

    // initiate joining the game as host
    send_join(ws, code);
})
.catch((e) => {
    console.log(`Error attempting to initiate game: ${e}`);
});





