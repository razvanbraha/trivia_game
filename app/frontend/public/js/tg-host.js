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

import {ws_api} from "./ws-api.js"

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

// signal handler object: lists valid signals as keys
let handler = {};
handler[ws_client.signals.QUESTION.name] = handle_question;
handler[ws_client.signals.CHOICES.name] = handle_choices;
handler[ws_client.signals.READY.name] = handle_ready;
handler[ws_client.signals.DONE.name] = handle_done;
handler[ws_client.signals.RESULTS.name] = handle_results;
handler[ws_client.signals.GAMEOVER.name] = handle_gameover;

//--- SPECIFIC SIGNALS --------------------------------------------------------

function handle_question(body) {

}

function handle_choices(body) {

}

function handle_ready(body) {

}

function handle_done(body) {

}

function handle_results(body) {

}

function handle_gameover(body) {

}

//--- BUTTON CALLBACKS --------------------------------------------------------

//--- BEGIN SCRIPT ------------------------------------------------------------

// first attempt to create a room
const fetchData = {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({type: "teaching"})
};

// initiate the game:
fetch("/api/games", fetchData)
    .then((res) => {
        if(!res.ok) {
            throw new Error("Failed to create game");
        }
        console.log("Received response from server");
        return res.json();
    })
    .then((data) => {
        const code = data.code;

        if(!code) {
            throw new Error("Did not receive code from server");
        }
        console.log(`Game created with code ${code}; initiating Websocket connection`)
        
        // initiate websocket connection to this code
        const ws = new WebSocket(ws_client.uri);

        // JOIN signal contents
        const msg = { game_code: code, game_type: ws_client.games.TEACHING };

        // setup socket with handler, send JOIN signal upon open
        ws_client.init(ws, handler, () => ws_client.send(ws, ws_client.signals.JOIN, msg));
    })
    .catch((e) => {
        console.log(`Error starting game:`, e);
    });





