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
 * @param {*} players 
 */
function createLobby(players) {
    const content = getContent();

    clearContent();
    createSettings();
    createPlayers(players);

    content.classList.add("lobby-ctnr")
}

/**
 * @author Will Mungas
 * @description Creates a settings pane inside the content element
 */
function createSettings() {
    const content = getContent();

    content.innerHTML += 
    `
    <section id="game-settings">
        TODO: add settings
    </section>
    `;
}

/**
 * @author Will Mungas
 * @description creates a players pane inside the content element
 * @param {*} players 
 */
function createPlayers(players) {
    const content = getContent();

    content.innerHTML += 
    `
    <section id="game-players">
        <h4>Joined Players</h4>
        <div id="players-list">
            TODO: add players
        </div>
    </section>
    `;

    //TODO: loop over players list and add players to the players section,
    // with "kick" buttons

}

// TODO add functions to create question text, create answer choices, etc