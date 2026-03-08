import {questionsManage, usersManage} from './main.js';

const questionPageButton = document.querySelector("#questionsButton");
const userPageButton = document.querySelector("#usersButton");

questionPageButton.onclick = questionsManage;
userPageButton.onclick = usersManage;