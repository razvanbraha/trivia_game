const template_str = await fetch('/public/templates/question-template.html').then((res) => {
    return res.text().then((result) => {
        console.log(result);
        return result;
    });
});

const template_div = document.createElement('div');
template_div.innerHTML = template_str;
const template = template_div.querySelector("#game-ui-template");
const template_question_container = template.content.querySelector("#question-container").cloneNode(true);
if(window.location.href.includes("test-tg-templates")) {
    document.body.appendChild(template_question_container);
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
 * Returns the leaderboard page object, which can then be cloned
 * 
 * @param {{points: Number, rank: Number}} current_player Current player's points and rank in an object
 * @param {Array({points: Number, rank: Number})} other_players Array of other player's points and rank in an object
 * @param {Boolean} isTeacher If the page object should be prepared for a teacher instead of a student view
 * @returns cloneable object containing the body of the leaderboard page 
 */
function createLeaderboard(place, statistics, isTeacher) {
    // Copy statistics list and insert player
    const players_list = other_players.slice().push(current_player);
    // Sort player list
    players_list.sort((a, b) => b.points - a.points);

    // Create new empty instance of question_container
    const question_container = template_question_container.cloneNode(false);
    
    // Clone sub elements
    const self_ranking = template_question_container.querySelector(".self-ranking").cloneNode(true);
    const leaderboard = template_question_container.querySelector(".leaderboard").cloneNode(true);

    // Edit sub elements
    let place_text;
    let encouragement_text;
    switch (current_player.rank) {
        case 1:
            place_text = '1st place!';
            encouragement_text = 'On top of the world!';
            break;
        case 2:
            place_text = '2nd place!';
            encouragement_text = 'Almost perfect!';
            break;
        case 3:
            place_text = '3rd place!';
            encouragement_text = 'Nearly there!';
            break;
        case 4:
            place_text = '4th place!';
            encouragement_text = 'Keep up the lead!';
            break;
        case 5:
            place_text = '5th place!';
            encouragement_text = 'Keep up the lead!';
            break;
        default:
            place_text = `${current_player.rank}th place`;
            encouragement_text = 'Nice work!';
            break;
    }
    self_ranking.querySelectorAll('p')[0].innerText = `You are in ${place_text}`;
    self_ranking.querySelectorAll('p')[1].innerText = encouragement_text;
    let idx = 0;
    leaderboard.querySelectorAll('p').forEach((ranking) => {
        ranking.innerText = `Player: ${players_list[idx].points}`;
        idx += 1;
    });

    // Add sub elements
    question_container.appendChild(self_ranking);
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
 * @returns cloneable object containing the body of the leaderboard page 
 */
function createEndLeaderboard(place, statistics, isTeacher) {
    //TODO this is a placeholder, need to make distinct end leaderboard
    return createLeaderboard(place, statistics, isTeacher);
}
