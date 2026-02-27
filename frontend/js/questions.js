const questionList = document.querySelector('#question-list');
const questionTemplate = document.querySelector('#questionDisplayTemplate');

const popup = document.querySelector('#popup');
const popupOpenButton = document.querySelector('#open-popup');
const popupCloseButton = document.querySelector('#close-popup');

/**
 * Event listener, checks for click event then opens question popup & populates it
 * @author Riley Wickens
 */
popupOpenButton.addEventListener("click", () => {
    popup.classList.add("open");
    populateQuestions()
})

/**
 * Event listener, checks for click event then closes question popup & depopulates it
 * @author Riley Wickens
 */
popupCloseButton.addEventListener("click", () => {
    popup.classList.remove("open");
    clearQuestions()
})

const clearQuestions = () => {
    questionList.replaceChildren()
}

async function populateQuestions() {
    const res = await fetch(`/api/questions`);

    if (res.status != 200) {
        const error = res.json();
        console.log(error);
        return;
    }

    const questions = await res.json();

    questions.forEach(question => {
        const questionInstance = questionTemplate.content.cloneNode(true);
        questionInstance.id = question.questionID;

        const questionElement = questionInstance.querySelector('.question');
        questionElement.textContent = question.question;

        const awnserElement = questionInstance.querySelector('.correctAnswer');
        awnserElement.textContent = question.corrAnswer;

        const incorrOneElement = questionInstance.querySelector('.wrongAnswer1');
        incorrOneElement.textContent = question.incorrONE;

        const incorrTwoElement = questionInstance.querySelector('.wrongAnswer2');
        incorrTwoElement.textContent = question.incorrTWO;

        const incorrThreeElement = questionInstance.querySelector('.wrongAnswer3');
        incorrThreeElement.textContent = question.incorrTHREE;

        let category = "";
        switch(question.category) {
            case 1:
                category = "Category One"
                break;
            case 2:
                category = "Category Two"
                break;
            case 3:
                category = "Category Three"
                break;
            case 4:
                category = "Category Four"
                break;
            case 5:
                category = "Category Five"
                break;
            case 6:
                category = "Category Six"
                break;
        }

        const categoryElement = questionInstance.querySelector('.category');
        categoryElement.textContent = category;

        const aiElement = questionInstance.querySelector('.ai');
        aiElement.textContent =  question.isAI === 1;

        const deleteButton = document.createElement('button');
        deleteButton.className = "btn btn-danger";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener('click', () => {
            deleteQuestion(question.questionID)
        });
        questionInstance.append(deleteButton)

        questionList.append(questionInstance)
    })

}

async function deleteQuestion(id) {
    const data = {questionId: id}
    const res = await fetch(`/api/questions`, { method: "DELETE",  headers: {'Content-Type': 'application/json'},  body: JSON.stringify(data)});
   
    if (res.status != 200) {
        const error = res.json();
        console.log(error);
        return;
    }
    populateQuestions();
    location.reload();
}
