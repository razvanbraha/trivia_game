const validateQuestion = require('../db/question-validation');

describe('question-validation', () => {
    test('valid question returns empty error array', () => {
        const question = {
            question: 'What is 2+2?',
            category: 1,
            correctAnswer: '4',
            wrongAnswer1: '3',
            wrongAnswer2: '5',
            wrongAnswer3: '6',
            ai: '0'
        };

        expect(validateQuestion(question)).toEqual([]);
    });

    test('missing question returns error', () => {
        const question = {
            category: 1,
            correctAnswer: '4',
            wrongAnswer1: '3',
            wrongAnswer2: '5',
            wrongAnswer3: '6',
            ai: '0'
        };

        expect(validateQuestion(question)).toContain('Question required.');
    });

    test('missing category returns error', () => {
        const question = {
            question: 'What is 2+2?',
            correctAnswer: '4',
            wrongAnswer1: '3',
            wrongAnswer2: '5',
            wrongAnswer3: '6',
            ai: '0'
        };

        expect(validateQuestion(question)).toContain('Question required.');
    });

    test('missing correct answer returns error', () => {
        const question = {
            question: 'What is 2+2?',
            category: 1,
            wrongAnswer1: '3',
            wrongAnswer2: '5',
            wrongAnswer3: '6',
            ai: '0'
        };

        expect(validateQuestion(question)).toContain('Correct answer required.');
    });

    test('duplicate wrong answers returns error', () => {
        const question = {
            question: 'What is 2+2?',
            category: 1,
            correctAnswer: '4',
            wrongAnswer1: '3',
            wrongAnswer2: '3',
            wrongAnswer3: '6',
            ai: '0'
        };

        expect(validateQuestion(question)).toContain('Three distinct incorrect answers required.');
    });

    test('correct answer matching a wrong answer returns error', () => {
        const question = {
            question: 'What is 2+2?',
            category: 1,
            correctAnswer: '4',
            wrongAnswer1: '4',
            wrongAnswer2: '5',
            wrongAnswer3: '6',
            ai: '0'
        };

        expect(validateQuestion(question)).toContain('Correct asnwer cannot match an incorrect answer.');
    });

    test('invalid ai value returns error', () => {
        const question = {
            question: 'What is 2+2?',
            category: 1,
            correctAnswer: '4',
            wrongAnswer1: '3',
            wrongAnswer2: '5',
            wrongAnswer3: '6',
            ai: '2'
        };

        expect(validateQuestion(question)).toContain('Incorrect AI value');
    });
});