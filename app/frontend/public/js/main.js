/*
edited by Will Mungas
Changes:
Edited routes to match server routes rather than hardcoded file paths
The whole point of serving static content from public is that it is the only folder
that the frontend 'knows' about; everything else about our file structure is hidden
and only served via route handlers. 

Also, this script needs documentation from whoever wrote it
*/

function studentMenu() {
    fetch()
    window.location.href = "/student/home";
}

function loginAsProfessor() {
    window.location.href = "/teacher/login";
}

function questionsManage() {
    window.location.href = "/teacher/questions";
}

function usersManage() {
    window.location.href = "/teacher/users";
}

function home() {
    window.location.href = "/";
}