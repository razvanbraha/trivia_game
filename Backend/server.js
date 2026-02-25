const express = require("express");
const path = require("node:path");

const app = express();
const PORT = 8080;

app.use(express.json());

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/html/index.html"));
});

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

app.listen(PORT, () =>
    console.log(`Server running at http://localhost:${PORT}`)
);