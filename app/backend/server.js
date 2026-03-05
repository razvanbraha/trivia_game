const express = require("express");
const path = require("node:path");
const http = require("http");
const dbAPI = require('./rest_api/dbAPI');
const userAPI = require('./rest_api/userAPI');
const gameAPI = require('./rest_api/gameAPI');

const { setupQuestions } = require("./db_queries/questions-db");
const { setupUsers } = require('./db_queries/user-db')

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/api", dbAPI);
app.use("/api", userAPI);
//app.use("/api", gameAPI);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/templates/index.html"));
});

// Create http server that can be shared by express router AND websocket
const server = http.createServer(app);

const rooms = {};

function generateRoomCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

app.post("/api/room/create", (req, res) => {
    const code = generateRoomCode();

    rooms[code] = {
        players: [],
        settings: {
            questions: 25,
            categories: ["Category 1","Category 2","Category 3"]
        }
    };

    res.json({ code });
});

app.post("/api/room/join", (req, res) => {
    const { code, name } = req.body;

    if (!rooms[code]) {
        return res.status(404).json({ error: "Room not found" });
    }

    rooms[code].players.push(name);
    res.json({ success: true });
});

app.get("/api/room/:code", (req, res) => {
    const room = rooms[req.params.code];
    if (!room) return res.status(404).json({ error: "Room not found" });
    res.json(room);
});

app.post("/api/room/:code/settings", (req, res) => {
    const room = rooms[req.params.code];
    if (!room) return res.status(404).json({ error: "Room not found" });

    room.settings = req.body;
    res.json({ success: true });
});

app.delete("/api/room/:code", (req, res) => {
    delete rooms[req.params.code];
    res.json({ success: true });
});

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
const ws = require("./websocket-server");
function startWebsocketServer() {ws(server)}
setTimeout(startWebsocketServer, 500); // small delay so websocket connectes after server start
