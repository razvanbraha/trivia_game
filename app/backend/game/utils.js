
/**
 * Shuffles array randomly using
 * https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
 * @param {Array} array Array to be shuffled
 */
function shuffle(array) {
    let currentIndex = array.length;

    // While there remain elements to shuffle
    while (currentIndex != 0) {

        // pick a remaining element
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // and swap it with the current element
        [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
}


module.exports = {
    shuffle
}