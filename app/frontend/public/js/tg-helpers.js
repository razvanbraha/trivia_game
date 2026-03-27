const template_str = await fetch('/public/templates/question-template.html').then((res) => {
    return res.text().then((result) => {
        console.log(result);
        return result;
    });
});

const template_div = document.createElement('div');
template_div.innerHTML = template_str;
const template = template_div.querySelector("#game-ui-template");
const base_question_container = template.content.querySelector("#question-container").cloneNode(true);
if(window.location.href.includes("test-tg-templates")) {
    document.body.appendChild(base_question_container);
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
    const question_container = base_question_container.cloneNode(false);

    // Clone sub elements
    const next_question = base_question_container.querySelector(".next-question").cloneNode(true);
    const question_text = base_question_container.querySelector(".question-text").cloneNode(true);

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
    const question_container = base_question_container.cloneNode(false);
    
    // Clone sub elements
    const question_text = base_question_container.querySelector(".question-text").cloneNode(true);
    const question_choices = base_question_container.querySelector(".question-choices").cloneNode(true);
    const countdown = base_question_container.querySelector(".countdown").cloneNode(true);

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
            const correct_prompt = base_question_container.querySelector(".correct-prompt").cloneNode(true);
            question_container.appendChild(correct_prompt);
        } else {
            // Add incorrect element
            const incorrect_prompt = base_question_container.querySelector(".incorrect-prompt").cloneNode(true);
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
 * @param {Number} place Current player's place
 * @param {*} statistics Statistics to display(format unknown currently)
 * @param {Boolean} isTeacher If the page object should be prepared for a teacher instead of a student view
 * @returns cloneable object containing the body of the leaderboard page 
 */
function createLeaderboard(place, statistics, isTeacher) {
    //TODO
}
