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

    const template_promise = fetch('/public/templates/question-template.html')
    .then((res) => {
        res.text().then((template_str) => {
            template_div.innerHTML = template_str;
            const template = template_div.querySelector("#game-ui-template");
            const template_question_container = template.content.querySelector("#question-container").cloneNode(true);
            if(window.location.href.includes("test-tg-templates")) {
                document.body.appendChild(template_question_container);
            }
        });
    });
}



/**
 * @author Connor Hekking
 * 
 * Returns the initial show question page object, which can then be cloned
 * 
 * @param {String} questionText Text of the question
 * @returns cloneable object containing the body of the show question page 
 */
function createShowQuestion(questionText) {
    // Create new empty instance of question_container
    const question_container = template_question_container.cloneNode(false);

    // Clone sub elements
    const next_question = template_question_container.querySelector(".next-question").cloneNode(true);
    const question_text = template_question_container.querySelector(".question-text").cloneNode(true);

    // Edit sub elements
    question_text.querySelector('p').innerText = questionText;

    // Add sub elements
    question_container.appendChild(next_question);
    question_container.appendChild(question_text);

    // Return cloneable obj
    return question_container;
}

/**
 * @author Connor Hekking
 * 
 * Returns the initial show answer choices page object, which can then be cloned
 * 
 * @param {String} questionText Text of the question
 * @param {Array} answers List of the four answers in the order to be displayed
 * @param {Number} timerStart Starting time on the timer
 * @returns cloneable object containing the body of the show answers page 
 */
function createShowAnswers(questionText, answers, timerStart) {
    // Check length of answers array
    if(answers.length != 4) {
        throw new Error("answers array must be of length 4");
    }

    // Create new empty instance of question_container
    const question_container = template_question_container.cloneNode(false);
    
    // Clone sub elements
    const question_text = template_question_container.querySelector(".question-text").cloneNode(true);
    const question_choices = template_question_container.querySelector(".question-choices").cloneNode(true);
    const countdown = template_question_container.querySelector(".countdown").cloneNode(true);

    // Edit sub elements
    question_text.querySelector('p').innerText = questionText;
    let idx = 0;
    question_choices.querySelectorAll('p').forEach((question_choice) => {
        question_choice.innerText = answers[idx];
        idx += 1;
    });
    countdown.querySelector('p').innerText = `Time remaining: ${timerStart} seconds`;

    // Add sub elements
    question_container.appendChild(question_text);
    question_container.appendChild(question_choices);
    question_container.appendChild(countdown);

    // Return cloneable obj
    return question_container;
}

/**
 * @author Connor Hekking
 * 
 * Changes the question element to the showing correct/incorrect answer state
 * 
 * @param {Number} chosenAnswerNum Number (1-4) of the answer the user chose, or 0 if none chosen
 * @param {Number} correctAnswerNum Number (1-4) of the correct answer
 * @param {Boolean} isTeacher If the page object should be prepared for a teacher instead of a student view
 */
function showCorrectAnswer(chosenAnswerNum, correctAnswerNum, isTeacher) {
    // Get body instance of question_container
    const question_container = document.body.querySelector('#question-container');

    // Get sub elements
    const question_choices = question_container.querySelector(".question-choices")
    const countdown = question_container.querySelector(".countdown");

    // Add sub elements
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
        // Teacher view won't have any correct/incorrect prompt
    }

    // Edit sub elements
    let currentAnswerNum = 1;
    question_choices.querySelectorAll('p').forEach((question_choice) => {
        if(currentAnswerNum == correctAnswerNum) {
            question_choice.classList.add("correct");
        } else if(currentAnswerNum == chosenAnswerNum) {
            // Add incorrect styling only if NOT correct
            question_choice.classList.add("incorrect");
        } else {
            question_choice.classList.add("unpicked");
        }
        currentAnswerNum += 1;
    });

    // Remove sub elements
    question_container.removeChild(countdown);
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
 * Returns the leaderboard page object, which can then be cloned
 * 
 * @param {{points: Number, rank: Number}} current_player Current player's points and rank in an object
 * @param {Array({points: Number, rank: Number})} other_players Array of other player's points and rank in an object
 * @param {Boolean} isTeacher If the page object should be prepared for a teacher instead of a student view
 * @returns cloneable object containing the body of the leaderboard page 
 */
function createLeaderboard(current_player, other_players, isTeacher) {
    // Copy statistics list and insert player
    const players_list = other_players.slice();
    if(!isTeacher) {
        players_list.push(current_player)
    }
    // Sort player list
    players_list.sort((a, b) => b.points - a.points);

    // Create new empty instance of question_container
    const question_container = template_question_container.cloneNode(false);
    
    // Clone sub elements
    const leaderboard = template_question_container.querySelector(".leaderboard").cloneNode(true);

    // Edit sub elements
    let idx = 0;
    leaderboard.querySelectorAll('p').forEach((ranking) => {
        ranking.innerText = `Player: ${players_list[idx].points}`;
        idx += 1;
    });

    // Add sub elements
    if(!isTeacher) {
        const self_ranking = template_question_container.querySelector(".self-ranking").cloneNode(true);
        self_ranking.querySelectorAll('p')[0].innerText = getPlaceText(current_player.rank, false);
        self_ranking.querySelectorAll('p')[1].innerText = getEncouragementText(current_player.rank, false);
        question_container.appendChild(self_ranking);
    }
    question_container.appendChild(leaderboard);
    if(isTeacher) {
        const next_question_btn = template_question_container.querySelector(".next-question-btn").cloneNode(true);
        question_container.appendChild(next_question_btn);
    }

    // Return cloneable obj
    return question_container;
}

/**
 * @author Connor Hekking
 * 
 * Returns the ENDING leaderboard page object, which can then be cloned
 * 
 * @param {{points: Number, rank: Number}} current_player Current player's points and rank in an object
 * @param {Array({points: Number, rank: Number})} other_players Array of other player's points and rank in an object
 * @param {Boolean} isTeacher If the page object should be prepared for a teacher instead of a student view
 * @param {*} statistics TODO should have category statistics, not implemented
 * @returns cloneable object containing the body of the leaderboard page 
 */
function createEndLeaderboard(current_player, other_players, isTeacher, statistics) {
    //TODO not actually showing any statistics

    // Copy statistics list and insert player
    const players_list = other_players.slice();
    if(!isTeacher) {
        players_list.push(current_player)
    }
    // Sort player list
    players_list.sort((a, b) => b.points - a.points);

    // Create new empty instance of question_container
    const question_container = template_question_container.cloneNode(false);
    
    // Clone sub elements
    const your_learning = template_question_container.querySelector(".your-learning").cloneNode(true);
    const box = template_question_container.querySelector(".box").cloneNode(true);
    const leaderboard = template_question_container.querySelector(".leaderboard").cloneNode(true);

    // Edit sub elements
    //TODO edit box for category statistics
    if(isTeacher) {
        your_learning.querySelector('p').innerText = "Class Learning";
    }
    let idx = 0;
    leaderboard.querySelectorAll('p').forEach((ranking) => {
        ranking.innerText = `Player: ${players_list[idx].points}`;
        idx += 1;
    });

    // Add sub elements
    question_container.appendChild(your_learning);
    question_container.appendChild(box);
    if(!isTeacher) {
        const self_ranking = template_question_container.querySelector(".self-ranking").cloneNode(true);
        self_ranking.querySelectorAll('p')[0].innerText = getPlaceText(current_player.rank, false);
        self_ranking.querySelectorAll('p')[1].innerText = getEncouragementText(current_player.rank, false);
        question_container.appendChild(self_ranking);
    }
    question_container.appendChild(leaderboard);
    if(isTeacher) {
        const new_game_btn = template_question_container.querySelector(".new-game-btn").cloneNode(true);
        question_container.appendChild(new_game_btn);
    }

    // Return cloneable obj
    return question_container;
}


export default {
    teacherLobby,
    setupPage,
    createShowQuestion,
    createShowAnswers,
    showCorrectAnswer,
    createLeaderboard,
    createEndLeaderboard
}