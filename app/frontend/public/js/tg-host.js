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

const ws_api = window.ws_api;
import game_helpers from "./game-helpers.js";

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

let code;

//--- SIGNAL HANDLERS ---------------------------------------------------------

// signal handler object: maps si
let handler = {};

handler[ws_api.signals.JOINED.id] = (ws, body) => {
    if(code !== body.code) {
        console.log(`Joined the wrong room!! In ${body.code}, should be in ${code}`);
    }
    console.log("Successfully joined!");
}

handler[ws_api.signals.REJECTED.id] = (ws, body) => {
    console.log(`Failed to join room ${body.code}; ouch, rejection hurts`);
}

handler[ws_api.signals.JOINEE.id] = (ws, body) => {

}  

handler[ws_api.signals.QUESTION.id] = (ws, body) => {

};

handler[ws_api.signals.CHOICES.id] = (ws, body) => {

};

handler[ws_api.signals.READY.id] = (ws, body) => {

};

handler[ws_api.signals.DONE.id] = (ws, body) => {

};

handler[ws_api.signals.RESULTS.id] = (ws, body) => {

};

handler[ws_api.signals.GAMEOVER.id] = (ws, body) => {

};

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
        code = data.code;

        if(!code) {
            throw new Error("Did not receive code from server");
        }
        console.log(`Game created with code ${code}; initiating Websocket connection`)
        
        // initiate websocket connection to this code
        const ws = new WebSocket(ws_api.uri);

        // JOIN signal contents
        const body = { code, name: "host" };

        // setup socket with handler, send JOIN signal upon open
        ws_api.init(ws, ws_api.users.CLIENT, handler, () => ws_api.send(ws, ws_api.signals.JOIN, body));
    })
    .catch((e) => {
        console.log(`Error starting game:`, e);
    });