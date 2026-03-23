const path = require('node:path');
let mysql = require('mysql2/promise');
require('dotenv').config();

// Initialize database connection
let con;

async function connectWithRetry(config, retries = 10, delay = 3000) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Attempting DB connection (${i + 1}/${retries})...`);
            return await mysql.createConnection(config);
        } catch (err) {
            console.log("Database not ready, retrying...");
            await new Promise(res => setTimeout(res, delay));
        }
    }
    throw new Error("Could not connect to MySQL after multiple attempts.");
}

/**
 * Setup Questions database & table if none exists.
 * @author Riley Wickens & Razvan Braha
 * @throws {err} if connection/query fails
 */
const setupQuestions = async () => {

    // Create db if needed
    const rootCon = await connectWithRetry({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    await rootCon.query('CREATE DATABASE IF NOT EXISTS trivia');
    await rootCon.end();

    // connect with db
    con = await connectWithRetry({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    // Create table if it doesn't exist
    const createTableSql = 
        `CREATE TABLE IF NOT EXISTS questions (
        questionID INT AUTO_INCREMENT PRIMARY KEY,
        question VARCHAR(255) NOT NULL,
        corrAnswer VARCHAR(255) NOT NULL,
        incorrONE VARCHAR(255) NOT NULL,
        incorrTWO VARCHAR(255) NOT NULL,
        incorrTHREE VARCHAR(255) NOT NULL,
        category INT NOT NULL,
        isAI BOOLEAN NOT NULL DEFAULT FALSE)`;

    await con.query(createTableSql);
}

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

    const [result] = await con.query(qry, data);
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

    const [result] = await con.query(qry, data);
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
    let [result] = await con.query(qry, [id]);
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
    const [result] = await con.query(qry);
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
    const [result] = await con.query(qry, [category]);
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
    const[result] = await con.query(qry, [id]);
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
    WHERE category IN ${categories}
    ORDER BY RAND() 
    LIMIT ${n};`
    const [result] = await con.query(qry);
    return result;
}

module.exports = {
    setupQuestions,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    getAllQuestion,
    getByCategory,
    getByID
}


