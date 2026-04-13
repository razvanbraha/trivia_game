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
const sessions = require("../game/sessions");

//--- EXPORTS -----------------------------------------------------------------

const game_router = express.Router();
game_router.use(express.json());


// --- FUNCTIONS --------------------------------------------------------------

/**
 * Route handler to check if a game session exists
 * method: GET 
 * route: /api/games/:code 
 * @author Connor Hekking
 */
game_router.get("/:code", (req, res) => {
    const code = req.params.code.toUpperCase();

    // if the session exists, respond OK
    if(sessions.exists(code)) {
        res.status(200);
    }
    // otherwise, respond not found
    else {
        res.status(404);
    }
    res.send();
});

/**
 * Route handler to create a game session 
 * method: POST 
 * route: /api/games 
 * body: JSON {type: string}
 * @author Will Mungas
 */
game_router.post("/", (req, res) => {
    const type = req.body.type;
    
    const code = sessions.create(type);

    // if a session was created, respond OK with the code
    if(code) {
        res.status(200).json({code: code});
    }
    // otherwise, respond that an internal server error occured
    else {
        res.status(500).send();
    }
});

module.exports = game_router;
