const questionListContent = document.querySelector('#questionListContent');
const displayTemplate = document.querySelector('#questionDisplayTemplate');
const questionForm = document.querySelector("#questionForm");

document.addEventListener("DOMContentLoaded", populateQuestions);

async function populateQuestions() {
    questionListContent.innerHTML = "";
    const res = await fetch(`/api/questions`);
    if (!res.ok) return;

    const questions = await res.json();
    questions.forEach(question => {
        const row = document.createElement("div");
        renderQuestionDisplay(row, question);
        questionListContent.appendChild(row);
    });
}

function renderQuestionDisplay(container, question) {
    container.innerHTML = "";
    const instance = displayTemplate.content.cloneNode(true);

    instance.querySelector('.question').textContent = question.question;
    instance.querySelector('.correctAnswer').textContent = `✓ ${question.corrAnswer}`;
    instance.querySelector('.wrongAnswer1').textContent = question.incorrONE;
    instance.querySelector('.wrongAnswer2').textContent = question.incorrTWO;
    instance.querySelector('.wrongAnswer3').textContent = question.incorrTHREE;

    const categories = ["", "History & Evolution", "Technical Aspects", "Sustainability", "Ethics", "End-of-Life", "Logistics"];
    instance.querySelector('.category-label').textContent = categories[question.category] || "General";

    instance.querySelector('.edit-btn').onclick = () => renderQuestionEdit(container, question);
    instance.querySelector('.delete-btn').onclick = () => deleteQuestion(question.questionID);

    container.appendChild(instance);
}

// Reuse your loadQuestion logic but render it in-place
function renderQuestionEdit(container, question) {
    container.innerHTML = `
        <div class="bg-white p-3 rounded mb-3 border border-info">
            <input type="text" class="form-control mb-2 edit-q" value="${question.question}">
            <input type="text" class="form-control mb-2 edit-corr border-success" value="${question.corrAnswer}">
            <input type="text" class="form-control mb-2 edit-w1" value="${question.incorrONE}">
            <input type="text" class="form-control mb-2 edit-w2" value="${question.incorrTWO}">
            <input type="text" class="form-control mb-2 edit-w3" value="${question.incorrTHREE}">
            <div class="d-flex gap-2">
                <button class="btn btn-success btn-sm save-btn">Save</button>
                <button class="btn btn-secondary btn-sm cancel-btn">Cancel</button>
            </div>
        </div>
    `;

    container.querySelector('.cancel-btn').onclick = () => renderQuestionDisplay(container, question);
    container.querySelector('.save-btn').onclick = async () => {
        const data = {
            questionId: question.questionID,
            questionData: {
                question: container.querySelector('.edit-q').value,
                correctAnswer: container.querySelector('.edit-corr').value,
                wrongAnswer1: container.querySelector('.edit-w1').value,
                wrongAnswer2: container.querySelector('.edit-w2').value,
                wrongAnswer3: container.querySelector('.edit-w3').value,
                category: question.category, // Keep original or add select
                ai: question.isAI
            }
        };

        const res = await fetch(`/api/questions`, { 
            method: "PUT",  
            headers: {'Content-Type': 'application/json'},  
            body: JSON.stringify(data)
        });

        if (res.ok) populateQuestions();
    };
}

// AI form handling (your original logic updated for current DOM)
aiForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const prompt = document.querySelector("#aiPrompt").value;
    const res = await fetch(`/api/ai/gemini`, { 
        method: "POST",  
        headers: {'Content-Type': 'application/json'},  
        body: JSON.stringify({ aiPrompt: prompt})
    });
    const question = await res.json();
    formSetter(question);
});

function formSetter(q) {
    document.querySelector("#question").value = q.question;
    document.querySelector("#correctAnswer").value = q.corrAnswer;
    document.querySelector("#wrongAnswer1").value = q.incorrAnswer1;
    document.querySelector("#wrongAnswer2").value = q.incorrAnswer2;
    document.querySelector("#wrongAnswer3").value = q.incorrAnswer3;
    document.querySelector("#category").value = q.category;
    document.querySelector("#ai").value = 1;
}