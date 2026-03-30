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
import bootstrap_helpers from "./game-helpers.js";
import helpers from "./tg-helpers.js";

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
let players = [];
let ws;

//--- SIGNAL HANDLERS ---------------------------------------------------------

// signal handler object: maps signal ids to a handler function
let handler = {};

function kick(name) {
    ws.expect(ws_api.signals.KICK, (success) => {
        console.log(success ? `Kicked ${name}` : `Failed to kick ${name}`);
        if(success) {
            players.splice(players.indexOf(name), 1);
            bootstrap_helpers.updatePlayers(players, kick);
        }
    });
    ws.signal(ws_api.signals.KICK, {name});
}

ws_api.support(handler, ws_api.signals.JOINEE, (ws, body) => {
    players.push(body.name);
    console.log(`Player ${body.name} joined; players:`, players);
    bootstrap_helpers.updatePlayers(players, kick);
});

ws_api.support(handler, ws_api.signals.QUESTION, (ws, body) => {

});

ws_api.support(handler, ws_api.signals.QUESTION,  (ws, body) => {

});

ws_api.support(handler, ws_api.signals.CHOICES,  (ws, body) => {

});

ws_api.support(handler, ws_api.signals.READY,  (ws, body) => {

});

ws_api.support(handler, ws_api.signals.DONE,  (ws, body) => {

});

ws_api.support(handler, ws_api.signals.RESULTS,  (ws, body) => {

});

ws_api.support(handler, ws_api.signals.GAMEOVER,  (ws, body) => {

});

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
        ws = new WebSocket(ws_api.uri);

        // setup socket with handler
        ws_api.init(ws, ws_api.users.CLIENT, handler, () => {
            // JOIN signal contents
            const body = { code, name: "host" };

            // expect a RES to the JOIN
            ws.expect(ws_api.signals.JOIN, (success) => {
                if(success) {
                    console.log(`Successfully joined ${code}`);
                    bootstrap_helpers.createLobby(code);
                    return;
                }
                console.log(`Rejected from ${code}`, "Ouch! Rejection hurts")
            });
            ws.signal(ws_api.signals.JOIN, body);
        });
    })
    .catch((e) => {
        console.log(`Error starting game:`, e);
    });