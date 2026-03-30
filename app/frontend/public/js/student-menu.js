
const joinRoomButton = document.querySelector('#joinRoomButton');
const launchMultiplayerButton = document.querySelector('#launchMultiplayerButton');
const launchStudyButton = document.querySelector('#launchStudyButton');

async function joinRoom() {
    const code = document.getElementById("roomCode").value;
    // check that room is valid

    fetch(`/api/games/${code}`)
        .then((res) => {
            if(res.ok) {
                localStorage.setItem("room code", code);
                window.location.href = "/api/play/teaching/player";
            }
            else {
                console.log(res);
                console.error(`Session does not exist for ${code}`);
            }
        });
}

function launchMultiplayer() {
    window.location.href = "/api/play/multi-host";
}

function launchStudy() {
    alert("To be implemented");
}

joinRoomButton.onclick = joinRoom;
launchMultiplayerButton.onclick = launchMultiplayer;
launchStudyButton.onclick = launchStudy;
