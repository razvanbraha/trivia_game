// major app dependencies
const express = require("express");
const path = require("node:path");
const http = require("http");

// Page route handlers
const teacher_pages = require("./pages/teacher-pages");
const student_pages = require("./pages/student-pages");
const game_pages = require("./pages/game-pages");

// API route handlers
const dbAPI = require('./rest_api/dbAPI');
const userAPI = require('./rest_api/userAPI');
const gameAPI = require('./rest_api/gameAPI');

// not sure why these are here?
const { setupQuestions } = require("./db_queries/questions-db");
const { setupUsers } = require('./db_queries/user-db')


// key routes
const templates_dir = path.join(__dirname, "../frontend/templates");
const static_dir = path.join(__dirname, "../frontend/public");

// port to run on 
const PORT = 8080;

// setup app
const app = express();

app.use(express.static(static_dir));
app.use(express.json());

// add page route handlers
app.use("/teacher", teacher_pages);
app.use("/student", student_pages);
app.use("/game", game_pages);

// add api route handlers
app.use("/api", dbAPI);
app.use("/api", userAPI);
app.use("/api", gameAPI);

app.get("/", (req, res) => {
    res.sendFile(path.join(templates_dir, "index.html"));
});

// Create http server that can be shared by express router AND websocket
const server = http.createServer(app);

async function startServer() {
    try {
        await setupQuestions();
        await setupUsers();
        server.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`)
        });
    } catch(err) {
        console.error("Startup failed:", err);
        process.exit(1);
    }
};


startServer();
const {startWebSocketServer} = require("./websocket-server");
function ws() {startWebSocketServer(server)}
setTimeout(ws, 500); // small delay so websocket connectes after server start
