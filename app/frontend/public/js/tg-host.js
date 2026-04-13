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
    RESPONSE_CLOSED: 6,
    RESULTS_SERVED: 7,
    FINAL_RESULTS_SERVED: 8
};

let current_state = game_states.LOBBY;

let code;
let players = [];
let ws;

// user-visible settings
//TODO: Need to change minimum settings, shouldn't be able to set time to 0 seconds, & shouldn't be able to start game with no players
let settings = {
    rounds: 0, // how many questions to send 
    categories: [], // which categories to pull from
    preview: 0, // question preview time
    dead: 0, // question dead time
    live: 0, // question live time
};


//--- SIGNAL HANDLERS ---------------------------------------------------------

// signal handler object: maps signal ids to a handler function
let handler = {};

function kick(name) {
    ws.expect(ws_api.signals.KICK, (success) => {
        console.log(success ? `Kicked ${name}` : `Failed to kick ${name}`);
        if(success) {
            players.splice(players.indexOf(name), 1);
            game_helpers.updatePlayers(players, kick);
        }
    });
    ws.signal(ws_api.signals.KICK, {name});
}

ws_api.support(handler, ws_api.signals.JOINEE, (ws, body) => {
    players.push(body.name);
    console.log(`Player ${body.name} joined; players:`, players);
    game_helpers.updatePlayers(players, kick);
});

ws_api.support(handler, ws_api.signals.QUESTION, (ws, body) => {
    if(current_state != game_states.WAITING && current_state != game_states.RESULTS_SERVED) {
        console.log("Host desync detected");
        ws.signal(ws_api.signals.ERR, {err: "Host desync detected."});
    }
    current_state = game_states.QUESTION_SERVED;

    game_helpers.createQuestion(body.text, body.preview);
});

ws_api.support(handler, ws_api.signals.CHOICES,  (ws, body) => {
    if(current_state != game_states.QUESTION_SERVED) {
        console.log("Host desync detected");
        ws.signal(ws_api.signals.ERR, {err: "Host desync detected."});
    }
    current_state = game_states.ANSWERS_SERVED;

    game_helpers.showAnswers(body.choices, settings.dead);
});

ws_api.support(handler, ws_api.signals.READY,  (ws, body) => {
    if(current_state != game_states.ANSWERS_SERVED) {
        console.log("Host desync detected");
        ws.signal(ws_api.signals.ERR, {err: "Host desync detected."});
    }
    current_state = game_states.RESPONSE_LIVE;

    game_helpers.answersClickable(settings.live, true, null);
});

ws_api.support(handler, ws_api.signals.DONE,  (ws, body) => {
    if(current_state != game_states.RESPONSE_LIVE) {
        console.log("Host desync detected");
        ws.signal(ws_api.signals.ERR, {err: "Host desync detected."});
    }
    current_state = game_states.RESPONSE_CLOSED;

    // TODO put function in button callbacks? may need to reorder the file
    game_helpers.showCorrectAnswer(-1, body.correct_idx, true, () => {
        ws.signal(ws_api.signals.CONTINUE, {});
    }, body.class_accuracy_percent);
});

ws_api.support(handler, ws_api.signals.RESULTS,  (ws, body) => {
    if(current_state != game_states.RESPONSE_CLOSED) {
        console.log("Host desync detected");
        ws.signal(ws_api.signals.ERR, {err: "Host desync detected."});
    }
    current_state = game_states.RESULTS_SERVED;

    game_helpers.showLeaderboard(body.data_you, body.data_all, true, body.category_accuracy, () => {
        current_state = game_states.WAITING;
        ws.signal(ws_api.signals.NEXTROUND, {});
    });
    
});

ws_api.support(handler, ws_api.signals.FINAL,  (ws, body) => {
    // TODO endgame statistics not implemented(low prio)
    if(current_state != game_states.WAITING && current_state != game_states.RESULTS_SERVED) {
        console.log("Host desync detected");
        ws.signal(ws_api.signals.ERR, {err: "Host desync detected."});
    }
    current_state = game_states.FINAL_RESULTS_SERVED;

    game_helpers.showEndLeaderboard(body.data_you, body.data_all, true, body.category_accuracy, null);
    
});

ws_api.support(handler, ws_api.signals.GAMEOVER,  (ws, body) => {
    if(current_state != game_states.FINAL_RESULTS_SERVED) {
        console.log("Host desync detected");
        ws.signal(ws_api.signals.ERR, {err: "Host desync detected."});
    }

    //TODO not implemented!!!!
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
                    game_helpers.createLobby(code, () => {
                        settings = game_helpers.getSettings();

                        current_state = game_states.WAITING;
                        ws.signal(ws_api.signals.START, {
                            rounds: settings.rounds,
                            categories: settings.categories,
                            preview: settings.preview,
                            dead: settings.dead,
                            live: settings.live
                        });
                    });
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