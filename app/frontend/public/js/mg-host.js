document.addEventListener("DOMContentLoaded", () => {
    let roomCode;

    async function createRoom() {
        const res = await fetch("/api/room/create", { method: "POST" });
        const data = await res.json();

        roomCode = data.code;
        document.getElementById("roomCode").innerText = roomCode;

        pollPlayers();
    }

    function pollPlayers() {
        setInterval(async () => {
            const res = await fetch(`/api/room/${roomCode}`);
            const data = await res.json();

            const playersHTML = data.players.length
                ? data.players.map(p => `<div>${p}</div>`).join("")
                : "<div>No players yet</div>";

            document.getElementById("players").innerHTML = playersHTML;
        }, 1000);
    }

    const slider = document.getElementById("questionSlider");
    const countDisplay = document.getElementById("questionCount");

    slider.addEventListener("input", () => {
        countDisplay.innerText = slider.value;
    });

    async function saveSettings() {
        const questions = slider.value;
        const categories = [...document.querySelectorAll("input[type=checkbox]:checked")]
            .map(c => c.value);

        await fetch(`/api/room/${roomCode}/settings`, {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ questions, categories })
        });
    }

    async function startGame() {
        await saveSettings();
        alert("Game starting!");
    }

    async function cancelRoom() {
        await fetch(`/api/room/${roomCode}`, { method: "DELETE" });
        window.location.href = "/api/";
    }

    const cancelRoomButton = document.querySelector("#cancelRoomButton")
    cancelRoomButton.onclick = cancelRoom;

    const startGameButton = document.querySelector("#startGameButton")
    startGameButton.onclick = startGame;

    createRoom();
});


