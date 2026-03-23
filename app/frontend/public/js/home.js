import {studentMenu, teacherMenu} from './main.js';

//Get Student Dashboard Buttons
const studentDashButton = document.querySelector("#studentButton");
const teacherLoginButton = document.querySelector("#teacherLoginButton");

//Set Student Dashboard Button Functions
studentDashButton.onclick = studentMenu;
teacherLoginButton.onclick = teacherMenu;