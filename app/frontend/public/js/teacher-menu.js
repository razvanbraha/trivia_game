import {questionsManage, usersManage} from './main.js';

//Get Teacher Dashboard Buttons
const questionPageButton = document.querySelector("#questionsButton");
const userPageButton = document.querySelector("#usersButton");
const hostGameButton = document.querySelector("#launchButton");

//Set Teacher Dashboard Functions
questionPageButton.onclick = questionsManage;
userPageButton.onclick = usersManage;

hostGameButton.onclick = () => {
    window.location.href = "/api/play/teacher-host";
}