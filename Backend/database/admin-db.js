const path = require('node:path');
let mysql = require('mysql2');
require('dotenv').config({ path: path.join(__dirname, '../../.env')})

let con = mysql.createConnection({
    //Will need user account on vm 
    host: process.env.host,
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

const setupAdmins = () => {
    con.query("CREATE DATABASE IF NOT EXISTS trivia_admins", function (err, result) {
        if (err) {
            console.error(err.stack);
            return;
        }
        console.log("Database created");
    })
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

module.exports = addAdmin = (body) => {
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

module.exports = updateAdmin = (body, id) => {
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

module.exports = deleteAdmin = (id) => {
    let qry = `DELETE FROM admins WHERE adminID = ${id}`;
    con.query(qry, function (err, result) {
    if (err) {
        console.error(err.stack);
        return;
    }
        console.log(result);
    })
}

module.exports = getAllAdmins = () => {
    let qry = `SELECT * FROM admins`;
    con.query(qry, function (err, result) {
    if (err) {
        console.error(err.stack);
        return;
    }
        console.log(result);
    })
}

module.exports = getByUnityId = (unityId) => {
    let qry = `SELECT * FROM admins WHERE unityID = ${unityId}`;
    con.query(qry, function (err, result) {
    if (err) {
        console.error(err.stack);
        return;
    }
        console.log(result);
    })
}

module.exports = getByID = (id) => {
    let qry = `SELECT * FROM admins WHERE adminID = ${id}`;
    con.query(qry, function (err, result) {
    if (err) {
        console.error(err.stack);
        return;
    }
        console.log(result);
    })
}

setupAdmins();
getAllAdmins();
con.end();

