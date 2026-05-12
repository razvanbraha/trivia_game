import {studentMenu, teacherMenu, home} from '../js/main.js';

/**
 * Header element for templates
 * @author Riley Wickens
 * @returns consistend header element with specialised buttons
 */
class Header extends HTMLElement {

    connectedCallback() {
        this.innerHTML = `
            <header class="header">
                <div class="headerBox left">
                    <div class="logo"><img src="/public/images/sustainable-box-logo-cropped.svg" alt="logo"/></div>
                </div>
                <div class="headerBox center">
                    <h1 class="fw-bold m-0 title">Sustainable Box Trivia</h1>
                </div>
                <div class="headerBox right">
                    <div class="header-buttons">
                        <button id="dynamicButton1" class="btn student-btn btn-lg px-5" hidden></button>
                        <button id="dynamicButton2" class="btn student-btn btn-lg px-5" hidden></button>
                    </div>
                    <div class="btn-group">
                    <button type="button" id="dropdown" class="btn student-btn btn-md px-3" data-bs-toggle="dropdown" aria-expanded="false" hidden>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-list" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"/>
                        </svg>       
                    </button>
                    <ul class="dropdown-menu">
                        <li id="item1"><a class="dropdown-item dynamicLink1"></a></li>
                        <li id="divider"><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item dynamicLink2"></a></li>
                    </ul>
                    </div>
                </div>
            </header>
        `;
        setButtons();
    }
}

/**
 * Set buttons based on path route
 * @author Riley Wickens
 */
let setButtons = () => {
    const dynamicButton1 = document.querySelector('#dynamicButton1');
    const dynamicButton2 = document.querySelector('#dynamicButton2');
    const dropDownButton = document.querySelector('#dropdown');
    const dynamicLink1 = document.querySelector('.dynamicLink1');
    const item1 = document.querySelector('#item1');
    const divider = document.querySelector('#divider');
    const dynamicLink2 = document.querySelector('.dynamicLink2');

    const logo = document.querySelector('.logo');
    logo.onclick = home;

    const location = globalThis.location.pathname;

    if (location.includes('/student') && !location.includes('host')) {
        dropDownButton.removeAttribute('hidden');
        dynamicButton1.removeAttribute('hidden');
        if (location.includes('menu')) {
            item1.remove();
            divider.remove();
        } else {
            dynamicButton1.onclick = studentMenu;
            dynamicButton1.textContent = "Dash";
            dynamicLink1.onclick = studentMenu;
            dynamicLink1.textContent = "Dashboard";
            dynamicButton1.removeAttribute('hidden');
        }
        dynamicButton2.onclick = home;
        dynamicButton2.textContent = "Home";
        dynamicLink2.onclick = home;
        dynamicLink2.textContent = "Home";
        dynamicButton2.removeAttribute('hidden');
    } 
    else if (location.includes('/teacher') || location.includes('/redirect') || location.includes('/users')) {
        dropDownButton.removeAttribute('hidden');
        if (location.includes('menu')) {
            item1.remove();
            divider.remove();
        } else {
            dynamicButton1.onclick = teacherMenu;
            dynamicButton1.textContent = "Dash";
            dynamicLink1.onclick = teacherMenu;
            dynamicLink1.textContent = "Dash";
            dynamicButton1.removeAttribute('hidden');
        }
        dynamicButton2.onclick = home;
        dynamicButton2.textContent = "Home";
        dynamicLink2.onclick = home;
        dynamicLink2.textContent = "Home";
        dynamicButton2.removeAttribute('hidden');
    }
    else if(location.includes('/play')) {
        dropDownButton.removeAttribute('hidden');
        //item1.remove();
        //divider.remove();
        dynamicButton2.onclick = location.includes('/host') ? teacherMenu : studentMenu;
        dynamicButton2.textContent = "Quit";
        dynamicLink2.onclick = location.includes('/host') ? teacherMenu : studentMenu;
        dynamicLink2.textContent = "Quit";
        dynamicButton2.removeAttribute('hidden');
    }
}



customElements.define('header-component', Header);