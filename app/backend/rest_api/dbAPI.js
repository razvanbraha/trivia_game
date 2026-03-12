const express = require('express')
const path = require("node:path");
const validateQuestion = require('../db_queries/question-validation.js');
const {
    addQuestion,
    updateQuestion,
    deleteQuestion,
    getAllQuestion,
    getByCategory,
    getByID
} = require('../db_queries/questions-db.js');

//Router setup
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

//Templates
const templatesFolder = path.join(__dirname, '../../frontend/templates');

/**
 * Get questions, all or with matching id/category if provided
 * @author Riley Wickens & Razvan Braha
 * @param {Object} req - OPTIONAL request query may contain id/category of question to retrieve
 * @returns status OK & json list of questions
 * @throws Error 500 if unable to connect with questions db
 */
router.get('/populate', async (req, res) => {
    try {
        let qry = structuredClone(req.query)
        let questions;
        if (Object.keys(qry).length === 0) {
            questions = await getAllQuestion();
        } else if (qry.id) {
                questions = await getByID(qry.id);
        } else {
            questions = await getByCategory(qry.category);
        }
        res.status(200).json(questions);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: 'Failed to fetch questions'});
    }
});

/**
 * Add new question to database
 * @author Riley Wickens & Razvan Braha
 * @param {Object} req.body - request body contains necessary question data
 * @returns status OK & json message question added 
 * @throws Error 400 if invalid question data
 * @throws Error 500 if unable to connect with questions db
 */
router.post('/create', async (req, res) => {
    try {
        if (validateQuestion(req.body)) {
            addQuestion(req.body);
            console.log("Received Data:", req.body);
            res.status(201).json({ message: "Question added" });
        } else {
            res.status(400).json({error: "Unable to add question"});
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Unable to add question"});
    }
});

/**
 * Delete question from database
 * @author Riley Wickens & Razvan Braha
 * @param {Object} req.body.questionId - request body contains id of question to delete
 * @returns status OK
 * @throws Error 500 if unable to connect with questions db
 */
router.delete('/delete', async (req, res) => {
    try {
        deleteQuestion(req.body.questionId);
        console.log("Delete confirmed:", req.body.questionId);
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Unable to delete question"})
    }
});

/**
 * Update question in database
 * @author Riley Wickens & Razvan Braha
 * @param {Object} req.body.questionId - request body contains id of question to update
 * @param {Object} req.body.questionData - request body contains new question data
 * @returns status OK & json list of questions
 * @throws Error 500 if unable to connect with questions db
 */
router.put('/update', async (req, res) => {
    try {
        if (validateQuestion(req.body.questionData)) {
            updateQuestion(req.body.questionData, req.body.questionId);
            console.log("Update confirmed:", req.body.questionId);
            res.status(200).json({ message: "Question updated" });
        } else {
            res.status(400).json({error: "Unable to add question"});
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Unable to update question"})
    }
});

module.exports = router;