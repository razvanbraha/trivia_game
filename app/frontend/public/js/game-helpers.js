//--- HEADER ------------------------------------------------------------------
/**
 * @file game-helpers.js
 * 
 * @description Provides helper functions to manipulate the DOM for all game
 * pages
 * 
 * @author Will Mungas
 * Creation, initial contents for teaching game
 * 
 * @author Connor Hekking
 * updatePlayers, loadTemplateContent, showQuestion, showAnswers, 
 * answersClickable, showCorrectAnswer, showLeaderboard, showEndLeaderboard
 */
//--- GLOBALS ---------------------------------------------------------------

// Reference for template(from question-template.html) once it is loaded into DOM
let template_question_container;

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
 * @param {String} code game code
 * @param {Function} start function to start the game
 */
function createLobby(code, start) {
    const content = getContent();

    clearContent();

    // sets up lobby: added to page content when the teacher first joins the game successfully
    // game-players is dynamically updated by the teacher script (tg-host.js) on JOINEE and KICK events
    // content.innerHTML += 
    // `
    // <section id="game-settings">
    //     <h3>JOIN: ${code}</h3>
    //     <h4>Settings</h4>
    //     <p>TODO: add other settings</p>
    // </section>
    // <section id="game-players">
    //     <h4>Joined Players</h4>
    //     <div id="players-list">
    //         TODO add players
    //     </div>
    //     <button id="start-game">Start Game</button>
    // </section>
    // `;

    content.innerHTML += `
    <div class="container-fluid main-container">
        <div class="row h-100 text-white">
            <div class="col-md-4 left-panel p-4">
                <h3>Settings</h3>

                <label class="mt-3">Questions: <span id="questionCount">25</span></label>
                <input type="range" min="5" max="50" value="25" id="questionSlider" class="form-range">

                <label class="mt-3">Question Preview Time: <span id="previewTime">5</span> seconds</label>
                <input type="range" min="0" max="30" value="5" id="previewSlider" class="form-range">

                <label class="mt-3">Answer Preview Time: <span id="deadTime">3</span> seconds</label>
                <input type="range" min="0" max="30" value="3" id="deadSlider" class="form-range">

                <label class="mt-3">Answering Period: <span id="liveTime">10</span> seconds</label>
                <input type="range" min="1" max="30" value="10" id="liveSlider" class="form-range">

                <h5 class="mt-4">Categories</h5>
                <div>
                    <input type="checkbox" checked value="1">History & Evolution<br>
                    <input type="checkbox" checked value="2">Technical Aspects & Engineering<br>
                    <input type="checkbox" checked value="3">Sustainability<br>
                    <input type="checkbox" checked value="4">Consumerism & Ethics<br>
                    <input type="checkbox" checked value="5">End-of-Life & Data<br>
                    <input type="checkbox" checked value="6">Logistics & Distribution<br>
                </div>

            </div>

            <div class="col-md-8 right-panel p-4">

                <h4>CODE: <span id="roomCode">${code}</span></h4>

                <h5 class="mt-4">Joinees</h5>
                <div id="players"></div>

                <div class="mt-5 d-flex gap-4">
                    <button id="cancelRoomButton" class="btn btn-danger">Cancel</button>
                    <button id="startGameButton" class="btn btn-primary"">Start</button>
                </div>

            </div>
        </div>
    </div>
    `

    content.querySelector("#cancelRoomButton").addEventListener("click", () => {
        //TODO should replace this with main.js method instead
        globalThis.location.href = "/api/teacher/home";
    });

    content.querySelector("#startGameButton").addEventListener("click", () => {
        start();
    });

    const sliders = ["questionSlider", "previewSlider", "deadSlider", "liveSlider"];
    const countDisplays = ["questionCount", "previewTime", "deadTime", "liveTime"];

    for(let i = 0; i < sliders.length; i++) {
        const slider = document.getElementById(sliders[i]);
        const countDisplay = document.getElementById(countDisplays[i]);
        slider.addEventListener("input", () => {
            countDisplay.innerText = slider.value;
        });
    }

    content.classList.add("lobby-ctnr")
}

/**
 * @author Will Mungas
 * @description Updates the list of players & attaches their kick buttons
 * @param {*} players list of player names
 * @param {(name: String)} kick function to call to kick a player by name (called when button is clicked)
 */
function updatePlayers(players, kick) {
    const player_section = document.getElementById("players");
    player_section.innerHTML = "";
    for(const player of players) {
        player_section.innerHTML += 
        `
        <div>
            <p>${player}</p>
            <button class="btn btn-danger">Kick</button>
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

/**
 * @author Connor Hekking
 * @description Loads settings from page elements
 * @return object {
 *  rounds: Number,
 *  categories: Array,
 *  preview: Number,
 *  Dead: Number, 
 *  Live: Number
 * }
 */
function getSettings() {
    const rounds = document.getElementById("questionSlider").value;
    const categories = [...document.querySelectorAll("input[type=checkbox]:checked")]
        .map(c => c.value);
    const preview = document.getElementById("previewSlider").value;
    const dead = document.getElementById("deadSlider").value;
    const live = document.getElementById("liveSlider").value;

    return {
        rounds,
        categories,
        preview,
        dead,
        live
    }
}

//--- TIMER SETUP -------------------------------------------------------------

/**
 * @author Connor Hekking
 * 
 * Resets round-time-bar animation and time
 * 
 * @param {String} countdown Countdown element
 * @param {Number} timerStart Start time of timer
 */
function resetTimer(countdown, timerStart) {
    const timer_bar = countdown.querySelector('.round-time-bar div');

    // Reset animation
    timer_bar.style.animation = 'none';
    timer_bar.offsetHeight;
    timer_bar.style.animation = null;

    // Update duration
    countdown.querySelector('.round-time-bar').style = `--duration: ${timerStart};`;
}

//--- QUESTIONS ---------------------------------------------------------------

/**
 * Pulls 
 * @param {*} text 
 * @param {*} prev preview time before answers will be sent
 */
function createQuestion(text, prev) {
    const template_div = document.createElement('div');

    fetch('/public/templates/question-template.html')
    .then(res => res.text())
    .then((template_str) => {
        template_div.innerHTML = template_str;
        const template = template_div.querySelector("#game-ui-template");
        template_question_container = template.content.querySelector("#question-container").cloneNode(true);
        if(window.location.href.includes("test-tg-templates")) {
            document.body.appendChild(template_question_container);
            // Tell script in interactive-box.js that the cube exists
            document.dispatchEvent(new Event('boxAdded'));
        }
        showQuestion(text, prev);
    });


}

/**
 * @author Connor Hekking
 * 
 * Fills content with the question preview page
 * 
 * @param {String} questionText Text of the question
 * @param {Number} timerStart Start time of timer (preview time)
 */
function showQuestion(questionText, timerStart) {
    if(!template_question_container) {
        throw new Error("Template content not yet loaded, please call loadTemplateContent.");
    }

    const content_container = getContent();
    
    // Empty page
    clearContent();

    // Create new empty instance of question_container
    const question_container = template_question_container.cloneNode(false);

    // Clone new elements
    const next_question = template_question_container.querySelector(".next-question").cloneNode(true);
    const question_text = template_question_container.querySelector(".question-text").cloneNode(true);
    const countdown = template_question_container.querySelector(".countdown").cloneNode(true);

    // Edit elements
    question_text.querySelector('p').innerText = questionText;
    resetTimer(countdown, timerStart);

    // Add new elements
    question_container.appendChild(next_question);
    question_container.appendChild(question_text);
    question_container.appendChild(countdown);

    // Add obj to content_container
    content_container.appendChild(question_container);
}

/**
 * @author Connor Hekking
 * 
 * Shows answer choices which start greyed out (dead time)
 * 
 * @param {Array} answers List of the four answers in the order to be displayed
 * @param {Number} timerStart Starting time on the timer(dead time)
 */
function showAnswers(answers, timerStart) {
    if(!template_question_container) {
        throw new Error("Template content not yet loaded, please call loadTemplateContent.");
    }

    // Check length of answers array
    if(answers.length != 4) {
        throw new Error("answers array must be of length 4");
    }

    const content_container = getContent();
    const question_container = content_container.querySelector("#question-container");

    // Get current elements
    const next_question = question_container.querySelector(".next-question");
    const question_text = question_container.querySelector(".question-text");
    const countdown = question_container.querySelector(".countdown");

    // Remove unwanted elements
    question_container.removeChild(next_question);
    
    // Clone new elements
    const answer_choices = template_question_container.querySelector(".answer-choices").cloneNode(true);

    // Edit elements
    resetTimer(countdown, timerStart);
    answer_choices.querySelectorAll('.answer-choice-container').forEach((answer_choice, idx) => {
        answer_choice.innerText = answers[idx];
        answer_choice.classList.add("preview");
    });

    // Add new elements
    question_container.insertBefore(answer_choices, countdown)
}

/**
 * @author Connor Hekking
 * 
 * Makes answer choices clickable and attaches given handler (live time)
 * 
 * @param {Number} timerStart Starting time on the timer(Live time)
 * @param {Boolean} isHost If the page should be prepared for a host instead of a player view
 * @param {Function} answerHandler (not required if isHost) Handler to call when answer choice clicked. Receives parameter of the answer number.
 */
function answersClickable(timerStart, isHost, answerHandler) {
    const content_container = getContent();
    const question_container = content_container.querySelector("#question-container");

    // Get current elements
    const answer_choices = question_container.querySelector(".answer-choices");
    const countdown = question_container.querySelector(".countdown");

    // Edit elements
    answer_choices.querySelectorAll('.answer-choice-container').forEach((answer_choice, idx) => {
        if(!isHost){
            answer_choice.addEventListener('click', () => answerHandler(idx), {once: true});
        }
        answer_choice.classList.remove("preview");
    });
    resetTimer(countdown, timerStart);
}

/**
 * @author Connor Hekking
 * 
 * Changes the question element to the showing correct/incorrect answer state
 * 
 * @param {Number} chosenAnswerIdx Index (0-3) of the answer the user chose, or -1 if none chosen
 * @param {Number} correctAnswerIdx Number (0-3) of the correct answer
 * @param {Boolean} isHost If the page object should be prepared for a host instead of a player view
 * @param {Function} continueBtnHandler (not required if !isHost) Function to be called when host continue button is clicked
 * @param {Number} classAccuracyPercent (not required if !isHost) Class accuracy perecentage i.e. 55
 */
function showCorrectAnswer(chosenAnswerIdx, correctAnswerIdx, isHost, continueBtnHandler, classAccuracyPercent) {
    if(!template_question_container) {
        throw new Error("Template content not yet loaded, please call loadTemplateContent.");
    }

    const content_container = getContent();
    const question_container = content_container.querySelector("#question-container");

    // Get current elements
    const question_text = question_container.querySelector(".question-text");
    const answer_choices = question_container.querySelector(".answer-choices");
    const countdown = question_container.querySelector(".countdown");

    // Remove unwanted elements
    question_container.removeChild(countdown);

    // Add new elements
    if(!isHost) {
        if(chosenAnswerIdx == correctAnswerIdx) {
            // Add correct element
            const correct_prompt = template_question_container.querySelector(".correct-prompt").cloneNode(true);
            question_container.appendChild(correct_prompt);
        } else {
            // Add incorrect element
            const incorrect_prompt = template_question_container.querySelector(".incorrect-prompt").cloneNode(true);
            question_container.appendChild(incorrect_prompt);
        }
    } else {
        // Add class accuracy element
        const class_accuracy = template_question_container.querySelector(".question-class-accuracy").cloneNode(true);
        question_container.appendChild(class_accuracy);
        class_accuracy.querySelector('p').innerText = `${classAccuracyPercent}% Class Accuracy!`;

        // Host has continue control
        const next_question_btn = template_question_container.querySelector(".next-question-btn").cloneNode(true);
        question_container.appendChild(next_question_btn);
        next_question_btn.addEventListener("click", () => {
            continueBtnHandler();
        });
    }

    // Edit elements
    answer_choices.querySelectorAll('.answer-choice-container').forEach((answer_choice, idx) => {
        if(idx === correctAnswerIdx) {
            answer_choice.classList.add("correct");
        } else if(idx === chosenAnswerIdx) {
            // Add incorrect styling only if chosen & NOT correct
            answer_choice.classList.add("incorrect");
        } else {
            answer_choice.classList.add("unpicked");
        }
    });
}

/**
 * @author Connor Hekking
 * 
 * Returns the place text ('You are in/finished 1st place')
 * 
 * @param {Number} place Current player's rank
 * @param {Boolean} final If the text is for current position(false) or final position(true)
 * @returns place text ('You are in/finished 1st place')
 */
function getPlaceText(place, final) {
    let place_text = '';
    if(final) {
        place_text += 'You finished ';
    } else {
        place_text += 'You are in ';
    }

    // Get ordinal suffix
    const lastTwo = place % 100;
    if (lastTwo >= 11 && lastTwo <= 13) place_text += place + 'th';

    const last = n % 10;
    if (last === 1) place_text += place + 'st';
    if (last === 2) place_text += place + 'nd';
    if (last === 3) place_text += place + 'rd';
    place_text += place + 'th';

    place_text += ' place!';
    
    return place_text;
}

/**
 * @author Connor Hekking
 * 
 * Returns the encouragement text ('Keep it up!/Good job!')
 * 
 * @param {Number} place Current player's rank
 * @param {Boolean} final If the text is for current position(false) or final position(true)
 * @returns encouragement text ('Keep it up!/Good job!')
 */
function getEncouragementText(place, final) {
    const encouragement_texts_ongoing = ['On top of the world!', 'Almost perfect!', 'Nearly there!', 'Keep up the lead!', 'Nice work!'];
    const encouragement_texts_final = ['Gold medal!', 'Silver medal!', 'Bronze medal!', 'You are on the podium!', 'You are on the podium!', 'Good game!'];
    let encouragement_text;
    if(place > 5) {
        // Default is last in array
        place = 6;
    }
    if(final) {
        encouragement_text = encouragement_texts_final[place - 1];
    } else {
        encouragement_text = encouragement_texts_ongoing[place - 1];
    }
    return encouragement_text;
}

/**
 * @author Connor Hekking
 * 
 * Populates the page with the leaderboard
 * 
 * @param {{name: String, points: Number, latest_answer: Number}} current_player Current player's points, name, and latest answer in an object
 * @param {Array({name: String, points: Number, latest_answer: Number})} all_players Array of all player's points, name, and latest answer in an object
 * @param {Boolean} isHost If the page object should be prepared for a host instead of a player view
 * @param {Function} nextQuestionBtnHandler (not required if !isHost) Function to be called when host next question button is clicked
 */
function showLeaderboard(current_player, all_players, isHost, nextQuestionBtnHandler) {
    if(!template_question_container) {
        throw new Error("Template content not yet loaded, please call loadTemplateContent.");
    }

    const content_container = getContent();
    const question_container = content_container.querySelector("#question-container");

    // Remove unwanted elements
    question_container.innerHTML = '';
    
    if(isHost) {
        // Clone new elements
        const leaderboard = template_question_container.querySelector(".small-leaderboard").cloneNode(true);

        // Edit elements
        leaderboard.querySelectorAll('p').forEach((ranking, idx) => {
            if(all_players[idx]) {
                ranking.innerText = `${ranking.innerText.split(":")[0]} ${all_players[idx].name} with ${all_players[idx].points} points`;
            } else {
                leaderboard.removeChild(ranking);
            }
        });
    }
    

    // Add new elements
    if(!isHost) {
        // Get current player's rank
        const rank = 1 + all_players.findIndex((player) => player.name == current_player.name);

        const self_ranking = template_question_container.querySelector(".self-ranking").cloneNode(true);
        self_ranking.querySelectorAll('p')[0].innerText = getPlaceText(rank, false);
        self_ranking.querySelectorAll('p')[1].innerText = getEncouragementText(rank, false);
        question_container.appendChild(self_ranking);
    }
    if(isHost) {
        question_container.appendChild(leaderboard);

        // host has continue control
        const next_question_btn = template_question_container.querySelector(".next-question-btn").cloneNode(true);
        question_container.appendChild(next_question_btn);
        next_question_btn.addEventListener("click", () => {
            nextQuestionBtnHandler();
        });
    }
}

/**
 * @author Connor Hekking
 * 
 * Populates the page with the ENDING leaderboard
 * 
 * @param {{name: String, points: Number, latest_answer: Number}} current_player Current player's points, name, and latest answer in an object
 * @param {Array({name: String, points: Number, latest_answer: Number})} all_players Array of all player's points, name, and latest answer in an object
 * @param {Boolean} isHost If the page object should be prepared for a host instead of a player view
 * @param {List} category_accuracy Category statistics in form List({category_num, accuracy, num_correct, num_questions})
 * @returns cloneable object containing the body of the leaderboard page 
 */
function showEndLeaderboard(current_player, all_players, isHost, category_accuracy) {
    if(!template_question_container) {
        throw new Error("Template content not yet loaded, please call loadTemplateContent.");
    }
    // TODO different rankings display?

    const content_container = getContent();
    const question_container = content_container.querySelector("#question-container");

    // Remove unwanted elements
    question_container.innerHTML = '';
    
    // Clone new elements
    const your_learning = template_question_container.querySelector(".your-learning").cloneNode(true);
    const leaderboard = template_question_container.querySelector(".leaderboard").cloneNode(true);
    const box = template_question_container.querySelector(".box").cloneNode(true);

    // Edit elements
    leaderboard.querySelectorAll('p').forEach((ranking, idx) => {
        if(all_players[idx]) {
            ranking.innerText = `${all_players[idx].name}: ${all_players[idx].points}`;
        } else {
            leaderboard.removeChild(ranking);
        }
    });
    if(isHost) {
        your_learning.innerText = "Class Learning";
    }

    const box_sides = [".cube__face--front, .cube__face--back", ".cube__face--right", ".cube__face--left", ".cube__face--top", ".cube__face--bottom"];
    box_sides.forEach((box_side_name, idx) => {
        // Note this just goes off of order, does not check cube face names
        const box_side = box.querySelector(box_side_name);
        const stats_label = box_side.querySelector(".cube_face_stats");
        const category_stat = category_accuracy[idx];
        
        stats_label.innerText = `${category_stat.num_correct}/${category_stat.num_questions} ${category_stat.accuracy}% accuracy`;
    });

    // Add new elements
    question_container.appendChild(your_learning);
    question_container.appendChild(box);
    // Tell script in interactive-box.js that the box exists
    document.dispatchEvent(new Event('boxAdded'));
    if(!isHost) {
        // Get current player's rank
        const rank = 1 + all_players.findIndex((player) => player.name == current_player.name);

        const self_ranking = template_question_container.querySelector(".self-ranking").cloneNode(true);
        self_ranking.querySelectorAll('p')[0].innerText = getPlaceText(rank, false);
        self_ranking.querySelectorAll('p')[1].innerText = getEncouragementText(rank, false);
        question_container.appendChild(self_ranking);
    }
    question_container.appendChild(leaderboard);
    if(isHost) {
        const new_game_btn = template_question_container.querySelector(".new-game-btn").cloneNode(true);
        new_game_btn.addEventListener("click", () => window.location.reload());
        question_container.appendChild(new_game_btn);
    }
}

// TODO add functions to create question text, create answer choices, etc

//--- EXPORTS -----------------------------------------------------------------

export default {
    getContent,
    clearContent,
    createLobby,
    updatePlayers,
    getSettings,
    createQuestion,
    showQuestion,
    showAnswers,
    answersClickable,
    showCorrectAnswer,
    showLeaderboard,
    showEndLeaderboard
}