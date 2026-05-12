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
    const {unityID, note, questionPriv, userPriv} = body;

    // first check that the user does not already exist in the system - no duplicates
    const chk_qry = `SELECT * FROM users WHERE unityID = ?`;
    
    return db.query(chk_qry, [unityID]).then(result => {
        if(result.length !== 0) {
            throw new Error("User already exists!");
        }

        const questionPrivBool = questionPriv === "on" || questionPriv === true || questionPriv === 1;
        const userPrivBool = userPriv === "on" || userPriv === true || userPriv === 1;

        const data = [unityID, note, questionPrivBool ? 1 : 0, userPrivBool ? 1: 0];
        const qry = `INSERT INTO users (unityID, note, questionPriv, userPriv) VALUES (?, ?, ?, ?)`;

        return db.query(qry, data);
        
        
    })
    .then(result => {
        return result.insertId;
    });
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
    const {questionPriv, userPriv} = body;

    const questionPrivBool = questionPriv === "on" || questionPriv === true || questionPriv === 1;
    const userPrivBool = userPriv === "on" || userPriv === true || userPriv === 1;

    let data = [unityID, questionPrivBool ? 1 : 0, userPrivBool ? 1 : 0, id];
    let qry = `UPDATE users
               SET questionPriv = ?, userPriv = ? 
               WHERE userID = ?`;

    const result = await db.query(qry, data);
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
    return results;
}

/**
 * Retreive users from database with matching unityID. If there is more than one,
 * this is an error for the caller to handle
 * @author Riley Wickens & Razvan Braha
 * @param {Number} unityId - unity ID of user to retreive
 * @returns all users with matching unity id
 * @throws {err} if connection/query fails
 */
const getByUnityId = async (unityId) => {
    let qry = `SELECT * FROM users WHERE unityID = ?`;
    const results = await db.query(qry, [unityId]);
    return results;
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
