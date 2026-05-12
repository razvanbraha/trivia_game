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

const shib_middleware = require('../middleware/shib-middeware');

//--- ROUTES ------------------------------------------------------------------


/**
 * Serve Question Management Page
 * @route GET /teacher/questions
 * @access Protected (Professor and TA)
 * @returns HTML page if authorized
 * @redirects to /teacher if not authenticated
 * @author David Salinas
 * @returns 403 if user lacks teacher privileges
 */
teacher_page_router.get("/questions", shib_middleware, (req, res) => {
    res.sendFile(path.join(templates_dir, "menu-question.html"));
});


/**
 * Serve User Management Page
 * @route GET /teacher/users
 * @access Protected (Professor and TA)
 * @returns HTML page if authorized
 * @redirects to /teacher if not authenticated
 * @author David Salinas
 * @returns 403 if user lacks teacher privileges
 */
teacher_page_router.get("/users", shib_middleware, (req, res) => {
    res.sendFile(path.join(templates_dir, "menu-user.html"));

});

// TODO implement pages for these routes

/**
 * Serve Teacher Menu Page
 * @route GET /teacher/home
 * @access Protected (Professor and TA)
 * @returns HTML page if authorized
 * @redirects to /teacher if not authenticated
 * @author David Salinas
 * @returns 403 if user lacks teacher privileges
 */
teacher_page_router.get("/home", shib_middleware, (req, res) => {
    res.sendFile(path.join(templates_dir, "dash-teacher.html"));
});

//--- EXPORTS -----------------------------------------------------------------

module.exports = teacher_page_router;