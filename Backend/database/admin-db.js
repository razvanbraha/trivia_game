const path = require('node:path');
let mysql = require('mysql2');
require('dotenv').config({ path: path.join(__dirname, '../../.env')})

 //Setup initial sql connection
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
 * Setup Admins database & table if none exists.
 * @author Riley Wickens & Razvan Braha
 * @throws {err} if connection/query fails
 */
const setupAdmins = () => {
    con.query("CREATE DATABASE IF NOT EXISTS trivia_admins", function (err, result) {
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
    let qry =`CREATE TABLE IF NOT EXISTS admins (
        adminID INT AUTO_INCREMENT PRIMARY KEY,
        unityID VARCHAR(255) NOT NULL)`
    con.query(qry, function (err, result) {
        if (err) {
            console.error(err.stack);
            return;
        }
        console.log("Table Created");
    })
}

/**
 * Add admin to database.
 * @author Riley Wickens & Razvan Braha
 * @param {Array} body - Array with data to be added to db
 * @throws {err} if connection/query fails
 */
const addAdmin = (body) => {
    const {unityID} = body;

    let data = [unityID];
    let qry = `INSERT INTO admins (unityID) VALUES (?)`;

    con.query(qry, data, function (err, result) {
        if (err) {
            console.error(err.stack);
            return;
        }
        console.log("Admin added");
    })
}

/**
 * Update admin in database.
 * @author Riley Wickens & Razvan Braha
 * @param {Array} body - Array w/ data to be added to db
 * @param {Number} id - Admin ID of admin to update
 * @throws {err} if connection/query fails
 */
const updateAdmin = (body, id) => {
    const {unityID} = body;

    let data = [unityID];
    let qry = `UPDATE admins SET
        unityID = ${unityID},
        WHERE adminID = ${id}`;

    con.query(qry, data, function (err, result) {
        if (err) {
            console.error(err.stack);
            return;
        }
        console.log(`Admin ${id} updated`);
    })
}

/**
 * Delete question from database.
 * @author Riley Wickens & Razvan Braha
 * @param {Number} id - Question ID of question to delete
 * @throws {err} if connection/query fails
 */
const deleteAdmin = (id) => {
    let qry = `DELETE FROM admins WHERE adminID = ${id}`;
    con.query(qry, function (err, result) {
    if (err) {
        console.error(err.stack);
        return;
    }
        console.log(result);
    })
}

/**
 * Retreive all admins from database.
 * @author Riley Wickens & Razvan Braha
 * @throws {err} if connection/query fails
 */
//TODO: Return GET
const getAllAdmins = () => {
    let qry = `SELECT * FROM admins`;
    con.query(qry, function (err, result) {
    if (err) {
        console.error(err.stack);
        return;
    }
        console.log(result);
    })
}

/**
 * Retreive admin from database with matching unityID.
 * @author Riley Wickens & Razvan Braha
 * @param {Number} unityId - unity ID of admin to retreive
 * @throws {err} if connection/query fails
 */
//TODO: Return GET
const getByUnityId = (unityId) => {
    let qry = `SELECT * FROM admins WHERE unityID = ${unityId}`;
    con.query(qry, function (err, result) {
    if (err) {
        console.error(err.stack);
        return;
    }
        console.log(result);
    })
}

/**
 * Retreive admin from database with matching id.
 * @author Riley Wickens & Razvan Braha
 * @param {Number} id - ID of admin to retreive
 * @throws {err} if connection/query fails
 */
//TODO: Return GET
const getByID = (id) => {
    let qry = `SELECT * FROM admins WHERE adminID = ${id}`;
    con.query(qry, function (err, result) {
    if (err) {
        console.error(err.stack);
        return;
    }
        console.log(result);
    })
}

module.exports = {
    setupAdmins,
    addAdmin,
    updateAdmin, 
    deleteAdmin,
    getAllAdmins,
    getByUnityId,
    getByID
}

setupAdmins();
getAllAdmins();
con.end();

