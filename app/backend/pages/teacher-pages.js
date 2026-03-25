//-----------------------------------------------------------------------------
/**
 * @file game-pages.js
 * @author Will Mungas
 * 
 * Route handlers for the teacher-reachable pages
 */
//-----------------------------------------------------------------------------

const express = require("express");
const path = require("path");

const templates_dir = path.join(__dirname, "../templates");

const teacher_page_router = express.Router();

// TODO add middleware to authenticate via shib before serving any of these
// pages

//--- ROUTES ------------------------------------------------------------------

teacher_page_router.get("/questions", (req, res) => {
    res.sendFile(path.join(templates_dir, "teacher-question-manage.html"));
});

teacher_page_router.get("/users", (req, res) => {
    res.sendFile(path.join(templates_dir, "teacher-user-manage.html"));

});

// TODO implement pages for these routes

teacher_page_router.get("/home", (req, res) => {
    res.sendFile(path.join(templates_dir, "teacher-menu.html"));
});

//--- EXPORTS -----------------------------------------------------------------

module.exports = teacher_page_router;