
/**
 * Test question data for valid fields
 * @author Riley Wickens & Razvan Braha
 * @param {Object} body - question data to validate
 * @returns a list of errors accumulated during validation; if empty, question is valid 
 */
module.exports = validateQuestion = (body) => {
    const {question, category, correctAnswer, wrongAnswer1, wrongAnswer2, wrongAnswer3, ai } = body;
    let valid = true;
    let errors = [];

    if (!question) {
        valid = false;
        errors.push("Question required.");
    }
    if (!category) {
        valid = false;
        errors.push("Question required.");
    }
    if (!correctAnswer) {
        valid = false;
        errors.push("Correct answer required.");
    }
    if (!wrongAnswer1 || !wrongAnswer2 || !wrongAnswer3 || 
        wrongAnswer1 === wrongAnswer2 || wrongAnswer1 === wrongAnswer3 || wrongAnswer2 === wrongAnswer3) {
        valid = false;
        errors.push("Three distinct incorrect answers required.");
    }
    if (correctAnswer === wrongAnswer1 || correctAnswer === wrongAnswer2 || correctAnswer === wrongAnswer3) {
        valid = false;
        errors.push("Correct asnwer cannot match an incorrect answer.");
    }
    if (ai != '0' && ai != '1') {
        valid = false;
        errors.push("Incorrect AI value");
    }

    if (!valid) {
        console.log(errors);
    }
    return errors;
}


