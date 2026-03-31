//--- HEADER ------------------------------------------------------------------
/**
 * @file tg-helpers.js
 * 
 * @description Provides helper functions to manipulate the page content for the 
 * teaching game.
 * 
 * @author Connor Hekking
 * Initial code
 * 
 * @author Will Mungas
 * Tweaked code for template_div to turn into a function with correct
 * use of promises
 */
//--- HTML TEMPLATE STRINGS ---------------------------------------------------

const teacherLobbyHTML = 
`
<div id="game-settings">

</div>
<div id=">

</div>
`;

//--- GLOBALS ---------------------------------------------------------------

// Reference for template(from test-tg-templates.html) once it is loaded into DOM
let template_question_container;

//--- FUNCTIONS ---------------------------------------------------------------

/**
 * @author Will Mungas
 * Sets up the teacher view of the lobby in HTML, including registering new
 * players
 * @param {*} content pass in document.querySelector("#content")
 */
function teacherLobby(content) {
    content.innerHTML = 
    `

    `;
}



/**
 * @author Will Mungas
 * 
 * Sets up the page with content from question-template.html
 */
function setupPage() {
    const template_div = document.createElement('div');

    fetch('/public/templates/question-template.html')
    .then((res) => {
        res.text().then((template_str) => {
            template_div.innerHTML = template_str;
            const template = template_div.querySelector("#game-ui-template");
            template_question_container = template.content.querySelector("#question-container").cloneNode(true);
            if(window.location.href.includes("test-tg-templates")) {
                document.body.appendChild(template_question_container);
                // Tell script in interactive-box.js that the cube exists
                document.dispatchEvent(new Event('boxAdded'));
            }
        });
    });
}

/**
 * @author Connor Hekking
 * 
 * Helper to clear page
 */
function clearPage() {
    document.getElementById("content").innerHTML = "";
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
        throw new Error("Template content not yet loaded, please call setupPage.");
    }

    const content_container = document.getElementById("content");
    
    // Empty page
    clearPage();

    // Create new empty instance of question_container
    const question_container = template_question_container.cloneNode(false);

    // Clone new elements
    const next_question = template_question_container.querySelector(".next-question").cloneNode(true);
    const question_text = template_question_container.querySelector(".question-text").cloneNode(true);
    const countdown = template_question_container.querySelector(".countdown").cloneNode(true);

    // Edit elements
    question_text.querySelector('p').innerText = questionText;
    countdown.querySelector('p').innerText = timerStart; // TODO

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
        throw new Error("Template content not yet loaded, please call setupPage.");
    }

    // Check length of answers array
    if(answers.length != 4) {
        throw new Error("answers array must be of length 4");
    }

    const content_container = document.getElementById("content");
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
    countdown.innerText = timerStart; // TODO
    let idx = 0;
    answer_choices.querySelectorAll('p').forEach((answer_choice) => {
        answer_choice.innerText = answers[idx];
        answer_choice.classList.add("preview");
        idx += 1;
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
 * @param {Boolean} isTeacher If the page should be prepared for a teacher instead of a student view
 * @param {Function} answerHandler (not required if isTeacher) Handler to call when answer choice clicked. Receives parameter of the answer number.
 */
function answersClickable(timerStart, isTeacher, answerHandler) {
    const content_container = document.getElementById("content");
    const question_container = content_container.querySelector("#question-container");

    // Get current elements
    const question_text = question_container.querySelector(".question-text");
    const answer_choices = question_container.querySelector(".answer-choices");
    const countdown = question_container.querySelector(".countdown");

    // Edit elements
    let idx = 0
    answer_choices.querySelectorAll('p').forEach((answer_choice) => {
        if(!isTeacher){
            answer_choice.addEventListener('click', () => {answerHandler(idx + 1)}); // TODO this ok?
        }
        answer_choice.classList.remove("preview");
        idx += 1;
    });
    countdown.innerText = timerStart; // TODO
}

/**
 * @author Connor Hekking
 * 
 * Changes the question element to the showing correct/incorrect answer state
 * 
 * @param {Number} chosenAnswerNum Number (1-4) of the answer the user chose, or -1 if none chosen
 * @param {Number} correctAnswerNum Number (1-4) of the correct answer
 * @param {Boolean} isTeacher If the page object should be prepared for a teacher instead of a student view
 * @param {Function} continueBtnHandler (not required if !isTeacher) Function to be called when teacher continue button is clicked
 */
function showCorrectAnswer(chosenAnswerNum, correctAnswerNum, isTeacher, continueBtnHandler) {
    if(!template_question_container) {
        throw new Error("Template content not yet loaded, please call setupPage.");
    }

    const content_container = document.getElementById("content");
    const question_container = content_container.querySelector("#question-container");

    // Get current elements
    const question_text = question_container.querySelector(".question-text");
    const answer_choices = question_container.querySelector(".answer-choices");
    const countdown = question_container.querySelector(".countdown");

    // Remove unwanted elements
    question_container.removeChild(countdown);

    // Add new elements
    if(!isTeacher) {
        if(chosenAnswerNum == correctAnswerNum) {
            // Add correct element
            const correct_prompt = template_question_container.querySelector(".correct-prompt").cloneNode(true);
            question_container.appendChild(correct_prompt);
        } else {
            // Add incorrect element
            const incorrect_prompt = template_question_container.querySelector(".incorrect-prompt").cloneNode(true);
            question_container.appendChild(incorrect_prompt);
        }
    } else {
        // Teacher has continue control
        const next_question_btn = template_question_container.querySelector(".next-question-btn").cloneNode(true);
        question_container.appendChild(next_question_btn);
        next_question_btn.addEventListener("click", () => {
            continueBtnHandler();
        });
    }

    // Edit elements
    let currentAnswerNum = 1;
    answer_choices.querySelectorAll('p').forEach((answer_choice) => {
        if(currentAnswerNum == correctAnswerNum) {
            answer_choice.classList.add("correct");
        } else if(currentAnswerNum != chosenAnswerNum) {
            // Add incorrect styling only if NOT correct
            answer_choice.classList.add("incorrect");
        } else {
            answer_choice.classList.add("unpicked");
        }
        currentAnswerNum += 1;
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
 * @param {Boolean} isTeacher If the page object should be prepared for a teacher instead of a student view
 * @param {Function} nextQuestionBtnHandler (not required if !isTeacher) Function to be called when teacher next question button is clicked
 */
function showLeaderboard(current_player, all_players, isTeacher, nextQuestionBtnHandler) {
    if(!template_question_container) {
        throw new Error("Template content not yet loaded, please call setupPage.");
    }

    const content_container = document.getElementById("content");
    const question_container = content_container.querySelector("#question-container");

    // Remove unwanted elements
    question_container.innerHTML = '';
    
    // Clone new elements
    const leaderboard = template_question_container.querySelector(".leaderboard").cloneNode(true);

    // Edit elements
    let idx = 0;
    leaderboard.querySelectorAll('p').forEach((ranking) => {
        ranking.innerText = `${all_players[idx].name}: ${all_players[idx].points}`;
        idx += 1;
    });

    // Add new elements
    if(!isTeacher) {
        // Get current player's rank
        const rank = 1 + all_players.findIndex((player) => player.name == current_player.name);

        const self_ranking = template_question_container.querySelector(".self-ranking").cloneNode(true);
        self_ranking.querySelectorAll('p')[0].innerText = getPlaceText(rank, false);
        self_ranking.querySelectorAll('p')[1].innerText = getEncouragementText(rank, false);
        question_container.appendChild(self_ranking);
    }
    question_container.appendChild(leaderboard);
    if(isTeacher) {
        // Teacher has continue control
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
 * @param {Boolean} isTeacher If the page object should be prepared for a teacher instead of a student view
 * @param {*} statistics TODO should have category statistics, not implemented
 * @returns cloneable object containing the body of the leaderboard page 
 */
function showEndLeaderboard(current_player, all_players, isTeacher, statistics) {
    if(!template_question_container) {
        throw new Error("Template content not yet loaded, please call setupPage.");
    }
    // TODO not actually showing any statistics(on box)
    // TODO different rankings display?

    const content_container = document.getElementById("content");
    const question_container = content_container.querySelector("#question-container");

    // Remove unwanted elements
    question_container.innerHTML = '';
    
    // Clone new elements
    const your_learning = template_question_container.querySelector(".your-learning").cloneNode(true);
    const leaderboard = template_question_container.querySelector(".leaderboard").cloneNode(true);
    const box = template_question_container.querySelector(".box").cloneNode(true);

    // Edit elements
    let idx = 0;
    leaderboard.querySelectorAll('p').forEach((ranking) => {
        ranking.innerText = `${all_players[idx].name}: ${all_players[idx].points}`;
        idx += 1;
    });
    if(isTeacher) {
        your_learning.innerText = "Class Learning";
    }

    // Add new elements
    question_container.appendChild(your_learning);
    question_container.appendChild(box);
    // Tell script in interactive-box.js that the box exists
    document.dispatchEvent(new Event('boxAdded'));
    if(!isTeacher) {
        // Get current player's rank
        const rank = 1 + all_players.findIndex((player) => player.name == current_player.name);

        const self_ranking = template_question_container.querySelector(".self-ranking").cloneNode(true);
        self_ranking.querySelectorAll('p')[0].innerText = getPlaceText(rank, false);
        self_ranking.querySelectorAll('p')[1].innerText = getEncouragementText(rank, false);
        question_container.appendChild(self_ranking);
    }
    question_container.appendChild(leaderboard);
    if(isTeacher) {
        const new_game_btn = template_question_container.querySelector(".new-game-btn").cloneNode(true);
        question_container.appendChild(new_game_btn);
    }
}


export default {
    setupPage,
    clearPage,
    showQuestion,
    showAnswers,
    answersClickable,
    showCorrectAnswer,
    showLeaderboard,
    showEndLeaderboard
}