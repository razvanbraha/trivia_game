import {studentMenu, teacherMenu, home} from '../js/main.js';

class Header extends HTMLElement {

    connectedCallback() {
        this.innerHTML = `
            <header class="header d-flex align-items-center justify-content-center">
                <div class="logo"></div>
                <h1 class="fw-bold m-0">Sustainable Box Trivia</h1>
                <div class="buttons">
                    <button id="dynamicButton1" class="btn student-btn btn-lg px-5" onclick="" hidden></button>
                    <button id="dynamicButton2" class="btn student-btn btn-lg px-5" onclick="" hidden></button>
                <div class="buttons">
            </header>
        `;
        setButtons();
    }
}

let setButtons = () => {
    const dynamicButton1 = document.querySelector('#dynamicButton1');
    const dynamicButton2 = document.querySelector('#dynamicButton2');

    const location = globalThis.location.pathname;

    if (location.includes('/student') && !location.includes('host')) {
        if (!location.includes('menu')) {
            dynamicButton1.onclick = studentMenu;
            dynamicButton1.textContent = "Dash";
            dynamicButton1.removeAttribute('hidden');
        }
        dynamicButton2.onclick = home;
        dynamicButton2.textContent = "Home";
        dynamicButton2.removeAttribute('hidden');
    } 
    else if (location.includes('/teacher') || location.includes('/redirect') || location.includes('/users')) {
        if (!location.includes('menu')) {
            dynamicButton1.onclick = teacherMenu;
            dynamicButton1.textContent = "Dash";
            dynamicButton1.removeAttribute('hidden');
        }
        dynamicButton2.onclick = home;
        dynamicButton2.textContent = "Logout";
        dynamicButton2.removeAttribute('hidden');
    }
}



customElements.define('header-component', Header);