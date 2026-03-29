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
// const ws_server = require('./game/ws-server');

// not sure why these are here?
const { setupQuestions } = require("./db_queries/questions-db");
const { setupUsers } = require('./db_queries/user-db')


// key routes
const templates_dir = path.join(__dirname, "../frontend/templates");
const static_dir = path.join(__dirname, "../frontend/public");

// port to run on 
const PORT = 8080;

//--- START APP ---------------------------------------------------------------

const app = express();
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

app.get("/teacher", (req, res) => {
    const user = req.headers["remote-user"];

    if (!user) {
        return res.status(401).send("Unauthorized");
    }

    res.send(`
        <h1>Welcome Professor ${user}</h1>
    `);
});

//--- SET UP WEBSOCKETS -------------------------------------------------------

// basic handler that only supports the JOIN signal, for bootstrapping the
// initial connection to the server
const init_handler = {};
// add JOIN signal support
init_handler[ws_api.signals.JOIN.id] = (ws, body) => {
    if(!sessions.joinSession(ws, body)) {
        ws_api.error(ws, "Failed to join");
    }
    ws_api.send(ws, ws_api.signals.ACK, {msg: `Let you into session ${body.game_code} :)`})
}

function setupWSS(server) {
    const wss = new WebSocketServer({ server: server });

    wss.on("connection", (ws) => {
        // Establish client connection
        ws_api.init(ws, ws_api.users.SERVER, null, null);
        // setup event listeners manually
        ws.on('error', console.error);
        ws.on("message", (data) => {ws_api.receive(ws, init_handler, data)});
    });
    console.log(`Websocket server running`);
}

//--- START SERVER --------------------------------------------------------

// Create http server that can be shared by express router AND websocket
const server = http.createServer(app);

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



