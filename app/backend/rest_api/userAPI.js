const express = require('express');
const path = require("node:path");
const validateUser = require('../db_queries/user-validation')
const {
    addUser,
    updateUser,
    deleteUser,
    getAllUser,
    getByUnityId,
    getByID
} = require('../db_queries/user-db')

//Router Setup
const router = express.Router();
router.use(express.json());
router.use(express.static(path.join(__dirname, "../../frontend/public")));
router.use(express.urlencoded({ extended: true }));

//Templates Folder
const templatesFolder = path.join(__dirname, '../../frontend/templates');

/**
 * Get users from database, all or by id/unityId if provided
 * @author Razvan Braha
 * @param {Object} id - OPTIONAL id of user to retrieve
 * @param {Object} unityId - OPTIONAL unityID of user to retrieve
 * @returns status OK & json list of users
 * @throws Error 500 if unable to connect with users db
 */
router.get('/', async (req, res) => {
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
router.post('/', async (req, res) => {
    try {
        if (validateUser(req.body)) {
            await addUser(req.body);
            console.log("Received Data:", req.body);
            res.redirect('/templates/teacher-user-manage.html');
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
 * @author Razvan Braha
 * @param {Object} req.body.userID - request body contains id of user to delete
 * @returns status OK
 * @throws Error 500 if unable to connect with user db or user doesn't exist
 */
router.delete('/', async (req, res) => {
    try {
        await deleteUser(req.body.userID);
        console.log("Delete confirmed:", req.body.userID);
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Unable to delete user"})
    }
});

/**
 * Update existing user
 * @author Razvan Braha
 * @param {Object} req.body - request body contains new data for user
 * @param {Object} req.body.userId - request body contains id of user to update
 * @returns status OK & redirect to user page
 * @throws Error 500 if unable to connect with user db or user doesn't exist
 */
router.put('/', async (req, res) => {
    try {
        await updateUser(req.body, req.body.userId);
        console.log("Update confirmed:", req.body.userId);
        res.redirect('/templates/teacher-user-manage.html');
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Unable to update user"})
    }
});

module.exports  = router;
