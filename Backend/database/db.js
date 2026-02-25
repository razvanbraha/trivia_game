const path = require('node:path');
let mysql = require('mysql2');
require('dotenv').config({ path: path.join(__dirname, '../../.env')})

let con = mysql.createConnection({
    host: process.env.host,
    //Will need user account on vm 
    user: process.env.user, 
    password: process.env.password,
});

con.connect(function(err) {
    if (err) {
        console.error(err.stack);
        return;
    }
    console.log("Connected!");
})

const setup = () => {
    con.query("CREATE DATABASE trivia_questions", function (err, result) {
        if (err) {
            console.error(err.stack);
            return;
        }
        console.log("Database created");
    })
    let qry =`CREATE TABLE questions (
        questionID INT AUTO_INCREMENT PRIMARY KEY,
        question VARCHAR(255) NOT NULL,
        corrAnswer VARCHAR(255) NOT NULL,
        incorrONE VARCHAR(255) NOT NULL,
        incorrTWO VARCHAR(255) NOT NULL,
        incorrTHREE VARCHAR(255) NOT NULL,
        category INT NOT NULL)`
    con.query(qry, function (err, result) {
        if (err) {
            console.error(err.stack);
            return;
        }
        console.log("Table Created");
    })
}

module.exports = addQuestion = (body) => {
    const {question, correctAnswer, wrongAnswer1, wrongAnswer2, wrongAnswer3, category} = body;

    let data = [question, correctAnswer, wrongAnswer1, wrongAnswer2, wrongAnswer3, category];
    let qry = `INSERT INTO questions (question, corrAnswer, incorrONE, incorrTWO, incorrTHREE, category) VALUES (?, ?, ?, ?, ?, ?)`;

    con.query(qry, data, function (err, result) {
        if (err) {
            console.error(err.stack);
            return;
        }
        console.log("Question inserted");
    })
}

module.exports = updateQuestion = (body, id) => {
    const {question, correctAnswer, wrongAnswer1, wrongAnswer2, wrongAnswer3, category} = body;

    let data = [question, correctAnswer, wrongAnswer1, wrongAnswer2, wrongAnswer3, category];
    let qry = `UPDATE questions SET
        question = ${question},
        corrAnswer = ${correctAnswer},
        incorrONE = ${wrongAnswer1},
        incorrTWO = ${wrongAnswer2},
        incorrTHREE = ${wrongAnswer3},
        category = ${category}
        WHERE questionID = ${id}`;

    con.query(qry, data, function (err, result) {
        if (err) {
            console.error(err.stack);
            return;
        }
        console.log(`Question ${id} updated`);
    })
}

module.exports = deleteQuestion = (id) => {
    let qry = `DELETE FROM questions WHERE questionID = ${id}`;
    con.query(qry, function (err, result) {
    if (err) {
        console.error(err.stack);
        return;
    }
        console.log(result);
    })
}

module.exports = getAllQuestion = () => {
    let qry = `SELECT * FROM questions`;
    con.query(qry, function (err, result) {
    if (err) {
        console.error(err.stack);
        return;
    }
        console.log(result);
    })
}

module.exports = getByCategory = (category) => {
    let qry = `SELECT * FROM questions WHERE category = ${category}`;
    con.query(qry, function (err, result) {
    if (err) {
        console.error(err.stack);
        return;
    }
        console.log(result);
    })
}

module.exports = getByID = (id) => {
    let qry = `SELECT * FROM questions WHERE questionID = ${id}`;
    con.query(qry, function (err, result) {
    if (err) {
        console.error(err.stack);
        return;
    }
        console.log(result);
    })
}

setup();
getAllQuestion();
con.end();

