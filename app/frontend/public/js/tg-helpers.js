


const template_file = fetch('/public/templates/question-template.html').then((res) => {
    return res.text().then((result) => {
        console.log(result);
        return result;
    });
});


/**
 * @author Connor Hekking
 * 
 * Returns the show question page html
 * 
 * @param {String} questionText Text of the question
 * @returns html containing the body of the show question page 
 */
function createShowQuestion(questionText) {
    //TODO
}

/**
 * @author Connor Hekking
 * 
 * Returns the show answer choices page html
 * 
 * @param {String} questionText Text of the question
 * @param {Array} answers List of the four answers in the order to be displayed
 * @param {Number} timerStart start of th e
 * @returns html containing the body of the show question page 
 */
function createShowQuestion(questionText, answers, timerStart) {
    //TODO
}

/**
 * @author Connor Hekking
 * 
 * Returns the leaderboard page html
 * 
 * @param {Number} place Current player's place
 * @param {*} statistics Statistics to display(format unknown currently)
 * @returns html containing the body of the show question page 
 */
function createLeaderboard(place, statistics) {
    //TODO
}
