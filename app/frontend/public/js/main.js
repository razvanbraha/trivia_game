export function studentMenu() {
    globalThis.location.href = "../../templates/student-menu.html";
}

export function loginAsProfessor() {
    globalThis.location.href = "/teacher";
}

export function teacherMenu() {
    globalThis.location.href = "/api/teacher-menu";
}

export function questionsManage() {
    globalThis.location.href = "/api/teacher-question-manage"
}

export function usersManage() {
    globalThis.location.href = "/api/teacher-user-manage"
}

export function home() {
    globalThis.location.href = "../../index.html";
}

export default {studentMenu, teacherMenu, home, questionsManage, usersManage, loginAsProfessor};
