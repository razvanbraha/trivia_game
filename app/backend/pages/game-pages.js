//-----------------------------------------------------------------------------
/**
 * @file game-pages.js
 * @author Will Mungas
 * 
 * Route handlers for the game-related pages
 */
//-----------------------------------------------------------------------------

const express = require("express");
const path = require("path");

const templates_dir = path.join(__dirname, "../templates");

const game_page_router = express.Router();

//--- ROUTES ------------------------------------------------------------------

game_page_router.get("/teacher-host", (req, res) => {
    res.sendFile(path.join(templates_dir, "tg-host.html"));
});

game_page_router.get("/teacher-play", (req, res) => {
    res.sendFile(path.join(templates_dir, "tg-play.html"));

});

game_page_router.get("/multi-host", (req, res) => {
    res.sendFile(path.join(templates_dir, "mg-host.html"));
});

// TODO implement pages for these routes

game_page_router.get("/multi-play", (req, res) => {
    res.sendFile(path.join(templates_dir, "mg-play.html"));
});

game_page_router.get("/study", (req, res) => {
    res.sendFile(path.join(templates_dir, "sg-play.html"));
});

//--- EXPORTS -----------------------------------------------------------------

module.exports = game_page_router;