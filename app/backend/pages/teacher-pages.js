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

/**
 * Determines if the current user has teacher privileges
 * Checks developer list and shibboleth primary affiliation
 * 
 * @param {Object} req - Express request object
 * @author David Salinas
 * @returns {Boolean} true if user is teacher/authorized, false otherwise
 */
async function isTeacher(req) {
    const uid = req.headers["x-shib-uid"];
    const primary = req.headers["x-shib-primary"]

    const devUsers = ["drsalin2", "wrmungas", "rmaalay", "rkwicken", "rbraha", "clhekkin"];
    if (devUsers.includes(uid)) {
        return true;
    }
    if (primary == "faculty") {
        return true;
    }
    try {
        const userArr = await getByUnityId(uid);
        const user = Array.isArray(userArr) ? userArr[0] : userArr;
        if(user && user.userPriv) {
            return true;
        }
    } catch (err) {
        console.error("Error checking user privileges: ", err);
    }
    return false;
}

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
teacher_page_router.get("/questions", async (req, res) => {
    const user = req.headers["x-shib-uid"];

    if (!user) {
        return res.redirect("/teacher");
    }
    if (!(await isTeacher(req))) {
        return res.status(403).send("You need teacher/TA permission");
    }

    res.sendFile(path.join(templates_dir, "teacher-question-manage.html"));
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
teacher_page_router.get("/users", async (req, res) => {
    const user = req.headers["x-shib-uid"];

    if (!user) {
        return res.redirect("/teacher");
    }
    if (!(await isTeacher(req))) {
        return res.status(403).send("You need teacher/TA permission");
    }
    
    res.sendFile(path.join(templates_dir, "teacher-user-manage.html"));

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
teacher_page_router.get("/home", async (req, res) => {
    const user = req.headers["x-shib-uid"];

    if (!user) {
        return res.redirect("/teacher");
    }
    if (!(await isTeacher(req))) {
        return res.status(403).send("You need teacher/TA permission");
    }

    res.sendFile(path.join(templates_dir, "teacher-menu.html"));
});

//--- EXPORTS -----------------------------------------------------------------

module.exports = teacher_page_router;