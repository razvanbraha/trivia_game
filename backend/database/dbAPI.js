const express = require('express')
const {
    addQuestion,
    updateQuestion,
    deleteQuestion,
    getAllQuestion,
    getByCategory,
    getByID
} = require('./questions-db.js');

const router = express.Router();

router.get('/questions', async (req, res) => {
    try {
        const questions = await getAllQuestion();
        res.json(questions);
        console.log(questions);
    } catch (err) {
        res.status(500).json({error: 'Failed to fetch questions'});
    }
});

module.exports = router;