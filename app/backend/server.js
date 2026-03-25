const express = require("express");
const path = require("node:path");
const dbAPI = require('./rest_api/dbAPI');
const userAPI = require('./rest_api/userAPI');
const geminiAPI = require('./rest_api/geminiAPI');
const roomAPI = require("./rest_api/roomAPI");

const { setupQuestions } = require("./db_queries/questions-db");
const { setupUsers } = require('./db_queries/user-db')

const app = express();
module.exports = app;
const PORT = 8080;

app.use("/public", express.static(path.join(__dirname, "../frontend/public")));
app.use(express.json());
app.use("/questions", dbAPI);
app.use("/users", userAPI);
app.use("/room", roomAPI);
app.use("/ai", geminiAPI);

app.get("/teacher", (req, res) => {
    const user = req.headers["remote-user"];

    if (!user) {
        return res.status(401).send("Unauthorized");
    }

    res.send(`
        <h1>Welcome Professor ${user}</h1>
    `);
});

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

if (require.main === module) {
    startServer();
}