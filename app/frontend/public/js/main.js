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
    globalThis.location.href = "/api/student/home";
}

export function loginAsProfessor() {
    globalThis.location.href = "/teacher";
}

export function teacherMenu() {
    globalThis.location.href = "/api/teacher/home";
}

export function questionsManage() {
    globalThis.location.href = "/api/teacher/questions";
}

export function usersManage() {
    globalThis.location.href = "/api/teacher/users";
}

export function home() {
    globalThis.location.href = "/api/";
}

export default {studentMenu, teacherMenu, home, questionsManage, usersManage, loginAsProfessor};
