//--- HEADER_------------------------------------------------------------------
/**
 * @file db.js
 * 
 * @description Consolidate original split database files into one set of
 * connection and access functions - code more or less taken from Web Dev 
 * (CSC 342) credit to Dr. Ignacio Dominguez
 * 
 * @author Will Mungas
 */
//--- IMPORTS -----------------------------------------------------------------

const mariadb = require('mariadb');

//--- INTERNAL ----------------------------------------------------------------

let pool = null;

//--- FUNCTIONS ---------------------------------------------------------------

/**
 * @description Opens a connection to the database 
 * 
 * @author Will Mungas
 */
function connect() {
    if(!pool) {
        pool = mariadb.createPool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
            charset: process.env.DB_CHARSET
        });
    }

    return pool;
}

/**
 * @description Closes a connection to the database
 * 
 * @author Will Mungas
 */
function close() {
    if(pool) {
        pool.end();
        pool = null;
    }
}

/**
 * @description Executes a query to the database
 * 
 * @author Will Mungas
 * 
 * @param {*} query SQL query with parameters escaped with '?'
 * @param {*} params array of parameters to insert
 */
function query(query, params = "") {
    const pool = connect();
    return pool.query(query, params).catch(e => {
        console.log(e);
        throw e;
    });
}

//--- EXPORT ------------------------------------------------------------------

module.exports = {
    connect, 
    query,
    close
};