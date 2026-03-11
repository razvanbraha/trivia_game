//-----------------------------------------------------------------------------
/**
 * @file student-pages.js
 * @author Will Mungas
 * 
 * Route handlers for the student-reachable pages
 */
//-----------------------------------------------------------------------------

const express = require("express");
const path = require("path");

const templates_dir = path.join(__dirname, "../../frontend/templates");

const router = express.Router();

//--- ROUTES ------------------------------------------------------------------

router.get("/home", (req, res) => {
    res.send(path.join(templates_dir, "student-menu.html"));
});

//--- EXPORTS -----------------------------------------------------------------

module.exports = router;