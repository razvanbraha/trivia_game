/**
 * Determines if the current user has teacher privileges
 * Checks developer list and shibboleth primary affiliation
 * 
 * @param {Object} req - Express request object
 * @author David Salinas
 * @returns {Boolean} true if user is teacher/authorized, false otherwise
 */
async function isTeacher(req) {
    const uid = req.headers["x-shib-uid"];
    const primary = req.headers["x-shib-primary"]

    // TODO add lavoine? This should probably be linked with user db in some way
    const devUsers = ["drsalin2", "wrmungas", "rmaalay", "rkwicken", "rbraha", "clhekkin"];
    if (devUsers.includes(uid)) {
        return true;
    }
    if (primary == "faculty") {
        return true;
    }
    try {
        const userArr = await getByUnityId(uid);
        const user = Array.isArray(userArr) ? userArr[0] : userArr;
        if(user && user.userPriv) {
            return true;
        }
    } catch (err) {
        console.error("Error checking user privileges: ", err);
    }
    return false;
}


/**
 * Middleware for pages protected to professor and TA
 * @access Protected (Professor and TA)
 * @returns HTML page if authorized
 * @redirects to /teacher if not authenticated
 * @author David Salinas
 * @returns 403 if user lacks teacher privileges
 */
async function shibMiddleware(req, res, next) {
    const user = req.headers["x-shib-uid"];
    
    if (!user) {
        return res.redirect("/teacher");
    }
    if (!(await isTeacher(req))) {
        return res.status(403).send("You need teacher/TA permission");
    }
    return next();
}

module.exports = shibMiddleware;