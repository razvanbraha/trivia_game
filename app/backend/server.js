require('dotenv').config();
const express = require("express");
const path = require("node:path");
const dbAPI = require('./rest_api/dbAPI');
const userAPI = require('./rest_api/userAPI');
const geminiAPI = require('./rest_api/geminiAPI');
const roomAPI = require("./rest_api/roomAPI");

const { getByUnityId } = require('./db_queries/user-db')
const { setupQuestions } = require("./db_queries/questions-db");
const { setupUsers } = require('./db_queries/user-db')

const app = express();
const PORT = 8080;

app.use("/public", express.static(path.join(__dirname, "../frontend/public")));
app.use(express.json());
app.use("/questions", dbAPI);
app.use("/users", userAPI);
app.use("/room", roomAPI);
app.use("/ai", geminiAPI);

/**
 * Serve Teacher Menu Page
 * @route GET /teacher-menu
 * @access Protected (Professor and TA)
 * @returns HTML page if authorized
 * @redirects to /teacher if not authenticated
 * @author David Salinas
 * @returns 403 if user lacks teacher privileges
 */
app.get("/teacher-menu", async (req, res) => {
    const user = req.headers["x-shib-uid"];

    if (!user) {
        return res.redirect("/teacher");
    }
    if (!(await isTeacher(req))) {
        return res.status(403).send("You need teacher/TA permission");
    }
    res.sendFile(path.join(__dirname, "/frontend/templates/teacher-menu.html"));
});

/**
 * Serve Question Management Page
 * @route GET /teacher-question-manage
 * @access Protected (Professor and TA)
 * @returns HTML page if authorized
 * @redirects to /teacher if not authenticated
 * @author David Salinas
 * @returns 403 if user lacks teacher privileges
 */
app.get("/teacher-question-manage", async (req, res) => {
    const user = req.headers["x-shib-uid"];

    if (!user) {
        return res.redirect("/teacher");
    }
    if (!(await isTeacher(req))) {
        return res.status(403).send("You need teacher/TA permission");
    }
    res.sendFile(path.join(__dirname, "/frontend/templates/teacher-question-manage.html"));
});

/**
 * Serve User Management Page
 * @route GET /teacher-user-manage
 * @access Protected (Professor and TA)
 * @returns HTML page if authorized
 * @redirects to /teacher if not authenticated
 * @author David Salinas
 * @returns 403 if user lacks teacher privileges
 */
app.get("/teacher-user-manage", async (req, res) => {
    const user = req.headers["x-shib-uid"];

    if (!user) {
        return res.redirect("/teacher");
    }
    if (!(await isTeacher(req))) {
        return res.status(403).send("You need teacher/TA permission");
    }
    res.sendFile(path.join(__dirname, "/frontend/templates/teacher-user-manage.html"));
});

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

async function startServer() {
    try {
        await setupQuestions();
        await setupUsers();
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`)
        });
    } catch(err) {
        console.error("Startup failed:", err);
        process.exit(1);
    }
};

startServer();
