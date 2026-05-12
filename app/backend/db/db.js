//--- HEADER_------------------------------------------------------------------
/**
 * @file db.js
 * 
 * @description Database connection and query helpers.
 * 
 * @author Will Mungas
 */
//--- IMPORTS -----------------------------------------------------------------

// Load mariadb lazily because the rest of the backend uses CommonJS modules.
let mariadb;

//--- INTERNAL ----------------------------------------------------------------

let pool = null;

//--- FUNCTIONS ---------------------------------------------------------------

/**
 * @description Opens a connection to the database 
 * 
 * @author Will Mungas
 */
async function connect() {
    // Dynamically load the module if it hasn't been loaded yet
    // See comment in IMPORTS section
    if (!mariadb) {
        mariadb = await import('mariadb');
    }

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
async function close() {
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
async function query(query, params = "") {
    const pool = await connect();
    return pool.query(query, params).catch(e => {
        console.log(e);
        throw e;
    });
}

//--- EXPORT ------------------------------------------------------------------

module.exports = {
    query
};
