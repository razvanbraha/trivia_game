
module.exports = validateAdmin = (body) => {
    const { unityId } = body;
    let valid = true;
    let errors = [];

    if (!unityId || unityId.length > 8) {
        valid = false;
        errors.push("Invalid UnityId.");
    }

    if (!valid) {
        console.log(errors);
        return false;
    }
    return true;
}