const questionList = document.querySelector('#question-list');
const questionTemplate = document.querySelector('#questionDisplayTemplate');
const questionEditTemplate = document.querySelector('#questionEditTemplate');

const aiForm = document.querySelector('#aiForm');

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

/**
 * Clear questionList element
 * @author Riley Wickens
*/
const clearQuestions = () => {
    questionList.replaceChildren()
}

/**
 * Populate questionList with questions
 * @author Riley Wickens
 * @throws Error if failed to retrieve questions
 */
async function populateQuestions() {
    const res = await fetch(`/api/questions/populate`);

    if (res.status != 200) {
        const error = res.json();
        console.log(error);
        return;
    }

    const questions = await res.json();

    questions.forEach(question => {
        const questionInstance = questionTemplate.content.cloneNode(true);
        questionInstance.id = question.questionID;
        const questionContainer = questionInstance.querySelector('.questionDisplayContainer');

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
                category = "History & Evolution"
                break;
            case 2:
                category = "Technical Aspects & Engineering"
                break;
            case 3:
                category = "Sustainability"
                break;
            case 4:
                category = "Consumerism & Ethics"
                break;
            case 5:
                category = "End-of-Life & Data"
                break;
            case 6:
                category = "Logistics & Distribution"
                break;
        }

        const categoryElement = questionInstance.querySelector('.category');
        categoryElement.textContent = category;

        const aiElement = questionInstance.querySelector('.ai');
        aiElement.textContent = question.isAI === 1 ? "Made with AI" : "No AI Used";

        const deleteButton = document.createElement('button');
        deleteButton.id = "deleteBtn"
        deleteButton.className = "btn btn-danger";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener('click', () => {
            deleteQuestion(question.questionID)
        });
        questionContainer.append(deleteButton)

        const editButton = document.createElement('button');
        editButton.id = "editBtn"
        editButton.className = "btn btn-info";
        editButton.textContent = "Edit";
        editButton.addEventListener('click', () => {
            loadQuestion(question.questionID)
        });
        questionContainer.append(editButton)

        questionList.append(questionInstance)
    })

}

/**
 * Delete question from database
 * @author Riley Wickens
 * @param {Number} id - id of question to delete
 * @throws Error if failed to delete question from db
 */
async function deleteQuestion(id) {
    const data = {questionId: id}
    const res = await fetch(`/api/questions/delete`, { 
        method: "DELETE",  
        headers: {'Content-Type': 'application/json'},  
        body: JSON.stringify(data)
    });
   
    if (res.status != 200) {
        const error = res.json();
        console.log(error);
        return;
    }
    clearQuestions()
    populateQuestions();
}

/**
 * Load specific question from database into question edit form
 * @author Riley Wickens
 * @param {Number} id - id of specific question to load
 * @throws Error if failed to retrieve question from db
 */
async function loadQuestion(id) {
    clearQuestions()
    const res = await fetch(`/api/questions/populate?id=${id}`);

    if (res.status != 200) {
        const error = res.json();
        console.log(error);
        return;
    }

    const question = await res.json();
    const questionEditInstance = questionEditTemplate.content.cloneNode(true);

    const idElement = questionEditInstance.querySelector('#edit-id');
    idElement.value = question.questionID;

    const questionElement = questionEditInstance.querySelector('#edit-question');
    questionElement.value = question.question;

    const correctAnswerElement = questionEditInstance.querySelector('#edit-correctAnswer');
    correctAnswerElement.value = question.corrAnswer;

    const wrongAnswer1Element = questionEditInstance.querySelector('#edit-wrongAnswer1');
    wrongAnswer1Element.value = question.incorrONE;

    const wrongAnswer2Element = questionEditInstance.querySelector('#edit-wrongAnswer2');
    wrongAnswer2Element.value = question.incorrTWO;

    const wrongAnswer3Element = questionEditInstance.querySelector('#edit-wrongAnswer3');
    wrongAnswer3Element.value = question.incorrTHREE;

    const categoryElement = questionEditInstance.querySelector('#edit-category');
    categoryElement.value = question.category;

    const aiElement = questionEditInstance.querySelector('#edit-ai');
    aiElement.value = question.isAI;

    const submitButton = questionEditInstance.querySelector("#edit-submit");
    submitButton.addEventListener("click", async () => {
        let questionData = {
            question: questionElement.value,
            category: categoryElement.value,
            correctAnswer: correctAnswerElement.value,
            wrongAnswer1: wrongAnswer1Element.value,
            wrongAnswer2: wrongAnswer2Element.value,
            wrongAnswer3: wrongAnswer3Element.value,
            ai: aiElement.value
        }
        let data = {
            questionId: idElement.value,
            questionData: questionData
        }
        const res = await fetch(`/api/questions/update`, { 
            method: "PUT",  
            headers: {'Content-Type': 'application/json'},  
            body: JSON.stringify(data)
        });

        if (res.status != 200) {
            const error = res.json();
            console.log(error);
        }

        popup.classList.remove("open");
        clearQuestions()
    })

    questionList.append(questionEditInstance);
}

/**
 * Send Prompt to AI
 * @author Riley Wickens
 * @throws Error failure to connect to gemini
 */
aiForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const aiPrompt = document.querySelector("#aiPrompt");

    fetch(`/api/ai/gemini`, { 
        method: "POST",  
        headers: {'Content-Type': 'application/json'},  
        body: JSON.stringify({ aiPrompt: aiPrompt.value})
    }).then(res => {
        if (!res.ok) {
            const error = res.json();
            console.log(error);
        }
        return res.json();
    }).then(question => {
        if (question.error) {
            alert(question.error);
            return;
        }
        formSetter(question);
    }).catch(error => {
        console.log("Error: Problem connecting with gemini", error);
    }).finally(() => {
        aiPrompt.value = "";
    });

})

/**
 * Set AI data into question form element
 * @author Riley Wickens
 * @param {Object} question - question object to load from
 */
const formSetter = (question) => {
    const questionInput = document.querySelector("#question");
    questionInput.value = question.question;

    const corrAnswerInput = document.querySelector("#correctAnswer");
    corrAnswerInput.value = question.corrAnswer;

    const wrongAnswerOneInput = document.querySelector('#wrongAnswer1');
    wrongAnswerOneInput.value = question.incorrAnswer1;

    const wrongAnswerTwoInput = document.querySelector('#wrongAnswer2');
    wrongAnswerTwoInput.value = question.incorrAnswer2;

    const wrongAnswerThreeInput = document.querySelector('#wrongAnswer3');
    wrongAnswerThreeInput.value = question.incorrAnswer3;

    const categoryInput = document.querySelector('#category');
    categoryInput.selectedIndex = Number(question.category);

    const aiInput = document.querySelector("#ai");
    aiInput.value = 1;
}

const questionForm = document.querySelector("#questionForm");

//Handle Question form submission
if (questionForm) {
    questionForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(questionForm);

        const questionData = {
            question: formData.get("question"),
            correctAnswer: formData.get("correctAnswer"),
            wrongAnswer1: formData.get("wrongAnswer1"),
            wrongAnswer2: formData.get("wrongAnswer2"),
            wrongAnswer3: formData.get("wrongAnswer3"),
            category: Number(formData.get("category")),
            ai: Number(formData.get("ai"))
        };

        const res = await fetch("/api/questions/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(questionData)
        });

        if (!res.ok) {
            console.error(await res.text());
            return;
        }

        questionForm.reset();
        alert("Question added successfully!");
    });
}