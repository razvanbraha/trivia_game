const express = require('express')
const path = require("node:path");
const validateQuestion = require('./question-validation.js');
const {
    addQuestion,
    updateQuestion,
    deleteQuestion,
    getAllQuestion,
    getByCategory,
    getByID
} = require('./questions-db.js');

const router = express.Router();
router.use(express.json());
router.use(express.static(path.join(__dirname, "../frontend")));
router.use(express.urlencoded({ extended: true }));

const htmlFolder = path.join(__dirname, '..', '..', 'frontend', 'html');

router.get('/questions', async (req, res) => {
    try {
        let qry = structuredClone(req.query)
        let questions;
        if (Object.keys(qry).length === 0) {
            questions = await getAllQuestion();
        } else {
            if (qry.id) {
                questions = await getByID(qry.id);
            } else {
                questions = await getByCategory(qry.category);
            }
        }
        res.status(200).json(questions);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: 'Failed to fetch questions'});
    }
});

router.post('/questions', async (req, res) => {
    try {
        if (validateQuestion(req.body)) {
            addQuestion(req.body);
            console.log("Received Data:", req.body);
            res.status(200).sendFile(path.join(htmlFolder, 'question-add.html'));
        } else {
            res.status(400).json({error: "Unable to add question"});
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Unable to add question"});
    }
});

router.delete('/questions', async (req, res) => {
    try {
        deleteQuestion(req.body.questionId);
        console.log("Delete confirmed:", req.body.questionId);
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Unable to delete question"})
    }
});

router.put('/questions', async (req, res) => {
    try {
        updateQuestion(req.body, req.body.questionId);
        console.log("Update confirmed:", req.body.questionId);
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Unable to delete question"})
    }
});

module.exports = router;