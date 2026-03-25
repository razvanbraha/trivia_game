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

const templates_dir = path.join(__dirname, "../templates");

const student_page_router = express.Router();

//--- ROUTES ------------------------------------------------------------------

student_page_router.get("/home", (req, res) => {
    res.sendFile(path.join(templates_dir, "student-menu.html"));
});

//--- EXPORTS -----------------------------------------------------------------

module.exports = student_page_router;