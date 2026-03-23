/*
edited by Will Mungas
Changes:
Edited routes to match server routes rather than hardcoded file paths
The whole point of serving static content from public is that it is the only folder
that the frontend 'knows' about; everything else about our file structure is hidden
and only served via route handlers. 

Also, this script needs documentation from whoever wrote it
*/

export function studentMenu() {
    globalThis.location.href = "../../templates/student-menu.html";
}

export function loginAsProfessor() {
    //window.location.href = "../../templates/teacher-login.html";
    globalThis.location.href = "../../templates/teacher-menu.html";
}

export function teacherMenu() {
    globalThis.location.href = "../../templates/teacher-menu.html";
}

export function questionsManage() {
    globalThis.location.href = "../../templates/teacher-question-manage.html";
}

export function usersManage() {
    globalThis.location.href = "../../templates/teacher-user-manage.html";
}

export function home() {
    globalThis.location.href = "../../index.html";
}

export default {studentMenu, teacherMenu, home, questionsManage, usersManage, loginAsProfessor};
