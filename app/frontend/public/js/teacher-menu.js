import {questionsManage, usersManage} from './main.js';

//Get Teacher Dashboard Buttons
const questionPageButton = document.querySelector("#questionsButton");
const userPageButton = document.querySelector("#usersButton");
//Set Teacher Dashboard Functions
questionPageButton.onclick = questionsManage;
userPageButton.onclick = usersManage;