//-----------------------------------------------------------------------------
/**
 * @file ws.js
 * @author Will Mungas, Connor Hekking
 * 
 * ES Module to provide a common interface for websocket messages using our
 * protocol, on both server and client side
 * 
 * Initially adapted from: 
 * https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications
 */
//--- CONSTANTS ---------------------------------------------------------------

const is_backend = typeof module !== 'undefined' && module.exports;

const games = {
    TEACHING: "teaching",
    MULTI: "multi",
    STUDY: "study"
}

const choices = {
    MIN: 0,
    MAX: 3,
    NONE: -1,
}

const users = {
    SERVER: "server",
    CLIENT: "client"
}

const signals = {
    // sent by either to report an error
    ERR: {
        id: "ERR",
        sender: "all",
        fields: [
            "err"
        ]
    },
    // initially sent by the client as an connection test
    ACK: { 
        id: "ACK",
        sender: "all",
        fields: [
            "msg"
        ]
    },
    // response message type, indicating what it is responding to,
    // and whether the result of that signal was success or not
    RES: {
        id: "RES",
        sender: "all",
        fields: [
            "to",
            "success"
        ]
    },
    // sent by a client wishing to join a game session
    JOIN: { 
        id: "JOIN",
        sender: "client",
        fields: [
            "code",
            "name"
        ]
    },
    // sent by the server when a client successfully joins a game session - confirms the joined session code
    JOINED: { 
        id: "JOINED",
        sender: "server",
        fields: [
            "code"
        ]
    },
    // sent by the server when a client fails to join a game session - confirms the code for the attempted join
    REJECTED: { 
        id: "REJECTED",
        sender: "server",
        fields: [
            "code"
        ]
    },
    // sent by the server to a host when a new player joins a session, with the player's name
    JOINEE: { 
        id: "JOINEE",
        sender: "server",
        fields: [
            "name"
        ]
    },
    // sent by a host client to kick a player of a given name from a game 
    // (causes the server to close that player's WebSocket connection)
    KICK: { 
        id: "KICK",
        sender: "client",
        fields: [
            "name"
        ]
    },
    // sent by a host client to tell the server to start the game
    START: {
        id: "START",
        sender: "client",
        fields: [
            "rounds",
            "categories",
            "preview",
            "dead",
            "live"
        ]
    },
    // sent by the server to give clients the text of a question
    QUESTION: {
        id:"QUESTION",
        sender: "server",
        fields: [
            "text",
            "num",
            "preview",
            "dead",
            "live", 
            "rounds"
        ]
    },
    // sent by the server to give clients the answer choices available for a question
    CHOICES: {
        id:"CHOICES",
        sender: "server",
        fields: [
            "choices"
        ]
    },
    // sent by the server to tell the player clients that it is now accepting ANSWER signals
    READY: {
        id: "READY",
        sender: "server",
        fields: []
    },
    // sent by a player client to give the server its selection of an answer choice
    ANSWER: {
        id: "ANSWER",
        sender: "client",
        fields: [
            "idx"
        ]
    },
    // sent by the server to tell player clients that it is no longer accepting ANSWER signals
    DONE: {
        id: "DONE",
        sender: "server",
        fields: [
            "correct_idx",
            "data_you", // {name, points, answers:List(answer idx)}
            "class_accuracy_percent" // Number
        ]
    },
    // sent by a host client to tell the server to continue to the next screen(results screen)
    CONTINUE: {
        id: "CONTINUE",
        sender: "client",
        fields: []
    },
    // sent by the server to give clients the results of a round of gameplay
    // you is used by player clients to report individual results
    // all is used by the host client to report overall results/leaderboards
    RESULTS: {
        id: "RESULTS",
        sender: "server",
        fields: [
            "data_you", // {name, points, latest_answer, List(answer #)}
            "data_all", // List({name, points, latest_answer, List(answer #)})
            "category_accuracy" // List({category_num, accuracy, num_correct, num_questions})
        ]
    },
    // sent by a host client to tell the server to continue to the next round of a game
    NEXTROUND: {
        id: "NEXTROUND",
        sender: "client",
        fields: []
    },
    // sent by the server to tell clients that the game has ended and report the final results
    FINAL: {
        id: "FINAL",
        sender: "server",
        fields: [
            "data_you", // {name, points, latest_answer, List(answer #)}
            "data_all", // List({name, points, latest_answer, List(answer #)})
            "category_accuracy" // List({category_num, accuracy, num_correct, num_questions})
        ]
    },
    // sent by a host client to tell the server to end a game
    // (terminates all WebSocket connections to that game session)
    GAMEOVER: {
        id: "GAMEOVER",
        sender: "server",
        fields: []
    },
}

// websocket connection uri
const uri = "ws://127.0.0.1:8080";

//--- HELPERS ------------------------------------------------------------------

/**
 * @author Will Mungas
 * @description Helper (not exported) to verify the body format for a signal
 * @param {*} type 
 * @param {*} body 
 * @returns true if the body is valid for the signal of the given type
 */
function validate(signal, body) {
    let ret = true;
    const has = Object.keys(body); // keys in the body
    const needed = signal.fields;

    for(const key of needed) {
        if(!has.includes(key)) { // this is absolutely an error
            console.log(`field ${key} missing`);
            console.log(`(required for signal ${signal.id})`);
            ret = false;
        }
        else {
            const idx = has.indexOf(key);
            has.splice(idx, 1);
        }
    }

    if(has.length !== 0) {
        // this is not necessarily an error, but should be logged
        console.log(`extraneous fields (not required for signal ${signal.id}):`);
        for(const key of has) {
            console.log(key);
        }
    }
    if(!ret) {
        console.log(`errors for body:`, body);
    }

    return ret;
}

/**
 * @author Will Mungas, Connor Hekking
 * @description Function to process incoming messages: performs
 * validation, then handles ACK and ERROR explicitly and passes all other 
 * signal types to the handler
 * @param {*} ws 
 * @param {*} handler 
 * @param {*} data 
 * @returns 
 */
function receive(ws, data) {
    const data_str = data.toString();
    let data_obj;
    try {
        data_obj = JSON.parse(data_str);
    }
    catch(e) {
        console.log(`error parsing data:`, data_str, e);
    }

    if(!(data_obj.type)) {
        console.log(`received signal without type:`, data_obj);
        return;
    }
    if(!(data_obj.body)) {
        console.log(`received signal without body:`, data_obj);
        return;
    }

    const type = data_obj.type;
    const body = data_obj.body;

    if(!(type in signals)) {
        console.log(`received signal with invalid type ${type}`);
        return;
    }

    console.log(`received signal ${type} with body`, body);
    const signal = signals[type];

    if(!validate(signal, body)) {
        console.log(`error: invalid body format for ${type}`);
        ws.err(`invalid format for ${type}`);
        return;
    }

    if(signal === signals.ERR) {
        console.log(`${ws.other} reports error: ${body.err}`);
        return;
    }
 
    if(signal === signals.ACK) {
        console.log(`${ws.other} acknowledges with: ${body.msg}`);
        return;
    }

    if(signal === signals.RES) {
        if(!ws.expecting) {
            return;
        }
        if(ws.expecting.to !== body.to) {
            console.log(`error: expected resfor ${ws.expecting.of}, but received ${body.of} result first`);
            return;
        }
        const success_str = body.success ? "SUCCESS" : "FAILURE";
        console.log(`${ws.other} responds to ${body.to} with ${success_str}`)
        const act = ws.expecting.act;
        ws.expecting = null;
        act(body.success);
        return;
    }

    // check whether the signal is in the general handler
    if(ws.handler && type in ws.handler) { // check that the handler can support this message type
        ws.handler[type](ws, body);
        return;
    }
    ws.err(`${ws.user} handler does not support ${type}`);
}

/**
 * @author Connor Hekking, Will Mungas
 * 
 * @description Logs messages and performs verification, then sends them over 
 * a websocket.
 * 
 * @param {*} ws websocket connection to send via
 * @param {String} type type of message (must be valid for a client)
 * @param {*} body body of message (must be in correct format)
 */
const signal = (ws, signal, body) => {
    if(!signal) {
        console.log("tried to send null signal");
        return false;
    }
    if(!(signal.id in signals)) {
        console.log(`tried to send signal of invalid type ${signal.id}`);
        return false;
    }
    // verify that we are allowed to send this signal
    const sender = signal.sender;
    if(!(sender === ws.user || sender === "all")) {
        console.log(`tried to send unauthorized signal of type ${signal.id}`);
        console.log(`(must be sent by ${signal.sender})`);
        return false;
    }
    if(!validate(signal, body)) {
        console.log(`tried to send signal ${signal.id} with invalid body format`);
        return false;
    }
    ws.send(JSON.stringify({type: signal.id, body}));
    console.log(`sent signal ${signal.id} with body`, body);
    return true;
}

//--- FUNCTIONS ---------------------------------------------------------------

/**
 * @author Connor Hekking, Will Mungas
 * 
 * Handles setting up event listeners on a new client websocket
 * 
 * @param {*} ws websocket to add event listeners to
 * @param {()} handler function to handle messages sent on the websocket
 * @param {()} first function to call on the open event 
 */
const init = (ws, user, handler, first) => {
    if(!(user === users.SERVER || user === users.CLIENT) ) {
        console.log(`invalid user: ${user}`);
        return;
    }

    ws.user = user;
    ws.other = user === users.SERVER ? users.CLIENT : users.SERVER;
    ws.expecting = null;

    ws.handler = handler;

    // attach api functions (mostly variations of signal() )
    ws.signal = (sig, body) => signal(ws, sig, body); 
    ws.respond = (sig, success) => signal(ws, signals.RES, {to: sig.id, success});
    ws.expect = (sig, action) => ws.expecting = {to: sig.id, act: action};
    ws.err = (err) => signal(ws, signals.ERR, {err});
    ws.kill = (reason) => ws.close(1000, reason);

    const add = is_backend ? "on" : "addEventListener";

    // handle open event
    ws[add]("open", () => {
        console.log(is_backend ? "user connected" : "connected!");
        signal(ws, signals.ACK, {msg: "hi"});
        if(first) {
            first();
        }
    });

    // handle error events
    ws[add]("error", (e) => {
        console.log(`WS ERROR`, e);
    });

    // handle incoming messages
    ws[add]("message", (data) => receive(ws, is_backend ? data : data.data));

    // handle close event
    ws[add]("close", (reason) => {
        console.log(`Connection closed:`, reason);
        console.log("DISCONNECTED");
    });

    ws.expecting = null;

    if(!is_backend) {
        // ensure the socket will close on page redirection
        window.addEventListener("pagehide", () => ws.close());
        window.addEventListener("unload", () => ws.close());
    }

    console.log(`${ws.user} websocket initialized`);
}

/**
 * @author Will Mungas
 * @description cleaner syntax for adding support to a handler object
 * @param {*} handler handler object 
 * @param {*} signal 
 * @param {(ws, body)} action callback to handle the signal 
 */
const support = (handler, signal, action) => {
    if(!(signal.id in signals)) {
        console.log(`Cannot support invalid signal ${signal.id}`);
    }
    handler[signal.id] = action;
}



//--- EXPORTS -----------------------------------------------------------------

const ws_api = {
    init, 
    support,
    uri,
    signals,
    choices,
    games,
    users
};

// handle browser and CommonJS availability
if (typeof module !== 'undefined' && module.exports) {
    // Node.js (CommonJS module)
    module.exports = ws_api;
} else {
    // Browser: attach to window object
    window.ws_api = ws_api;
}