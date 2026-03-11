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

const router = express.Router();
router.use(express.json());
router.use(express.static(path.join(__dirname, "../../frontend/public")));
router.use(express.urlencoded({ extended: true }));

const templatesFolder = path.join(__dirname, '../../frontend/templates');

router.get('/users', async (req, res) => {
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

router.post('/users', async (req, res) => {
    try {
        if (validateUser(req.body)) {
            await addUser(req.body);
            console.log("Received Data:", req.body);
            res.redirect('/templates/user-manage.html');
        } else {
            res.status(400).json({error: "Unable to add user"});
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Unable to add user"});
    }
});

router.delete('/users', async (req, res) => {
    try {
        await deleteUser(req.body.userID);
        console.log("Delete confirmed:", req.body.userID);
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Unable to delete user"})
    }
});

router.put('/users', async (req, res) => {
    try {
        await updateUser(req.body, req.body.userId);
        console.log("Update confirmed:", req.body.userId);
        res.redirect('/templates/user-manage.html');
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Unable to update user"})
    }
});

module.exports  = router;
