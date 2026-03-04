const questionList = document.querySelector('#question-list');
const questionTemplate = document.querySelector('#questionDisplayTemplate');
const questionEditTemplate = document.querySelector('#questionEditTemplate');

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

async function deleteQuestion(id) {
    const data = {questionId: id}
    const res = await fetch(`/api/questions`, { 
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

async function loadQuestion(id) {
    clearQuestions()
    const res = await fetch(`/api/questions?id=${id}`);

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
        const res = await fetch(`/api/questions`, { 
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

const questionForm = document.querySelector("#questionForm");

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

        const res = await fetch("/api/questions", {
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