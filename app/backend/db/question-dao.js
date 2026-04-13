//--- HEADER ------------------------------------------------------------------
/**
 * @file user-dao.js
 * 
 * @description provides functions to add users to the database
 * 
 * @author Will Mungas, Riley Wickens, Razvan Braha
 */
//--- IMPORTS -----------------------------------------------------------------

const db = require('./db');

//--- FUNCTIONS ---------------------------------------------------------------

/**
 * Add question to database.
 * @author Riley Wickens & Razvan Braha
 * @param {Array} body - Array with data to be added to db
 * @returns id of new question
 * @throws {err} if connection/query fails
 */
const addQuestion = async (body) => {
    const {question, correctAnswer, wrongAnswer1, wrongAnswer2, wrongAnswer3, category, ai} = body;

    let data = [question, correctAnswer, wrongAnswer1, wrongAnswer2, wrongAnswer3, category, ai];
    let qry = `INSERT INTO questions (question, corrAnswer, incorrONE, incorrTWO, incorrTHREE, category, isAI) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const [result] = await db.query(qry, data);
    return result.insertId;
}

/**
 * Update question in database.
 * @author Riley Wickens & Razvan Braha
 * @param {Array} body - Array w/ data to be added to db
 * @param {Number} id - Question ID of question to update
 * @returns updated question
 * @throws {err} if connection/query fails
 */
const updateQuestion = async (body, id) => {
    const {question, correctAnswer, wrongAnswer1, wrongAnswer2, wrongAnswer3, category, ai} = body;

    let data = [question, correctAnswer, wrongAnswer1, wrongAnswer2, wrongAnswer3, category, ai, id];
    let qry = `UPDATE questions 
        SET question= ? , corrAnswer = ?, incorrONE = ?, incorrTWO = ?, incorrTHREE = ?, category = ?, isAI = ?
        WHERE questionID = ?`;

    const [result] = await db.query(qry, data);
    return result.affectedRows;
}

/**
 * Delete question from database.
 * @author Riley Wickens & Razvan Braha
 * @param {Number} id - Question ID of question to delete
 * @returns deleted question
 * @throws {err} if connection/query fails
 */
const deleteQuestion = async (id) => {
    let qry = `DELETE FROM questions WHERE questionID = ?`;
    let [result] = await db.query(qry, [id]);
    return result.affectedRows;
}

/**
 * Retreive all questions from database.
 * @author Riley Wickens & Razvan Braha
 * @returns All questions in database
 * @throws {err} if connection/query fails
 */
const getAllQuestion = async () => {
    let qry = `SELECT * FROM questions`;
    const [result] = await db.query(qry);
    return result;
}

/**
 * Retreive questions from database with matching category.
 * @author Riley Wickens & Razvan Braha
 * @param {Number} category - category of questions to retreive
 * @returns questions matching given category
 * @throws {err} if connection/query fails
 */
const getByCategory = async (category) => {
    let qry = `SELECT * FROM questions WHERE category = ?`;
    const [result] = await db.query(qry, [category]);
    return result;
}

/**
 * Retreive questions from database with matching ID.
 * @author Riley Wickens & Razvan Braha
 * @param {Number} category - ID of question to retreive
 * @returns questions matching given id
 * @throws {err} if connection/query fails
 */
const getByID = async (id) => {
    let qry = `SELECT * FROM questions WHERE questionID = ?`;
    const[result] = await db.query(qry, [id]);
    return result[0] || null;
}

/**
 * Retrieve n random questions from database
 * @author Riley Wickens
 * @param {Number} n - number of questions to retrieve
 * @param {Int32List} categories - list of categories
 * @returns random list of questions with matching categories
 * @throws {err} if connection/query fails
 */
const selectRandQuestions = async (n, categories) => {
    let qry = `SELECT * 
    FROM questions
    WHERE category IN (?)
    ORDER BY RAND() 
    LIMIT ${n};`
    const [result] = await db.query(qry, [categories]);
    return result;
}

module.exports = {
    addQuestion,
    updateQuestion,
    deleteQuestion,
    getAllQuestion,
    getByCategory,
    getByID,
    selectRandQuestions
}


