//-----------------------------------------------------------------------------
/**
 * @file userAPI.js
 * @author 
 * TODO add authors
 * 
 * Handles operations on the api endpoint /api/users
 */
//-----------------------------------------------------------------------------



const express = require('express');
const path = require("node:path");
const validateUser = require('../db/user-validation')
const {
    addUser,
    updateUser,
    deleteUser,
    getAllUser,
    getByUnityId,
    getByID
} = require('../db/user-dao')

//Router Setup
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

//Templates Folder
const templatesFolder = path.join(__dirname, '../../frontend/templates');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

/**
 * Get users from database, all or by id/unityId if provided
 * @author Razvan Braha
 * @param {Object} id - OPTIONAL id of user to retrieve
 * @param {Object} unityId - OPTIONAL unityID of user to retrieve
 * @returns status OK & json list of users
 * @throws Error 500 if unable to connect with users db
 */
router.get('/populate', async (req, res) => {
    try {
        let qry = structuredClone(req.query)
        let users;
        if (Object.keys(qry).length === 0) {
            users = await getAllUser();
        } 
        else if (qry.id) {
            users = await getByID(qry.id);
        } else {
            users = await getByUnityId(qry.unityId);
        }
        res.status(200).json(users);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({error: 'Failed to fetch user'});
    }
});

/**
 * Add user to database
 * @author Razvan Braha
 * @param {Object} req.body - request body contains data of new user
 * @returns status OK & redirect to user page
 * @throws Error 400 if invalid user data
 * @throws Error 500 if unable to connect with user db
 */
router.post('/create', async (req, res) => {
    try {
        const { adminPassword } = req.body;
        if(adminPassword !== ADMIN_PASSWORD) {
            return res.status(403).json({ error: "You do not have permissions to do this"});
        }
        if (validateUser(req.body)) {
            await addUser(req.body);
            console.log("Received Data:", req.body);
            res.status(201).json({ message: "User added"});
        } else {
            res.status(400).json({error: "Unable to add user"});
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Unable to add user"});
    }
});

/**
 * Delete user from database
 * @author Razvan Braha & David Salinas
 * @route DELETE /api/users/delete
 * @param {Object} req.body.userID - ID of user to delete
 * @param {Object} req.body.unityID - unityID of user to delete
 * @param {String} req.body.adminPassword - admin password for authorization
 * @returns {200} if deletion successful
 * @returns {403} if:
 *  - admin password is incorrect
 *  - user attempts to delete themselves
 *  - target user has user privileges (protected user)
 * @throws {500} if database operation fails
 */
router.delete('/delete', async (req, res) => {
    try {
        const currentUser = req.headers["x-shib-uid"];
        const { userID, unityID, adminPassword } = req.body;

        if(adminPassword !== ADMIN_PASSWORD) {
            return res.status(403).json({ error: "You do not have permissions to do this"});
        }
        if(unityID === currentUser) {
            return res.status(403).json({ error: "You cannot delete yourself"});
        }
        const targetUserArr = await getByID(userID);
        const targetUser = Array.isArray(targetUserArr) ? targetUserArr[0] : targetUserArr;
        if(targetUser && targetUser.userPriv) {
            if(adminPassword !== ADMIN_PASSWORD) {
                return res.status(403).json({ error: "You cannot delete a user with user privileges"});
            }
        }
        await deleteUser(req.body.userID);
        console.log("Delete confirmed:", req.body.userID);
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Unable to delete user"})
    }
});

/**
 * Update existing user in database
 * @author Razvan Braha & David Salinas
 * @route PUT /api/users/update
 * @param {Object} req.body - request body contains updated user data
 * @param {Number} req.body.userID - ID of user to update
 * @param {String} req.body.unityID - updated unity ID
 * @param {Boolean} req.body.questionPriv - updated question privilege
 * @param {Boolean} req.body.userPriv - updated user privilege
 * @param {String} req.body.adminPassword - admin password for authorization
 * @returns {200} JSON success message if update succeeds
 * @returns {403} if:
 *  - admin password is incorrect
 *  - user attempts to modify themselves
 *  - target user has user privileges (protected user)
 * @throws {500} if database operation fails
 */
router.put('/update', async (req, res) => {
    try {
        const currentUser = req.headers["x-shib-uid"];
        const { userID, unityID, adminPassword } = req.body;
        if(adminPassword !== ADMIN_PASSWORD) {
            return res.status(403).json({ error: "You do not have permissions to do this"});
        }
        if(unityID === currentUser) {
            return res.status(403).json({ error: "You cannot modify yourself"});
        }
        const targetUserArr = await getByID(userID);
        const targetUser = Array.isArray(targetUserArr) ? targetUserArr[0] : targetUserArr;
        if(targetUser && targetUser.userPriv) {
            if(adminPassword !== ADMIN_PASSWORD) {
                return res.status(403).json({ error: "You cannot delete a user with user privileges"});
            }
        }

        await updateUser(req.body, req.body.userID);
        console.log("Update confirmed:", req.body.userID);
        res.status(200).json({ message: "User updated" });
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Unable to update user"})
    }
});

module.exports  = router;
