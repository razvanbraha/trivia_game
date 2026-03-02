
module.exports = validateUser = (body) => {
    const { unityID } = body;
    let valid = true;
    let errors = [];

    if (!unityID || unityID.length > 8) {
        valid = false;
        errors.push("Invalid UnityID.");
    }

    if (!valid) {
        console.log(errors);
        return false;
    }
    return true;
}
