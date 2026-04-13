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
 * Add user to database.
 * @author Riley Wickens & Razvan Braha
 * @param {Array} body - Array with data to be added to db
 * @returns new user id
 * @throws {err} if connection/query fails
 */
const addUser = async (body) => {
    const {unityID, questionPriv, userPriv} = body;

    const questionPrivBool = questionPriv === "on" || questionPriv === true || questionPriv === 1;
    const userPrivBool = userPriv === "on" || userPriv === true || userPriv === 1;

    let data = [unityID, questionPrivBool ? 1 : 0, userPrivBool ? 1: 0];
    let qry = `INSERT INTO users (unityID, questionPriv, userPriv) VALUES (?, ?, ?)`;

    const result = await db.query(qry, data);
    console.log("Add user query result: ", result);
    return result.insertId;
}

/**
 * Update user in database.
 * @author Riley Wickens & Razvan Braha
 * @param {Array} body - Array w/ data to be added to db
 * @param {Number} id - User ID of user to update
 * @returns updated user
 * @throws {err} if connection/query fails
 */
const updateUser = async (body, id) => {
    const {unityID, questionPriv, userPriv} = body;

    const questionPrivBool = questionPriv === "on" || questionPriv === true || questionPriv === 1;
    const userPrivBool = userPriv === "on" || userPriv === true || userPriv === 1;

    let data = [unityID, questionPrivBool ? 1 : 0, userPrivBool ? 1 : 0, id];
    let qry = `UPDATE users
               SET unityID = ?, questionPriv = ?, userPriv = ? 
               WHERE userID = ?`;

    const result = await db.query(qry, data);
    console.log("Update user query result: ", result);
    return result.affectedRows;
}

/**
 * Delete question from database.
 * @author Riley Wickens & Razvan Braha
 * @param {Number} id - Question ID of question to delete
 * @returns deleted user
 * @throws {err} if connection/query fails
 */
const deleteUser = async (id) => {
    let qry = `DELETE FROM users WHERE userID = ?`;
    const result = await db.query(qry, [id]);
    console.log("Delete user query result: ", result);
    return result.affectedRows;
}

/**
 * Retreive all users from database.
 * @author Riley Wickens & Razvan Braha
 * @returns all users
 * @throws {err} if connection/query fails
 */
const getAllUser = async () => {
    let qry = `SELECT * FROM users`;
    const results = await db.query(qry);
    console.log("Get all users query results: ", results);
    return results;
}

/**
 * Retreive users from database with matching unityID.
 * @author Riley Wickens & Razvan Braha
 * @param {Number} unityId - unity ID of user to retreive
 * @returns all users with matching unity id
 * @throws {err} if connection/query fails
 */
const getByUnityId = async (unityId) => {
    let qry = `SELECT * FROM users WHERE unityID = ?`;
    const results = await db.query(qry, [unityId]);
    console.log("Get user by unity id results: ", results);

    // TODO some verification

    return [results];
}

/**
 * Retreive user from database with matching id.
 * @author Riley Wickens & Razvan Braha
 * @param {Number} id - ID of user to retreive
 * @returns all users with matching userID
 * @throws {err} if connection/query fails
 */
const getByID = async (id) => {
    let qry = `SELECT * FROM users WHERE userID = ?`;
    const results = await db.query(qry, [id]);
    console.log("Get user by id results: ", results);

    // TODO some verification

    return [results];
}

module.exports = {
    addUser,
    updateUser, 
    deleteUser,
    getAllUser,
    getByUnityId,
    getByID
}
