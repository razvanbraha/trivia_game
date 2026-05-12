const express = require("express");
const router = express.Router();

const rooms = {};

/**
 * Generate Code for hosted game
 * @author David Salinas
 * @returns room code
 */
function generateRoomCode() {
    let code;
    do {
        code = Math.floor(1000 + Math.random() * 9000).toString();
    } while (rooms[code]);
    return code;
}

/**
 * Generate unique room code and initialise room object
 * @author David Salinas
 * @returns json room code
 */
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

/**
 * Connect user to specified room
 * @author David Salinas
 * @param {Object} req.body.code - request body contains code of room to join
 * @param {Object} req.body.name - request body contains user name
 * @returns json success message
 * @throws Error 404 if unable to find room
 */
router.post("/join", (req, res) => {
    const { code, name } = req.body;

    if (!rooms[code]) {
        return res.status(404).json({ error: "Room not found" });
    }

    rooms[code].players.push(name);
    res.json({ success: true });
});

/**
 * Return room associated with given code
 * @author David Salinas
 * @param {Object} req.params.code - Code of room to find
 * @returns json room object
 * @throws Error 404 if unable to find room
 */
router.get("/:code", (req, res) => {
    const room = rooms[req.params.code];
    if (!room) return res.status(404).json({ error: "Room not found" });
    res.json(room);
});

/**
 * Update room settings
 * @author David Salinas
 * @param {Object} req.body - request body contains new room settings
 * @param {Object} req.params.code - Code of room to update
 * @returns json success message
 * @throws Error 404 if unable to find room
 */
router.post("/:code/settings", (req, res) => {
    const room = rooms[req.params.code];
    if (!room) return res.status(404).json({ error: "Room not found" });

    room.settings = req.body;
    res.json({ success: true });
});

/**
 * Delete Room
 * @author David Salinas
 * @param {Object} req.params.code - Code of room to delete
 * @param {Object} req.body.questionData - request body contains new question data
 * @returns json success message
 * @throws Error 404 if unable to find room
 */
router.delete("/:code", (req, res) => {
    delete rooms[req.params.code];
    res.json({ success: true });
});

module.exports = router;