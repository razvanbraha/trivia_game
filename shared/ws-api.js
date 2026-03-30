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

const users = {
    SERVER: "server",
    CLIENT: "client"
}

const signals = {
    ACK: {
        id: "ACK",
        sender: "all",
        fields: [
            "msg"
        ]
    },
    JOIN: {
        id: "JOIN",
        sender: "client",
        fields: [
            "as",
            "code",
            "name"
        ]
    },
    JOINEE: {
        id: "JOINEE",
        sender: "server",
        fields: [
            "name"
        ]
    },
    KICK: {
        id: "KICK",
        sender: "client",
        fields: [
            "name"
        ]
    },
    START: {
        id: "START",
        sender: "client",
        fields: [
            "num_questions",
            "categories",
            "preview_time",
            "dead_time",
            "live_time"
        ]
    },
    QUESTION: {
        id:"QUESTION",
        sender: "server",
        fields: [
            "text",
            "num"
        ]
    },
    CHOICES: {
        id:"CHOICES",
        sender: "server",
        fields: [
            "choices"
        ]
    },
    READY: {
        id: "READY",
        sender: "server",
        fields: []
    },
    ANSWER: {
        id: "ANSWER",
        sender: "client",
        fields: [
            "answer_num"
        ]
    },
    DONE: {
        id: "DONE",
        sender: "server",
        fields: [
            "correct_answer_num",
            "data_you",
            "data_all"
        ]
    },
    CONTINUE: {
        id: "CONTINUE",
        sender: "client",
        fields: []
    },
    RESULTS: {
        id: "RESULTS",
        sender: "server",
        fields: []
    },
    GAMEOVER: {
        id: "GAMEOVER",
        sender: "client",
        fields: []
    },
    ERROR: {
        id: "ERROR",
        sender: "all",
        fields: [
            "err"
        ]
    }
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
            console.log(`Field ${key} missing`);
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
        console.log(`Extraneous fields (not required for signal ${signal.id}):`);
        for(const key of has) {
            console.log(key);
        }
    }
    if(!ret) {
        console.log(`Errors for body:`, body);
    }

    return ret;
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
        console.log(`Invalid user: ${user}`);
        return;
    }

    ws.user = user;
    ws.other = user === users.SERVER ? users.CLIENT : users.SERVER;

    // only add event listeners if this is the frontend: backend uses
    // Node on() function
    if(is_backend) {
        return;
    }

    // handle open event
    ws.addEventListener("open", () => {
        console.log(is_backend ? "client connected" : "connected!");
        send(ws, signals.ACK, {msg: "hi"});
        if(first) {
            first();
        }
    });

    // handle error events
    ws.addEventListener("error", (e) => {
        console.log(`WS Error`);
        console.log(e);
    });

    // handle incoming messages - pass to handler function (implemented by each game)
    ws.addEventListener("message", (data) => receive(ws, handler, data));

    // handle close event
    ws.addEventListener("close", () => {
        console.log("DISCONNECTED");
    });

    // ensure the socket will close on page redirection
    window.addEventListener("pagehide", () => ws.close());
    window.addEventListener("unload", () => ws.close())

    console.log("client websocket initialized");
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
function receive(ws, handler, data) {
    const data_str = is_backend ? data.toString() : data.data.toString();
    let data_obj;
    try {
        data_obj = JSON.parse(data_str);
    }
    catch(e) {
        console.log(`Error parsing data:`, data_str, e);
    }

    if(!(data_obj.type)) {
        console.log(`Received signal without type:`, data_obj);
        return;
    }
    if(!(data_obj.body)) {
        console.log(`Received signal without body:`, data_obj);
        return;
    }

    const type = data_obj.type;
    const body = data_obj.body;

    if(!(type in signals)) {
        console.log(`Received signal with invalid type ${type}`);
        return;
    }

    console.log(`Received signal ${type} with body`, body);
    const signal = signals[type];

    if(!validate(signal, body)) {
        console.log(`Error: invalid body format for ${type}`);
        sendError(ws, `Invalid format for ${type}`);
        return;
    }

    if(signal === signals.ERROR) {
        console.log(`${ws.other} reports error: ${body.message}`);
        return;
    }
 
    if(signal === signals.ACK) {
        console.log(`${ws.other} sends ACK: ${body.msg}`);
        return;
    }

    if(!(handler && type in handler)) { // check that the handler can support this message type
        console.log(`Error:`)
        sendError(`${ws.user} handler does not support ${type}`);
        return;
    }
    
    handler[type](ws, body);
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
const send = (ws, signal, body) => {
    if(!signal) {
        console.log("Tried to send null signal");
        return false;
    }
    if(!(signal.id in signals)) {
        console.log(`Tried to send signal of invalid type ${signal.id}`);
        return false;
    }
    const sender = signal.sender;
    if(!(sender === "client" || sender === "all")) {
        console.log(`Tried to send unauthorized signal of type ${signal.id}`);
        console.log(`(must be sent by ${signal.sender})`);
        return false;
    }
    if(!validate(signal, body)) {
        console.log(`Tried to send signal ${signal.id} with invalid body format`);
        return false;
    }
    ws.send(JSON.stringify({type: signal.id, body}));
    console.log(`Sent signal ${signal.id} with body`, body);
    return true;
}

/**
 * @author Will Mungas
 * @description send an error message on a websocket
 * @param {*} ws 
 * @param {*} err
 */
const error = (ws, err) => {
    send(ws, signals.ERROR, {err});
}

/**
 * @author Will Mungas
 * @param {*} ws 
 * @param {*} reason 
 */
const close = (ws, reason) => {
    ws.close(1000, reason);
}

//--- EXPORTS -----------------------------------------------------------------

const ws_api = {
    init, 
    send,
    receive,
    error,
    close,
    uri,
    signals,
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