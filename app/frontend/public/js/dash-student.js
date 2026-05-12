
const joinRoomButton = document.querySelector('#joinRoomButton');
const launchStudyButton = document.querySelector('#launchStudyButton');

/**
 * Gets a random, non-existing name
 * @return name
 */
function getRandomName() {
    const nouns = [
    "Dog", "Cow", "Cat", "Horse", "Donkey", "Tiger", "Lion", "Panther", "Leopard", "Cheetah", "Bear", "Elephant", "Turtle", "Tortoise", "Crocodile",
    "Rabbit", "Porcupine", "Hare", "Hen", "Pigeon", "Albatross", "Crow", "Fish", "Dolphin", "Frog", "Whale", "Alligator", "Eagle", "Squirrel", "Ostrich", "Fox",
    "Goat", "Jackal", "Emu", "Armadillo", "Eel", "Goose", "Wolf", "Beagle", "Gorilla", "Chimpanzee", "Monkey", "Beaver", "Orangutan", "Antelope", "Bat",
    "Badger", "Giraffe", "Crab", "Panda", "Hamster", "Cobra", "Shark", "Camel", "Hawk", "Deer", "Chameleon", "Hippopotamus", "Jaguar", "Chihuahua", "Ibex",
    "Lizard", "Koala", "Kangaroo", "Iguana", "Llama", "Chinchilla", "Dodo", "Jellyfish", "Rhinoceros", "Hedgehog", "Zebra", "Possum", "Wombat", "Bison", "Bull", "Buffalo", 
    "Sheep", "Meerkat", "Mouse", "Otter", "Sloth", "Owl", "Vulture", "Flamingo", "Racoon", "Mole", "Duck", "Swan", "Lynx", "Elk", "Boar",
    "Lemur", "Baboon", "Mammoth", "Rat", "Snake", "Peacock"];
    
    // Start with random noun
    let name_str = nouns[Math.floor(Math.random() * nouns.length)];

    // Add 3 random digits
    for(let i = 0; i < 3; i++) {
        name_str += Math.floor(Math.random() * 10);
    }

    // No need to check for duplicates, join will reject in the rare case that there is an overlap
    return name_str
}

async function joinRoom() {
    const code = document.getElementById("roomCode").value.toUpperCase();
    let name = document.getElementById("playerName").value;

    // Handle empty name
    if(!name || name === '') {
        name = getRandomName();
    }

    // check that room is valid

    fetch(`/api/games/${code}`)
        .then((res) => {
            if(res.ok) {
                localStorage.setItem("room code", code);
                localStorage.setItem("player name", name);
                globalThis.location.href = "/api/play/teaching/player";
            }
            else {
                console.log(res);
                console.error(`Session does not exist for ${code}`);
            }
        });
}

function launchStudy() {
    globalThis.location.href = "/api/play/study";
}

joinRoomButton.onclick = joinRoom;
launchStudyButton.onclick = launchStudy;
