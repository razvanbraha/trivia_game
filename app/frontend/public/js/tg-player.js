//--- HEADER ------------------------------------------------------------------
/**
 * @file player.js
 * 
 * @author Will Mungas
 * 
 * Script to run on the player version of the teaching game pageS
 *  
 */
//--- INCLUDE -----------------------------------------------------------------

const ws_api = window.ws_api;
import game_helpers from './game-helpers.js';

//--- SIGNAL HANDLERS ---------------------------------------------------------

const handler = {};

// students will receive QUESTION, CHOICES, READY, and DONE
// students can send ANSWER

ws_api.support(handler, ws_api.signals.QUESTION, (ws, body) => {
    // display the question text
});

ws_api.support(handler, ws_api.signals.CHOICES, (ws, body) => {
    // display the answer choices in addition to the question text
    // (not yet selectable)
});

ws_api.support(handler, ws_api.signals.READY, (ws, body) => {
    // make answer choices selectable
});

ws_api.support(handler, ws_api.signals.DONE, (ws, body) => {
    // show 
});


//--- SCRIPT ------------------------------------------------------------------

let code = localStorage.getItem("room code");
console.log(`Code: ${code}`);

const ws = new WebSocket(ws_api.uri);

const body = { code, name: "player 1" };
ws_api.init(ws, ws_api.users.CLIENT, handler, () => {
    ws.expect(ws_api.signals.JOIN, (success) => {
        if(success) {
            console.log(`Successfully joined ${code}`);
            return;
        }
        console.log(`Rejected from ${code}`, "Ouch! Rejection hurts")
    });
    ws.signal(ws_api.signals.JOIN, body)
});

// callback for 

