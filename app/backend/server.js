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
const geminiAPI = require('./rest_api/geminiAPI');
const roomAPI = require("./rest_api/roomAPI");

// not sure why these are here?
const { setupQuestions } = require("./db_queries/questions-db");
const { setupUsers } = require('./db_queries/user-db')


// key routes
const templates_dir = path.join(__dirname, "../frontend/templates");
const static_dir = path.join(__dirname, "../frontend/public");

// port to run on 
const PORT = 8080;

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
const {startWebSocketServer} = require("./ws-server");
function ws() {startWebSocketServer(server)}
setTimeout(ws, 500); // small delay so websocket connectes after server start
