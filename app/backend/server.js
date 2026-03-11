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
