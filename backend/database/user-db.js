const path = require('node:path');
let mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../../.env')})

 //Setup initial sql connection
let con; 

/**
 * Setup Admins database & table if none exists.
 * @author Riley Wickens & Razvan Braha
 * @throws {err} if connection/query fails
 */
const setupUsers = async () => {

    // Create database if needed
    const rootCon = await mysql.createConnection({
        host: process.env.host, 
        user: process.env.user,
        password: process.env.password
    });
    await rootCon.query('CREATE DATABASE IF NOT EXISTS trivia_admins');
    await rootCon.end();

    //Connect to mySQL (with database)
    con = await mysql.createConnection({
        //Will need user account on vm 
        host: process.env.host,
        user: process.env.user, 
        password: process.env.password,
        database: process.env.database
    });

    // Create table if it doesn't exist
    const createTableSql = 
        `CREATE TABLE IF NOT EXISTS admins (
        adminID INT AUTO_INCREMENT PRIMARY KEY,
        unityID VARCHAR(255) NOT NULL,
        questionPriv BOOLEAN NOT NULL DEFAULT FALSE,
        userPriv BOOLEAN NOT NULL DEFAULT FALSE
        )`

    await con.query(createTableSql);
}

/**
 * Add admin to database.
 * @author Riley Wickens & Razvan Braha
 * @param {Array} body - Array with data to be added to db
 * @throws {err} if connection/query fails
 */
const addUser = async (body) => {
    const {unityID, questionPriv, userPriv} = body;

    const questionPrivBool = questionPriv === "on" || questionPriv === true || questionPriv === 1;
    const userPrivBool = userPriv === "on" || userPriv === true || userPriv === 1;

    let data = [unityID, questionPrivBool ? 1 : 0, userPrivBool ? 1: 0];
    let qry = `INSERT INTO admins (unityID, questionPriv, userPriv) VALUES (?, ?, ?)`;

    const [result] = await con.query(qry, data);
    return result.insertId;
}

/**
 * Update admin in database.
 * @author Riley Wickens & Razvan Braha
 * @param {Array} body - Array w/ data to be added to db
 * @param {Number} id - Admin ID of admin to update
 * @throws {err} if connection/query fails
 */
const updateUser = async (body, id) => {
    const {unityID, questionPriv, userPriv} = body;

    const questionPrivBool = questionPriv === "on" || questionPriv === true || questionPriv === 1;
    const userPrivBool = userPriv === "on" || userPriv === true || userPriv === 1;

    let data = [unityID, questionPrivBool ? 1 : 0, userPrivBool ? 1 : 0, id];
    let qry = `UPDATE admins 
        SET unityID = ?, questionPriv = ?, userPriv = ?
        WHERE adminID = ?`;

    const [result] = await con.query(qry, data);
    return result.affectedRows;
}

/**
 * Delete question from database.
 * @author Riley Wickens & Razvan Braha
 * @param {Number} id - Question ID of question to delete
 * @throws {err} if connection/query fails
 */
const deleteUser = async (id) => {
    let qry = `DELETE FROM admins WHERE adminID = ?`;
    let [result] = await con.query(qry, [id]);
    return result.affectedRows;
}

/**
 * Retreive all admins from database.
 * @author Riley Wickens & Razvan Braha
 * @throws {err} if connection/query fails
 */
const getAllUser = async () => {
    let qry = `SELECT * FROM admins`;
    const [result] = await con.query(qry);
    return result;
}

/**
 * Retreive admin from database with matching unityID.
 * @author Riley Wickens & Razvan Braha
 * @param {Number} unityId - unity ID of admin to retreive
 * @throws {err} if connection/query fails
 */
const getByUnityId = async (unityId) => {
    let qry = `SELECT * FROM admins WHERE unityID = ?`;
    const [result] = await con.query(qry, [unityId]);
    return result;
}

/**
 * Retreive admin from database with matching id.
 * @author Riley Wickens & Razvan Braha
 * @param {Number} id - ID of admin to retreive
 * @throws {err} if connection/query fails
 */
const getByID = async (id) => {
    let qry = `SELECT * FROM admins WHERE adminID = ?`;
    const [result] = await con.query(qry, [id]);
    return result;
}

module.exports = {
    setupUsers,
    addUser,
    updateUser, 
    deleteUser,
    getAllUser,
    getByUnityId,
    getByID
}
