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

// include ws_api as an ES module
import ws_api from "../ws-api.js";

const questionsDB = require("../db_queries/questions-db");


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

    // setting limits as ranges
    static RANGES = {
        QUESTIONS: {
            MIN: 5,
            MAX: 50
        },
        PREVIEW_TIME: {
            MIN: 30,
            MAX: 0,
        },
        DEAD_TIME: {
            MIN: 0,
            MAX: 30
        },
        LIVE_TIME: {
            MIN: 1,
            MAX: 30
        },
        CATEGORIES: {
            MIN: 1,
            MAX: 6
        }
    }
        
    // other internal settings

    static NO_ANSWER_NUM = -1;
    static BASE_QUESTION_POINTS = 1000;
    static AUTO_CONTINUE_TIMER = 120; // 2 mins
    static AUTO_CLOSE_TIMER = 300; // 5 mins

    //--- STATE DATA -----------------------------------------------------------------

    // Given by sessions
    code = null; // Game join code
    host = null; // the host WebSocket connection
    type = null; // Type of game (should be "teaching")
    start_time = null; // Start time of the game(for auto-closing)

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

    // user-visible settings
    settings = {
        num_questions: 0,
        categories: [],
        preview_time: 0,
        dead_time: 0,
        live_time: 0,
    };
    
    // signal handler: map of signal names to functions with the signature
    // (ws, body) => void to handle the signal
    handler = {};

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
        this.start_time = data.start_time;

        // set up handler
        this.handler[ws_server.signals.START.id] = (ws, body) => {
            if (this.state === teachingGame.STATES.LOBBY && ws === this.host) {
                this.startGame(ws, body);
            } else if(ws !== this.host) {
                ws_server.sendError(ws, "Only host can contiinue.");
            } else {
                ws_server.sendError(ws, "Game has already started.");
            }
        }

        this.handler[ws_server.signals.ANSWER.id] = (ws, body) => {
            if (this.state === teachingGame.STATES.RECEIVE_RESPONSES && ws !== this.host) {
                this.registerAnswer(ws, body);
            } else if(ws === this.host) {
                sendError(ws, "Host cannot submit an answer.");
            } else {
                sendError(ws, "Game is not accepting answers.");
            }
        }

        this.handler[ws_server.signals.CONTINUE.id] = (ws, body) => {
            if (this.state === teachingGame.STATES.AWAIT_NEXT && ws === this.host) {
                this.advanceQuestion(ws, body);
            } else if (this.state === teachingGame.STATES.FINAL && ws === this.host) {
                this.endGame(ws, body);
            } else if(ws !== this.host) {
                sendError(ws, "Only host can continue.");
            } else if(this.state === teachingGame.STATES.ENDED) {
                sendError(ws, "Game has already ended.");
            }
            else {
                sendError(ws, "Game has already started.");
            }
        }
    }

    /**
     * @author Connor Hekking, Will Mungas
     * @description sends a signal to all connected websockets
     * @param sig signal type (must be from ws_server.signals)
     * @param msg body of the signal (must be an object with valid fields)
     */
    sendAll(sig, msg) {
        if(this.host) {
            ws_server.send(this.host, sig, msg);
        }
        this.players.forEach((player) => {
            ws_server.send(player, sig, msg);
        });
    }

    /**
     * Handles user joining the game through a websocket connection
     * @param {WebSocket} ws
     */
    join(ws) {
        if (this.state !== teachingGame.STATES.LOBBY) {
            ws_server.sendError(ws, "Game already started.");
            return;
        }

        ws.on("message", (data) => {ws_server.receive(ws, this.handler, data)})

        // First join = host, later joins = player
        if(this.host === null) {
            this.host = ws;
            console.log(`Session ${this.code}: host joined`);
            return;
        }

        // Add player entries to data
        this.players.push(ws);
        this.answers.set(ws, []);
        this.points.set(ws, 0);
        console.log(`Session ${this.code}: player ${this.players.length} joined`);
    }

    /**
     * Checks if the game settings
     * @param {WebSocket} ws Websocket making the request. Used for sending errors
     * @param {Number} num_questions Number of questions in the game
     * @param {Array} categories Array of numbers corresponding to categories included in the game
     * @param {Number} preview_time Time the question text is shown but not answers
     * @param {Number} dead_time Time the answers are shown but not answerable
     * @param {Number} live_time Time the question is live for answers
     * @returns true/false if the settings are valid
     */
    validateSettings(ws, num_questions, categories, preview_time, dead_time, live_time) {
        const inRange = (a, range) => {
            return a <= range.MAX && a >= range.MIN;
        }

        let valid = true;
        if(!inRange(num_questions, RANGES.QUESTIONS)) {
            ws_server.sendError(ws, "Invalid setting: number of questions.");
            valid = false;
        }
        if(!inRange(preview_time, RANGES.PREVIEW_TIME)) {
            ws_server.sendError(ws, "Invalid setting: preview time.");
            valid = false;
        }
        if(!inRange(dead_time, RANGES.DEAD_TIME)) {
            ws_server.sendError(ws, "Invalid setting: dead time.");
            valid = false;
        }
        if(!inRange(live_time, RANGES.LIVE_TIME)) {
            ws_server.sendError(ws, "Invalid setting: live time.");
            valid = false;
        }
        if(!inRange(categories.length, RANGES.CATEGORIES)) {
            ws_server.sendError(ws, "Invalid setting: categories.");
            valid = false;
        }
        // Check duplicates
        if(new Set(categories).size !== categories.length) {
            ws_server.sendError(ws, "Invalid setting: categories.");
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
     * @param {WebSocket} ws Host websocket which initiated the request
     * @param {Object} body Message object containing the request
     */
    async startGame(ws, body) {
        const num_questions = message.body.num_questions;
        const categories = message.body.categories;
        const preview_time = message.body.preview_time;
        const dead_time = message.body.dead_time;
        const live_time = message.body.live_time;

        const valid = this.validateSettings(ws, num_questions, categories, preview_time, dead_time, live_time);
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

            // Send DONE
            allRankings = this.getRankings();
            ws_server.send(this.host, ws_server.signals.DONE, {
                correct_answer_num: this.current_correct_answer_number,
                player_you: null,
                player_data: Array.from(allRankings.values())
            });
            this.players.forEach((player) => {
                ws_server.send(player, ws_server.signals.DONE, {
                    correct_answer_num: this.current_correct_answer_number,
                    player_you: allRankings.get(player),
                    player_data: null
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

        ws_server.send(this.host, ws_server.signals.RESULTS, {
            correct_answer_num: this.current_correct_answer_number,
            data_you: null,
            data_all: Array.from(allRankings.values()),
        });
        this.players.forEach((player) => {
            ws_server.send(player, ws_server.signals.RESULTS, {
                correct_answer_num: this.current_correct_answer_number,
                data_you: allRankings.get(player),
                data_all: null
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
     * @param {WebSocket} ws Player websocket which initiated the request
     * @param {Object} message Message object containing the request
     */
    registerAnswer(ws, message) {
        const answer_number = message.body.answer_number;

        // Check invalid answer number
        if(answer_number > 4 || answer_number < 1) {
            ws_server.sendError(ws, "Invalid answer number.");
            return;
        }

        // Stop duplicate answers
        if (this.answers.get(ws)[this.current_question_idx] !== undefined) {
            return;
        } 

        // Register answer
        this.answers.get(ws)[this.current_question_idx] = answer_number;
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
                this.answers.get(ws)[this.current_question_idx] = this.NO_ANSWER_NUM;
            }

            this.points.set(ws, this.points.get(ws) + points);
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
     * @param {WebSocket} ws Host websocket which initiated the request
     * @param {Object} message Message object containing the request
     */
    advanceQuestion(ws, message) {
        if (this.signalContinue) {
            this.signalContinue();
            this.signalContinue = null; // Reset // this is interesting but probably a better way to do this is with a flag?
        } else {
            ws_server.sendError(ws, "Cannot send next question");
        }
    }

    

    /**
     * Sends out DONE signal then closes all connections
     * @param {WebSocket} ws Host websocket which initiated the request
     * @param {Object} message Message object containing the request
     */
    endGame(ws, message) {
        // Close host
        ws_server.send(this.host, ws_server.signals.GAMEOVER, {});
        ws_server.close(this.host, "Game finished.");
        // Close players
        this.players.forEach((player) => {
            ws_server.send(player, ws_server.signals.GAMEOVER, {});
            ws_server.close(player, "Game finished.");
        });

        this.state = teachingGame.STATES.ENDED;

        // Cleanup memory
        this.host.handler = null;
        this.players.forEach((player) => {player.handler = null});
        this.players = [];
        this.questions = [];
        this.answers.clear();
        this.points.clear();
    }
}

//--- EXPORTS -----------------------------------------------------------------

module.exports.teachingGame = teachingGame;
