const express = require("express");
const router = express.Router();

const rooms = {};

function generateRoomCode() {
    let code;
    do {
        code = Math.floor(1000 + Math.random() * 9000).toString();
    } while (rooms[code]);
    return code;
}

router.post("/create", (req, res) => {
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

router.post("/join", (req, res) => {
    const { code, name } = req.body;

    if (!rooms[code]) {
        return res.status(404).json({ error: "Room not found" });
    }

    rooms[code].players.push(name);
    res.json({ success: true });
});

router.get("/:code", (req, res) => {
    const room = rooms[req.params.code];
    if (!room) return res.status(404).json({ error: "Room not found" });
    res.json(room);
});

router.post("/:code/settings", (req, res) => {
    const room = rooms[req.params.code];
    if (!room) return res.status(404).json({ error: "Room not found" });

    room.settings = req.body;
    res.json({ success: true });
});

router.delete("/:code", (req, res) => {
    delete rooms[req.params.code];
    res.json({ success: true });
});

module.exports = router;