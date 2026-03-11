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

const templates_dir = path.join(__dirname, "../../frontend/templates");

const router = express.Router();

//--- ROUTES ------------------------------------------------------------------

router.get("/teacher-host", (req, res) => {
    res.send(path.join(templates_dir, "tg-host.html"));
});

router.get("/teacher-play", (req, res) => {
    res.send(path.join(templates_dir, "tg-play.html"));

});

router.get("/multi-host", (req, res) => {
    res.send(path.join(templates_dir, "mg-host.html"));
});

// TODO implement pages for these routes

router.get("/multi-play", (req, res) => {
    res.send(path.join(templates_dir, "mg-play.html"));
});

router.get("/study", (req, res) => {
    res.send(path.join(templates_dir, "sg-play.html"));
});

//--- EXPORTS -----------------------------------------------------------------

module.exports = router;