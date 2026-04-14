//--- HEADER ------------------------------------------------------------------
/**
 * @file study-game-helpers.js
 * 
 * @description Provides helper functions to manipulate the DOM for all game
 * pages
 * 
 * @author Will Mungas
 * Creation, initial contents for study game
 * 
 * @author Connor Hekking, Riley Wickens
 * loadTemplateContent, showQuestion, showAnswers, 
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
 * @author Will Mungas, Riley Wickens
 * @description Creates a lobby page for study games within the content element, listing the
 * settings
 * @param {Function} start function to start the game
 */
function createLobby(start) {
    const content = getContent();

    clearContent();

    content.innerHTML += `
    <div class="container-fluid main-container">
        <div class="row h-100 text-white">
            <div class="col-md-4 left-panel p-4">
                <h3>Settings</h3>

                <label class="mt-3">Questions: <span id="questionCount">25</span></label>
                <input type="range" min="1" max="50" value="25" id="questionSlider" class="form-range">

                <label class="mt-3">Question Preview Time: <span id="previewTime">5</span> seconds</label>
                <input type="range" min="1" max="30" value="5" id="previewSlider" class="form-range">

                <label class="mt-3">Answer Preview Time: <span id="deadTime">3</span> seconds</label>
                <input type="range" min="1" max="30" value="3" id="deadSlider" class="form-range">

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
                <div class="mt-3">
                    <h5>Study Game</h5>
                    <p>Welcome! Once your settings have been set click the start button to begin.</p>
                </div>
                <div class="mt-5 d-flex gap-4">
                    <button id="cancelRoomButton" class="btn btn-danger">Cancel</button>
                    <button id="startGameButton" class="btn btn-primary"">Start</button>
                </div>

            </div>
        </div>
    </div>
    `

    content.querySelector("#cancelRoomButton").addEventListener("click", () => {
        globalThis.location.href = "/api/student/home";
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
        if(globalThis.location.href.includes("test-tg-templates")) {
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
function answersClickable(timerStart, answerHandler) {
    const content_container = getContent();
    const question_container = content_container.querySelector("#question-container");

    // Get current elements
    const answer_choices = question_container.querySelector(".answer-choices");
    const countdown = question_container.querySelector(".countdown");

    // Edit elements
    answer_choices.querySelectorAll('.answer-choice-container').forEach((answer_choice, idx) => {
        answer_choice.addEventListener('click', () => {
            answerHandler(idx)
            answer_choices.querySelectorAll('.answer-choice-container').forEach((choices, i) => {
                if (i != idx && !choices.classList.contains('picked')) {
                    choices.classList.add('unpicked');
                } 
                else {
                    choices.classList.add('picked');
                }
            });
        }, {once: true});
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
function showCorrectAnswer(chosenAnswerIdx, correctAnswerIdx, continueBtnHandler) {
    if(!template_question_container) {
        throw new Error("Template content not yet loaded, please call loadTemplateContent.");
    }

    const content_container = getContent();
    const question_container = content_container.querySelector("#question-container");

    // Get current elements
    const answer_choices = question_container.querySelector(".answer-choices");
    const countdown = question_container.querySelector(".countdown");

    // Remove unwanted elements
    countdown.remove();

    // Add new elements
    if(chosenAnswerIdx == correctAnswerIdx) {
        // Add correct element
        const correct_prompt = template_question_container.querySelector(".correct-prompt").cloneNode(true);
        question_container.appendChild(correct_prompt);
    } else {
        // Add incorrect element
        const incorrect_prompt = template_question_container.querySelector(".incorrect-prompt").cloneNode(true);
        question_container.appendChild(incorrect_prompt);
    }

    // Host has continue control
    const next_question_btn = template_question_container.querySelector(".next-question-btn").cloneNode(true);
    question_container.appendChild(next_question_btn);
    next_question_btn.addEventListener("click", () => {
        continueBtnHandler();
    });

    // Edit elements
    answer_choices.querySelectorAll('.answer-choice-container').forEach((answer_choice, idx) => {
        if(idx === correctAnswerIdx) {
            if (answer_choice.classList.contains('unpicked')) answer_choice.classList.remove('unpicked');
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
 * @author Connor Hekking, Riley Wickens
 * 
 * Returns the encouragement text ('Keep it up!/Good job!')
 * 
 * @param {Number} points Current player's points
 * @param {Number} questions Current number of answers
 * @returns encouragement text ('Keep it up!/Good job!')
 */
function getEncouragementText(current_accuracy) {
    const encouragement_texts = ['You can do this!', 'We believe in you!', "Don't give up!", 'Keep Trying!', 'Nearly there!', "Keep it up!", "Nice work!", "You're doing great!", 'Incredible!', 'Almost perfect!', 'Genius!'];
    let idx = Math.floor(current_accuracy.accuracy / 10);
    return encouragement_texts[idx];
}

/**
 * @author Connor Hekking, Riley Wickens
 * 
 * Populates the page with the leaderboard
 * 
 * @param {{name: String, points: Number, latest_answer: Number}} current_player Current player's points, name, and latest answer in an object
 * @param {Array({name: String, points: Number, latest_answer: Number})} all_players Array of all player's points, name, and latest answer in an object
 * @param {Boolean} isHost If the page object should be prepared for a host instead of a player view
 * @param {Function} nextQuestionBtnHandler (not required if !isHost) Function to be called when host next question button is clicked
 */
function showLeaderboard(current_player, current_accuracy, category_accuracy, nextQuestionBtnHandler) {
    if(!template_question_container) {
        throw new Error("Template content not yet loaded, please call loadTemplateContent.");
    }

    const totalQuestions = category_accuracy.reduce((total, category) => total + category.num_questions, 0);
    if (current_accuracy.num_questions === totalQuestions) {
        nextQuestionBtnHandler();
    }
    
    const content_container = getContent();
    const question_container = content_container.querySelector("#question-container");

    // Add new elements
    //Empty Page Contents
    question_container.innerHTML = '';

    const box = template_question_container.querySelector(".box").cloneNode(true);
    
    //Set Box Colour Gradients & Accuracy message
    const box_sides = [".cube__face--front", ".cube__face--back", ".cube__face--right", ".cube__face--left", ".cube__face--top", ".cube__face--bottom"];
    const colors = ["--front-percentage", "--back-percentage", "--right-percentage", "--left-percentage", "--top-percentage", "--bottom-percentage"];
    box_sides.forEach((box_side_name, idx) => {
        // Note this just goes off of order, does not check cube face names
        let box_side = box.querySelector(box_side_name);
        const stats_label = box_side.querySelector(".cube_face_stats");
        const category_stat = category_accuracy[idx];

        if (category_stat.num_questions === 0) {
            document.documentElement.style.setProperty(colors[idx], '100%');
            box_side.style.color = 'white';
            stats_label.innerText = `Category Unselected`;
        } else {
            document.documentElement.style.setProperty(colors[idx], category_accuracy[idx].accuracy + '%');
            if (category_accuracy[idx].accuracy > 50) {
                box_side.style.color = 'white';
            }

            stats_label.innerText = `${category_stat.num_correct}/${category_stat.num_questions} ${category_stat.accuracy}% accuracy`;
        }
    });

    question_container.appendChild(box);   
    document.dispatchEvent(new Event('boxAdded'));

    const self_ranking = template_question_container.querySelector(".self-ranking").cloneNode(true);
    self_ranking.querySelectorAll('p')[0].innerText =  `Currently you're ${current_accuracy.accuracy}% accurate with ${current_player.points} points!`;
    self_ranking.querySelectorAll('p')[1].innerText = getEncouragementText(current_accuracy);
    question_container.appendChild(self_ranking);

    const next_question_btn = template_question_container.querySelector(".next-question-btn").cloneNode(true);
    question_container.appendChild(next_question_btn);
    next_question_btn.addEventListener("click", () => {
        nextQuestionBtnHandler();
    });
}

/**
 * @author Connor Hekking, Riley Wickens
 * 
 * Populates the page with the ENDING leaderboard
 * 
 * @param {{name: String, points: Number, latest_answer: Number}} current_player Current player's points, name, and latest answer in an object
 * @param {Array({name: String, points: Number, latest_answer: Number})} all_players Array of all player's points, name, and latest answer in an object
 * @param {Boolean} isHost If the page object should be prepared for a host instead of a player view
 * @param {List} category_accuracy Category statistics in form List({category_num, accuracy, num_correct, num_questions})
 * @returns cloneable object containing the body of the leaderboard page 
 */
function showEndLeaderboard(current_player, current_accuracy, category_accuracy) {
    if(!template_question_container) {
        throw new Error("Template content not yet loaded, please call loadTemplateContent.");
    }
    const content_container = getContent();
    const question_container = content_container.querySelector("#question-container");

    // Remove unwanted elements
    question_container.innerHTML = '';
    
    const box = template_question_container.querySelector(".box").cloneNode(true);

    //Set Box Colour Gradients & Accuracy message
    const box_sides = [".cube__face--front", ".cube__face--back", ".cube__face--right", ".cube__face--left", ".cube__face--top", ".cube__face--bottom"];
    const colors = ["--front-percentage", "--back-percentage", "--right-percentage", "--left-percentage", "--top-percentage", "--bottom-percentage"];
    box_sides.forEach((box_side_name, idx) => {
        // Note this just goes off of order, does not check cube face names
        let box_side = box.querySelector(box_side_name);
        const stats_label = box_side.querySelector(".cube_face_stats");
        const category_stat = category_accuracy[idx];

        if (category_stat.num_questions === 0) {
            document.documentElement.style.setProperty(colors[idx], '100%');
            box_side.style.color = 'white';
            stats_label.innerText = `Category Unselected`;
        } else {
            document.documentElement.style.setProperty(colors[idx], category_accuracy[idx].accuracy + '%');
            if (category_accuracy[idx].accuracy > 50) {
                box_side.style.color = 'white';
            }
            stats_label.innerText = `${category_stat.num_correct}/${category_stat.num_questions} ${category_stat.accuracy}% accuracy`;
        }
    });

    // Add new elements
    question_container.appendChild(box);
    document.dispatchEvent(new Event('boxAdded'));


    const self_ranking = template_question_container.querySelector(".self-ranking").cloneNode(true);
    self_ranking.querySelectorAll('p')[0].innerText =  `You finished ${current_accuracy.accuracy}% accurate with ${current_player.points} points!`;
    self_ranking.querySelectorAll('p')[1].innerText = getEncouragementText(current_accuracy);
    question_container.appendChild(self_ranking);

    const new_game_btn = template_question_container.querySelector(".new-game-btn").cloneNode(true);
    new_game_btn.addEventListener("click", () => globalThis.location.reload());
    question_container.appendChild(new_game_btn);
}

// TODO add functions to create question text, create answer choices, etc
    // Why would creating questions go here? 

//--- EXPORTS -----------------------------------------------------------------

export default {
    getContent,
    clearContent,
    createLobby,
    getSettings,
    createQuestion,
    showQuestion,
    showAnswers,
    answersClickable,
    showCorrectAnswer,
    showLeaderboard,
    showEndLeaderboard
}