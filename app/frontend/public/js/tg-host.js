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

let ws;

// callback for 