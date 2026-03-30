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

//--- SIGNAL HANDLERS ---------------------------------------------------------

const handler = {};

handler[ws_api.signals.JOINED.id] = (ws, body) => {
    if(code !== body.code) {
        console.log(`Joined the wrong room!! In ${body.code}, should be in ${code}`);
    }
    console.log("Successfully joined!");
}

handler[ws_api.signals.REJECTED.id] = (ws, body) => {
    console.log(`Failed to join room ${body.code}; ouch, rejection hurts`);
}

//--- SCRIPT ------------------------------------------------------------------

let code = localStorage.getItem("room code");
console.log(`Code: ${code}`);

const ws = new WebSocket(ws_api.uri);

const body = { code, name: "player 1" };
ws_api.init(ws, ws_api.users.CLIENT, handler, () => {
    ws.expect()
    ws.signal(ws_api.signals.JOIN, body)
});

// callback for 

