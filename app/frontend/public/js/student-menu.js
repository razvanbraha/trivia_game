
const joinRoomButton = document.querySelector('#joinRoomButton');
const launchMultiplayerButton = document.querySelector('#launchMultiplayerButton');
const launchStudyButton = document.querySelector('#launchStudyButton');

async function joinRoom() {
    const code = document.getElementById("roomCode").value;
    const name = prompt("Enter your name");

    if (!code || !name) return;

    const res = await fetch("/api/room/join", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ code, name })
    });

    if (res.ok) {
        alert("Joined room!");
    } else {
        alert("Room not found");
    }
}

function launchMultiplayer() {
    window.location.href = "../../templates/student-host.html";
}

function launchStudy() {
    alert("To be implemented");
}

joinRoomButton.onclick = joinRoom;
launchMultiplayerButton.onclick = launchMultiplayer;
launchStudyButton.onclick = launchStudy;
