import {studentMenu, teacherMenu} from './main.js';

const studentDashButton = document.querySelector("#studentButton");
const teacherLoginButton = document.querySelector("#teacherLoginButton");

studentDashButton.onclick = studentMenu;
teacherLoginButton.onclick = teacherMenu;