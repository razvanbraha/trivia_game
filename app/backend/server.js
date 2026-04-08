require('dotenv').config();
// major app dependencies
const express = require("express");
const path = require("node:path");
const http = require("http");
const {WebSocketServer} = require("ws");

// Page route handlers
const teacher_pages = require("./pages/teacher-pages");
const student_pages = require("./pages/student-pages");
const game_pages = require("./pages/game-pages");

// API route handlers
const dbAPI = require('./rest_api/dbAPI');
const userAPI = require('./rest_api/userAPI');
const gameAPI = require('./rest_api/gameAPI');
const geminiAPI = require('./rest_api/geminiAPI');
const roomAPI = require("./rest_api/roomAPI");

// game and websocket functions
const sessions = require('./game/sessions');
const ws_api = require('./ws-api');

const { getByUnityId } = require('./db_queries/user-db')
const { setupQuestions } = require("./db_queries/questions-db");
const { setupUsers } = require('./db_queries/user-db')


// key routes
const templates_dir = path.join(__dirname, "../frontend/templates");
const static_dir = path.join(__dirname, "../frontend/public");

// port to run on 
const PORT = 8080;

//--- START APP ---------------------------------------------------------------

const app = express();
module.exports = app;
app.use("/public", express.static(path.join(__dirname, "../frontend/public")));
app.use(express.json());
app.use("/questions", dbAPI);
app.use("/users", userAPI);
app.use("/room", roomAPI);
app.use("/ai", geminiAPI);
app.use("/games", gameAPI);

// Pages paths
app.use("/teacher", teacher_pages);
app.use("/student", student_pages);
app.use("/play", game_pages);

//--- TOP-LEVEL ROUTES --------------------------------------------------------

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "./templates/index.html"));
});

//TODO remove, just for testing
app.get("/test-tg-templates", (req, res) => {
    res.sendFile(path.join(__dirname, "./templates/test-tg-templates.html"));
});

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

//--- SET UP WEBSOCKETS -------------------------------------------------------

// basic handler that only supports the JOIN signal, for bootstrapping the
// initial connection to the server
const init_handler = {};
// add JOIN signal support
ws_api.support(init_handler, ws_api.signals.JOIN, (ws, body) => sessions.join(ws, body));

function setupWSS(server) {
    const wss = new WebSocketServer({ server: server });

    wss.on("connection", (ws) => {
        ws_api.init(ws, ws_api.users.SERVER, init_handler, null);
    });
    console.log(`Websocket server running`);
}

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


//--- START SERVER --------------------------------------------------------

// Create http server that can be shared by express router AND websocket
const server = http.createServer(app);

async function startServer() {
    setupQuestions()
    .then(() => setupUsers())
    .then(() => server.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`)
        setupWSS(server);
    }))
    .catch((err) => {
        console.error("Startup failed:", err);
        process.exit(1);
    })
}


// For testing - only start if running main(no need to start server if testing)
if (require.main === module) {
    startServer();
}

