const path = require('node:path');
let mysql = require('mysql2');
require('dotenv').config({ path: path.join(__dirname, '../../.env')})

//Setup inital sql connection
let con = mysql.createConnection({
    //Will need user account on vm 
    host: process.env.host,
    user: process.env.user, 
    password: process.env.password,
});

//Connect to mySQL (no database)
con.connect(function(err) {
    if (err) {
        console.error(err.stack);
        return;
    }
    console.log("Connected!");
})

/**
 * Setup Questions database & table if none exists.
 * @author Riley Wickens & Razvan Braha
 * @throws {err} if connection/query fails
 */
const setupQuestions = () => {
    con.query("CREATE DATABASE IF NOT EXISTS trivia_questions", function (err, result) {
        if (err) {
            console.error(err.stack);
            return;
        }
        console.log("Database created");
    })
    //Connect to mySQL (with database)
    con = mysql.createConnection({
        //Will need user account on vm 
        host: process.env.host,
        user: process.env.user, 
        password: process.env.password,
        database: process.env.database
    });
    let qry =`CREATE TABLE IF NOT EXISTS questions (
        questionID INT AUTO_INCREMENT PRIMARY KEY,
        question VARCHAR(255) NOT NULL,
        corrAnswer VARCHAR(255) NOT NULL,
        incorrONE VARCHAR(255) NOT NULL,
        incorrTWO VARCHAR(255) NOT NULL,
        incorrTHREE VARCHAR(255) NOT NULL,
        category INT NOT NULL,
        isAI BOOLEAN NOT NULL DEFAULT FALSE)`
    con.query(qry, function (err, result) {
        if (err) {
            console.error(err.stack);
            return;
        }
        console.log("Table Created");
    })
}

/**
 * Add question to database.
 * @author Riley Wickens & Razvan Braha
 * @param {Array} body - Array with data to be added to db
 * @throws {err} if connection/query fails
 */
const addQuestion = (body) => {
    const {question, correctAnswer, wrongAnswer1, wrongAnswer2, wrongAnswer3, category, ai} = body;

    let data = [question, correctAnswer, wrongAnswer1, wrongAnswer2, wrongAnswer3, category, ai];
    let qry = `INSERT INTO questions (question, corrAnswer, incorrONE, incorrTWO, incorrTHREE, category, isAI) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    con.query(qry, data, function (err, result) {
        if (err) {
            console.error(err.stack);
            return;
        }
        console.log("Question inserted");
    })
}

/**
 * Update question in database.
 * @author Riley Wickens & Razvan Braha
 * @param {Array} body - Array w/ data to be added to db
 * @param {Number} id - Question ID of question to update
 * @throws {err} if connection/query fails
 */
const updateQuestion = (body, id) => {
    const {question, correctAnswer, wrongAnswer1, wrongAnswer2, wrongAnswer3, category, ai} = body;

    let data = [question, correctAnswer, wrongAnswer1, wrongAnswer2, wrongAnswer3, category, ai];
    let qry = `UPDATE questions SET
        question = ${question},
        corrAnswer = ${correctAnswer},
        incorrONE = ${wrongAnswer1},
        incorrTWO = ${wrongAnswer2},
        incorrTHREE = ${wrongAnswer3},
        category = ${category},
        isAI = ${ai}
        WHERE questionID = ${id}`;

    con.query(qry, data, function (err, result) {
        if (err) {
            console.error(err.stack);
            return;
        }
        console.log(`Question ${id} updated`);
    })
}

/**
 * Delete question from database.
 * @author Riley Wickens & Razvan Braha
 * @param {Number} id - Question ID of question to delete
 * @throws {err} if connection/query fails
 */
const deleteQuestion = (id) => {
    let qry = `DELETE FROM questions WHERE questionID = ${id}`;
    con.query(qry, function (err, result) {
    if (err) {
        console.error(err.stack);
        return;
    }
        console.log(result);
    })
}

/**
 * Retreive all questions from database.
 * @author Riley Wickens & Razvan Braha
 * @throws {err} if connection/query fails
 */
//TODO: Return GET
const getAllQuestion = () => {
    let qry = `SELECT * FROM questions`;
    con.query(qry, function (err, result) {
    if (err) {
        console.error(err.stack);
        return;
    }
        console.log(result);
    })
}

/**
 * Retreive questions from database with matching category.
 * @author Riley Wickens & Razvan Braha
 * @param {Number} category - category of questions to retreive
 * @throws {err} if connection/query fails
 */
//TODO: Return GET
const getByCategory = (category) => {
    let qry = `SELECT * FROM questions WHERE category = ${category}`;
    con.query(qry, function (err, result) {
    if (err) {
        console.error(err.stack);
        return;
    }
        console.log(result);
    })
}

/**
 * Retreive questions from database with matching ID.
 * @author Riley Wickens & Razvan Braha
 * @param {Number} category - ID of question to retreive
 * @throws {err} if connection/query fails
 */
//TODO: Return GET
const getByID = (id) => {
    let qry = `SELECT * FROM questions WHERE questionID = ${id}`;
    con.query(qry, function (err, result) {
    if (err) {
        console.error(err.stack);
        return;
    }
        console.log(result);
    })
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

setupQuestions();
getAllQuestion();
con.end();

