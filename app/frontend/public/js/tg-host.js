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

import {ws_client} from "../websocket-client.js"

//--- SCRIPT -----------------------------------------------------------

// first get the code from localStorage
const code = localStorage.getItem("code");
if(!code) {
    // if nothing was stored in localStorage, you have arrived at this page without creating a game
    console.log("unable to join game; have you created one?");
}

// initiate websocket connection to this code
const ws = new WebSocket(ws_client.uri);

ws_client.init(ws, handler);

const handler = () => {

}

ws.send(JSON.stringify(
    {
        game_type: ws_client.types.TEACHING,
        game_code: JSON(code)
    }
))

// callbacks for websocket signals
