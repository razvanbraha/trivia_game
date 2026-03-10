//--- HEADER ------------------------------------------------------------------
/**
 * @file gameAPI.js
 * 
 * @author Will Mungas, Connor Hekking
 * 
 * Handles game-related api routes. These give the user access to the following
 * functionality:
 * - initializing new games
 * - joining existing games
 * 
 * After calls to these routes, the user will be upgraded to a WebSocket 
 * connection for live communication. This uses our own simple protocol, which
 * is handled/implemented in files under 'app/backend/game/'. 
 */
//--- INCLUDE -----------------------------------------------------------------

const express = require('express');
const path = require("node:path");
const session = require("../game/sessions");
const e = require('express');

//--- EXPORTS -----------------------------------------------------------------

const game_router = express.Router();
game_router.use(express.json());
game_router.use(express.static(path.join(__dirname, "../../frontend/public")));
game_router.use(express.urlencoded({ extended: true }));


// --- FUNCTIONS --------------------------------------------------------------

game_router.get("/games", (req, res) => {
    
});

/**
 * Route handler to create a game session 
 * method: POST 
 * route: /api/games 
 * body: JSON {type: string}
 * @author Will Mungas
 */
game_router.post("/games", (req, res) => {
    const type = req.params.type;
    
    const code = session.createSession(type);

    // if a session was created, respond OK with the code
    if(code) {
        res.json(code);
        res.status(200);
    }
    // otherwise, respond that an internal server error occured
    else {
        res.status(500);
    }
});
