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

//--- INTERNAL DATA 


let times = null;
let choice = -1;

//--- SIGNAL HANDLERS ---------------------------------------------------------

const handler = {};

// students will receive QUESTION, CHOICES, READY, and DONE
// students can send ANSWER

ws_api.support(handler, ws_api.signals.QUESTION, (ws, body) => {
    if(!times) {
        times = { preview: body.preview, dead: body.dead, live: body.live }
    }
    // display the question text
    game_helpers.createQuestion(body.text, times.preview);
});

ws_api.support(handler, ws_api.signals.CHOICES, (ws, body) => {
    // display the answer choices in addition to the question text
    // (preview at this point)
    game_helpers.showAnswers(body.choices, times.dead);
});

ws_api.support(handler, ws_api.signals.READY, (ws, body) => {
    // make answer choices selectable for the live time
    game_helpers.answersClickable(times.live, false, (idx) => {
        ws.signal(ws_api.signals.ANSWER, {idx});
    });
    
});

ws_api.support(handler, ws_api.signals.DONE, (ws, body) => {
    //TODO just filling in these methods for testing, needs state & error checking
    // show 
    game_helpers.showCorrectAnswer(body.data_you.answers.at(-1), body.correct_idx, false, null, body.class_accuracy_percent);
});

ws_api.support(handler, ws_api.signals.RESULTS, (ws, body) => {
    game_helpers.showLeaderboard(body.data_you, body.data_all, false, null);
});

ws_api.support(handler, ws_api.signals.FINAL, (ws, body) => {
    game_helpers.showEndLeaderboard(body.data_you, body.data_all, false, body.category_accuracy);
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

