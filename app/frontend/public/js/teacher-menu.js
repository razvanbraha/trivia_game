import {questionsManage, usersManage} from './main.js';

//Get Teacher Dashboard Buttons
const questionPageButton = document.querySelector("#questionsButton");
const userPageButton = document.querySelector("#usersButton");
const hostGameButton = document.querySelector("#launchButton");

//Set Teacher Dashboard Functions
questionPageButton.onclick = questionsManage;
userPageButton.onclick = usersManage;

hostGameButton.onclick = () => {
    const fetchData = {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({type: "teaching"})
    };

    // initiate the game
    fetch("/api/games", fetchData)
    .then((response) => {
        localStorage.setItem("code", response.body.code);
        window.location.href = "/games/teacher-host";
    });
    
}