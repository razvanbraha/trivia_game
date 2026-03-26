//--- HEADER ------------------------------------------------------------------
/** 
 * File teaching-game.js
 * 
 * Authors: Will Mungas, Connor Hekking
 * 
 * Script for a thread running a teaching game to execute - registers several 
 * callbacks to handle different events based on game state
 */ 
//--- INCLUDE -----------------------------------------------------------------

const {messages, sendWebSocketMessage, closeWebsocket, sendError} = require("../ws-server");
const {removeSession} = require("./sessions");
const questionsDB = require("../db_queries/questions-db");

/**
 * @author Will Mungas
 * 
 * Decides whether the game will accept a given message
 * 
 * @param {*} type the type of message
 * @returns true if the game will handle the message
 */
const accepts = (type) => {
    switch(type) {
        case messages.START:
        case messages.ANSWER:
        case messages.CONTINUE:
            return true;
        default: 
            return false;
    }
}

//--- OBJECT ---------------------------------------------------------------
// Declare this file as an object to be able to use multiple instances of it
class teachingGame {

    //--- CONSTANTS ---------------------------------------------------------------

    static STATES = {
        LOBBY: 1, // lobby state - awaiting game start 
        SHOW_QUESTION: 2, // state of each turn when game reveals the question
        SHOW_ANSWERS: 3, // state of each turn when game reveals answer choices
        RECEIVE_RESPONSES: 4, // state of each turn when game accepts responses
        AWAIT_NEXT: 5, // state of each turn when game waits for teacher to proceed & shows player progress
        FINAL: 6, // final state: game shows final results & waits for game to end
        ENDED: 7, // After final state, game is closed out
    }

    //--- STATE DATA -----------------------------------------------------------------

    // Given by sessions
    code = null; // Game join code
    host = null; // the host WebSocket connection
    type = null; // Type of game (should be "teaching")

    state = 0; // the current state
    players = []; // list of player WebSocket connections
    questions = []; // List of questions to be used by the game
    current_question_idx = 0; // Index of current question in game(increment on "CONTINUE")
    answers = new Map(); // Map{socket(player): List(answer #)} - list indicies correspond to questions list
    // -1 = no answer
    points = new Map(); // Map{socket(player): Number}
    current_correct_answer_number = -1; // Correct answer number (1/2/3/4)
    
    answering_start_time = null; // Date() of the time when the answering period/"live time" started

    signalContinue = null; // Function to resolve the promise making the main game flow(serveQuestions) wait for CONTINUE
    // Effectively, calling signalContinue() allows the main flow to continue with the next question

    // Game settings 
    MAX_QUESTIONS = 50;
    MIN_QUESTIONS = 5;
    NUM_CATEGORIES = 6;
    MAX_PREVIEW_TIME = 30;
    MIN_PREVIEW_TIME = 0;
    MAX_DEAD_TIME = 30;
    MIN_DEAD_TIME = 0;
    MAX_LIVE_TIME = 30;
    MIN_LIVE_TIME = 1;
    NO_ANSWER_NUM = -1;
    BASE_QUESTION_POINTS = 1000;

    AUTO_CONTINUE_TIMER = 120; // 2 mins
    AUTO_CLOSE_TIMER = 300; // 5 mins

    num_questions = 0;
    categories = [];
    preview_time = 0;
    dead_time = 0;
    live_time = 0;


    //--- FUNCTIONS ---------------------------------------------------------------

    /**
     * Entry point for a teaching session thread: initializes data, registers
     * callbacks for all events, start waiting in "Lobby" state
     * @param {} data common session data
     */
    constructor(data) {
        this.code = data.game_code;
        this.type = data.game_type;
        this.state = teachingGame.STATES.LOBBY;
    }

    sendAll(message) {
        if(this.host) {
            sendWebSocketMessage(this.host, message);
        }
        this.players.forEach((player) => {
            sendWebSocketMessage(player, message);
        });
    }

    /**
     * Handles processing an incoming WebSocket message from a user, validates
     * message format on our protocol
     * @param {WebSocket} socket Websocket which sent the request
     * @param {Object} message Message object containing the request
     */
    receiveMessage(socket, message) {
        try {
            const type = message.type;

            // Handle all messages
            switch(type) {
                case (messages.START):
                    if (this.state === teachingGame.STATES.LOBBY && socket === this.host) {
                        this.startGame(socket, message);
                    } else if(socket !== this.host) {
                        sendError(socket, "Only host can contiinue.");
                    } else {
                        sendError(socket, "Game has already started.");
                    }
                    break;
                case (messages.ANSWER):
                    if (this.state === teachingGame.STATES.RECEIVE_RESPONSES && socket !== this.host) {
                        this.registerAnswer(socket, message);
                    } else if(socket === this.host) {
                        sendError(socket, "Host cannot submit an answer.");
                    } else {
                        sendError(socket, "Game is not accepting answers.");
                    }
                    break;
                case (messages.CONTINUE):
                    if (this.state === teachingGame.STATES.AWAIT_NEXT && socket === this.host) {
                        this.advanceQuestion(socket, message);
                    } else if (this.state === teachingGame.STATES.FINAL && socket === this.host) {
                        this.endGame(socket, message);
                    } else if(socket !== this.host) {
                        sendError(socket, "Only host can continue.");
                    } else if(this.state === teachingGame.STATES.ENDED) {
                        sendError(socket, "Game has already ended.");
                    }
                    else {
                        sendError(socket, "Game has already started.");
                    }
                    break;
                default:
                    sendError(socket, "Message type is invalid.");
                    break;
            }
        } catch (error) {
            sendError(socket, "Message format is invalid.");
        }
        
    }

    /**
     * Handles user joining the game through a websocket connection
     * @param {WebSocket} socket
     */
    join(socket) {
        if (this.state !== teachingGame.STATES.LOBBY) {
            sendError(socket, "Game already started.");
            return;
        }

        socket.handler = this.receiveMessage.bind(this);
        socket.accepts = accepts;

        // First join = host, later joins = player
        if(this.host === null) {
            this.host = socket;
            console.log(`Session ${this.code}: host joined`);
            return;
        }

        // Add player entries to data
        this.players.push(socket);
        this.answers.set(socket, []);
        this.points.set(socket, 0);
        console.log(`Session ${this.code}: player ${this.players.length} joined`);
    }

    /**
     * Checks if the game settings
     * @param {WebSocket} socket Websocket making the request. Used for sending errors
     * @param {Number} num_questions Number of questions in the game
     * @param {Array} categories Array of numbers corresponding to categories included in the game
     * @param {Number} preview_time Time the question text is shown but not answers
     * @param {Number} dead_time Time the answers are shown but not answerable
     * @param {Number} live_time Time the question is live for answers
     * @returns true/false if the settings are valid
     */
    validateSettings(socket, num_questions, categories, preview_time, dead_time, live_time) {
        let valid = true;
        if(num_questions > this.MAX_QUESTIONS || num_questions < this.MIN_QUESTIONS) {
            sendError(socket, "Invalid setting: number of questions.");
            valid = false;
        }
        if(preview_time > this.MAX_PREVIEW_TIME || preview_time < this.MIN_PREVIEW_TIME) {
            sendError(socket, "Invalid setting: preview time.");
            valid = false;
        }
        if(dead_time > this.MAX_DEAD_TIME || dead_time < this.MIN_DEAD_TIME) {
            sendError(socket, "Invalid setting: dead time.");
            valid = false;
        }
        if(live_time > this.MAX_LIVE_TIME || live_time < this.MIN_LIVE_TIME) {
            sendError(socket, "Invalid setting: live time.");
            valid = false;
        }
        if(categories.length > this.NUM_CATEGORIES || categories.length < 1){
            sendError(socket, "Invalid setting: categories.");
            valid = false;
        }
        categories.forEach((categoryNum) => {
            if(categoryNum > this.NUM_CATEGORIES || categoryNum < 1){
                sendError(socket, "Invalid setting: categories.");
                valid = false;
                return;
            }
        });
        // Check duplicates
        if(new Set(categories).size !== categories.length) {
            sendError(socket, "Invalid setting: categories.");
            valid = false;
        }

        return valid
    }

    /**
     * Shuffles array randomly using
     * https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
     * @param {Array} array Array to be shuffled
     */
    static shuffle(array) {
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

    /**
     * Returns rankings of players, including their number rank and points value associated to their websocket.
     * @returns Map{Websocket: {rank: Number, points: Number}} (nested)
     */
    getRankings() {
       const rankings = new Map();
       const rankings_list = [];

       this.players.forEach((player) => {
            rankings_list.push({
                "player": player,
                "points": this.points.get(player),
            });
       });

       // Sort list in descending order of points
       rankings_list.sort((a, b) => {
            return b.points - a.points;
       });

       // Add the rankings value
       rankings_list.forEach((entry, index) => {
            entry.rank = index + 1;
        });

       // Reformat
       rankings_list.forEach((ranking) => {
            rankings.set(ranking.player, {
                "rank": ranking.rank,
                "points": ranking.points,
            });
       });

       return rankings;
    }

    /**
     * Configures settings from message, gets list of questions from database,
     * and sends out the first question.
     * @param {WebSocket} socket Host websocket which initiated the request
     * @param {Object} message Message object containing the request
     */
    async startGame(socket, message) {
        const num_questions = message.num_questions;
        const categories = message.categories;
        const preview_time = message.preview_time;
        const dead_time = message.dead_time;
        const live_time = message.live_time;

        const valid = this.validateSettings(socket, num_questions, categories, preview_time, dead_time, live_time);
        if(!valid) {
            return; // Do nothing
        }
        this.num_questions = num_questions;
        this.categories = categories;
        this.preview_time = preview_time;
        this.dead_time = dead_time;
        this.live_time = live_time;

        // Load questions & error check
        try {
            this.questions = await questionsDB.selectRandQuestions(categories, num_questions);
        } catch (e) {
            this.sendAll({
                "type": messages.ERROR,
                "message": "Questions could not be loaded succcessfully.",
            });
        }
        
        if(this.questions.length < count) {
            this.sendAll({
                "type": messages.ERROR,
                "message": "Not enough questions in Database. Expect unstable behavior.",
            });
        }

        // Start main game flow
        this.serveQuestions();
    }

    static delay(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }

    /**
     * Contains the main game flow of serving questions and answers, and managing delays.
     * See "Teaching Game Flow" https://drive.google.com/file/d/1Ot5iEwynpoNxzL3qfV24YOHXDSmfGL-P/view?usp=sharing
     */
    async serveQuestions() {
        let allRankings = null; // Declare for later use
        while(this.current_question_idx  < this.num_questions) {
            // Send QUESTION to host & players
            this.sendAll({
                "type": messages.QUESTION,
                "question_text": this.questions[this.current_question_idx].question,
                "question_number": this.current_question_idx + 1,
                "num_questions": this.num_questions,
            });

            this.state = teachingGame.STATES.SHOW_QUESTION;

            // Delay 1 - Show question
            await teachingGame.delay(1000 * this.preview_time);

            // Send CHOICES to host & players
            const question = this.questions[this.current_question_idx];
            const correct_answer = question.corrAnswer;
            const choices_list = [question.corrAnswer, question.incorrONE, question.incorrTWO, question.incorrTHREE];
            teachingGame.shuffle(choices_list);
            this.current_correct_answer_number = choices_list.indexOf(correct_answer) + 1;

            this.sendAll({
                "type": messages.CHOICES,
                "answer_choices": choices_list,
            });

            this.state = teachingGame.STATES.SHOW_ANSWERS;

            // Delay 2 - Show Answers
            await teachingGame.delay(1000 * this.dead_time);

            // Send READY
            this.sendAll({
                "type": messages.READY,
            });

            this.state = teachingGame.STATES.RECEIVE_RESPONSES;

            // Delay 3 - Accept Answers
            this.answering_start_time = new Date();
            await teachingGame.delay(1000 * this.live_time);

            // Fill in incorrect response(-1) for players who didn't answer
            this.players.forEach((player) => {
                if(this.answers.get(player)[this.current_question_idx] === undefined) {
                    this.answers.get(player)[this.current_question_idx] = this.NO_ANSWER_NUM;
                }
                // Don't need to add any points
            });


            // Send CLOSE
            allRankings = this.getRankings();
            sendWebSocketMessage(this.host, {
                "type": messages.CLOSE,
                "correct_answer_number": this.current_correct_answer_number,
                "current_player": null,
                "other_players": Array.from(allRankings.values()),
            });
            this.players.forEach((player) => {
                // Get other players
                const other_players = Array.from(allRankings) // Convert to array [[Websocket, {rank: Number, points: Number}], ...]
                                    .filter((entry) => entry[0] !== player) // Filter out this player
                                    .map(([ws, stats]) => stats); // Then map to a new array with just the data

                sendWebSocketMessage(player, {
                    "type": messages.CLOSE,
                    "correct_answer_number": this.current_correct_answer_number,
                    "current_player": allRankings.get(player),
                    "other_players": other_players,
                });
            });

            this.state = teachingGame.STATES.AWAIT_NEXT;

            // Wait for CONTINUE (advanceQuestion)
            await this.waitForContinue();

            // Increment question index
            this.current_question_idx = this.current_question_idx + 1;
        }

        // Send RESULTS
        allRankings = this.getRankings();
            sendWebSocketMessage(this.host, {
                "type": messages.RESULTS,
                "correct_answer_number": this.current_correct_answer_number,
                "current_player": null,
                "other_players": Array.from(allRankings.values()),
            });
            this.players.forEach((player) => {
                // Get other players
                const other_players = Array.from(allRankings) // Convert to array [[Websocket, {rank: Number, points: Number}], ...]
                                    .filter((entry) => entry[0] !== player) // Filter out this player
                                    .map(([ws, stats]) => stats); // Then map to a new array with just the data

                sendWebSocketMessage(player, {
                    "type": messages.RESULTS,
                    "correct_answer_number": this.current_correct_answer_number,
                    "current_player": allRankings.get(player),
                    "other_players": other_players,
                });
            });

        this.state = teachingGame.STATES.FINAL;

        // Now wait till CONTINUE to end game

        await teachingGame.delay(1000 * this.AUTO_CLOSE_TIMER);

        // If game not closed yet, do it manually
        if(this.state === teachingGame.STATES.FINAL) {
            this.endGame(this.host, null);
        }
    }

    /**
     * Registers a player's answer in the game state.
     * @param {WebSocket} socket Player websocket which initiated the request
     * @param {Object} message Message object containing the request
     */
    registerAnswer(socket, message) {
        const answer_number = message.answer_number;

        // Check invalid answer number
        if(answer_number > 4 || answer_number < 1) {
            sendError(socket, "Invalid answer number.");
            return;
        }

        // Stop duplicate answers
        if (this.answers.get(socket)[this.current_question_idx] !== undefined) {
            return;
        } 

        // Register answer
        this.answers.get(socket)[this.current_question_idx] = answer_number;
        // Add points
        if (answer_number === this.current_correct_answer_number) {
            const elapsed_time = new Date() - this.answering_start_time;
            const elapsed_seconds = elapsed_time / 1000; // Date() is in milliseconds

            // Points = ratio of elapsed time to live time, multiplied by the base number of points
            let points = ((this.live_time - elapsed_seconds) / this.live_time) * this.BASE_QUESTION_POINTS;
            points = Math.round(points); // Round to integer

            if(points < 0) {
                // Timed out, no points
                points = 0;
                // Set no answer because answer did not come in time
                this.answers.get(socket)[this.current_question_idx] = this.NO_ANSWER_NUM;
            }

            this.points.set(socket, this.points.get(socket) + points);
        }
    }

    /**
     * Called by main flow to wait for CONTINUE signal
     * @returns A promise waiting for something to call signalContinue()
     */
    waitForContinue() {
        return new Promise(resolve => {
            this.signalContinue = () => {
                clearTimeout(timeout);
                resolve();
            };

            // In case host disconnects, auto-continue
            const timeout = setTimeout(() => {
                this.signalContinue = null;
                resolve();
            }, this.AUTO_CONTINUE_TIMER * 1000);
        });
    }

    /**
     * Signals main game flow to send out next question.
     * @param {WebSocket} socket Host websocket which initiated the request
     * @param {Object} message Message object containing the request
     */
    advanceQuestion(socket, message) {
        if (this.signalContinue) {
            this.signalContinue();
            this.signalContinue = null; // Reset
        } else {
            sendError(socket, "Cannot send next question");
        }
    }

    

    /**
     * Sends out DONE signal then closes all connections
     * @param {WebSocket} socket Host websocket which initiated the request
     * @param {Object} message Message object containing the request
     */
    endGame(socket, message) {
        // Close host
        sendWebSocketMessage(this.host, {
            "type": messages.DONE,
        });
        closeWebsocket(this.host, 0, "Game finished.");
        // Close players
        this.players.forEach((player) => {
            sendWebSocketMessage(player, {
                "type": messages.DONE,
            });
            closeWebsocket(player, 0, "Game finished.");
        });

        this.state = teachingGame.STATES.ENDED;

        // Cleanup memory
        this.host.handler = null;
        this.players.forEach((player) => {player.handler = null});
        this.players = [];
        this.questions = [];
        this.answers.clear();
        this.points.clear();

        removeSession(this);
    }
}

//--- EXPORTS -----------------------------------------------------------------

module.exports.teachingGame = teachingGame;
