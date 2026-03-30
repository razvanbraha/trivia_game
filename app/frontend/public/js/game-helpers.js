//--- HEADER ------------------------------------------------------------------
/**
 * @file game-helpers.js
 * 
 * @description Provides helper functions to manipulate the DOM for all game
 * pages
 * 
 * @author Will Mungas
 * Creation, initial contents for teaching game
 */
//--- FUNCTIONS ---------------------------------------------------------------

/**
 * @author Will Mungas
 * @description gets the content element of the page
 * @returns The content element of the page
 */
function getContent() {
    return document.querySelector("#content");
}

/**
 * @author Will Mungas
 * @description clears the page content, removing contained text, HTML, and 
 * all class-based css styling
 */
function clearContent() {
    const content = getContent();
    content.innerHTML = "";
    content.innerText = "";
    content.className = "";
}


/**
 * @author Will Mungas
 * @description Creates a lobby page within the content element, listing the
 * settings and the currently joined players
 * @param {*} players list of player names
 * @param {(name: String)} kick function to call to kick a player by name (called when button is clicked)
 */
function createLobby(code) {
    const content = getContent();

    clearContent();

    // sets up lobby: added to page content when the teacher first joins the game successfully
    // game-players is dynamically updated by the teacher script (tg-host.js) on JOINEE and KICK events
    content.innerHTML += 
    `
    <section id="game-settings">
        <h3>JOIN: ${code}</h3>
        <h4>Settings</h4>
        <p>TODO: add other settings</p>
    </section>
    <section id="game-players">
        <h4>Joined Players</h4>
        <div id="players-list">
            TODO add players
        </div>
        <button id="start-game">Start Game</button>
    </section>
    `;

    content.classList.add("lobby-ctnr")
}


function updatePlayers(players, kick) {
    const player_section = document.getElementById("players-list");
    player_section.innerHTML = "";
    for(const player of players) {
        player_section.innerHTML += 
        `
        <div>
            <p>${player}</p>
            <button>Kick</button>
        </div>
        `;
    }
    // add functionality to kick buttons
    const player_elements = player_section.querySelectorAll("div");
    for(const player of player_elements) {
        const text = player.querySelector("p").innerText;
        const kick_btn = player.querySelector("button");
        kick_btn.onclick = () => {
            kick(text);
        }
    }
}

// TODO add functions to create question text, create answer choices, etc

//--- EXPORTS -----------------------------------------------------------------

export default {
    getContent,
    clearContent,
    createLobby,
    updatePlayers
}