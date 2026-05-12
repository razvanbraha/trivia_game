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
const dbAPI = require('./rest-api/question');
const userAPI = require('./rest-api/user');
const gameAPI = require('./rest-api/game');
const geminiAPI = require('./rest-api/gemini');
// const roomAPI = require("./rest-api/room");

// game and websocket functions
const sessions = require('./game/sessions');
const ws_api = require('./ws-api');

// key routes
const templates_dir = path.join(__dirname, "../frontend/templates");
const static_dir = path.join(__dirname, "../frontend/public");

// internal port to run on 
const PORT = process.env.BACKEND_PORT;

//--- START APP ---------------------------------------------------------------

const app = express();
module.exports = app;
app.use("/public", express.static(static_dir));
app.get("/favicon.ico", (req, res) => {
    res.sendFile(path.join(static_dir, "images/favicon.ico"));
});
app.get("/apple-touch-icon.png", (req, res) => {
    res.sendFile(path.join(static_dir, "images/apple-touch-icon.png"));
});
app.use(express.json());
app.use("/questions", dbAPI);
app.use("/users", userAPI);
// app.use("/room", roomAPI);
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

//--- SET UP WEBSOCKETS -------------------------------------------------------

// basic handler that only supports the JOIN signal, for bootstrapping the
// initial connection to the server
const init_handler = {};
// add JOIN signal support
ws_api.support(init_handler, ws_api.signals.JOIN, (ws, body) => sessions.join(ws, body));

function setupWSS(server) {
    const wss = new WebSocketServer({ server });

    wss.on("connection", (ws) => {
        console.log("received incoming ws connection");
        ws_api.init(ws, ws_api.users.SERVER, init_handler, null);
    });
    
    console.log(`Websocket server running`);
}


//--- START SERVER --------------------------------------------------------

// Create http server that can be shared by express router AND websocket
const server = http.createServer(app);

// For testing - only start if running main(no need to start server if testing)
if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`Server running on internal port ${PORT}`);
        setupWSS(server);
    });
}
