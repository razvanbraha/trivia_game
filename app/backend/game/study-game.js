//--- HEADER ------------------------------------------------------------------
/** 
 * File stidy-game.js
 * 
 * Authors: Will Mungas, Connor Hekking
 * 
 * Script for a thread running a study game to execute - registers several 
 * callbacks to handle different events based on game state
 */ 
//--- INCLUDE -----------------------------------------------------------------

// include ws_api as an ES module
const ws_api = require("../ws-api");

const utils = require('./utils');
const questionDAO = require("../db/question-dao");


//--- OBJECT ---------------------------------------------------------------
// Declare this file as an object to be able to use multiple instances of it
class studyGame {

    //--- CONSTANTS ---------------------------------------------------------------

    static STATES = {
        LOBBY: 1, // lobby state - awaiting game start 
        SHOW_QUESTION: 2, // state of each turn when game reveals the question
        SHOW_ANSWERS: 3, // state of each turn when game reveals answer choices
        RECEIVE_RESPONSES: 4, // state of each turn when game accepts responses
        AWAIT_CONTINUE: 5, // state of each turn when game waits for host to proceed to show their progress
        AWAIT_NEXT: 6, // state of each turn when game waits for host to proceed to next question
        FINAL: 7, // final state: game shows final results & waits for game to end
        ENDED: 8, // After final state, game is closed out
    }

    // setting limits as ranges
    static RANGES = {
        ROUNDS: {
            MIN: 1,
            MAX: 50
        },
        PREVIEW_TIME: {
            MIN: 1,
            MAX: 30,
        },
        DEAD_TIME: {
            MIN: 1,
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
    static AUTO_NEXTROUND_TIMER = 60; // 1 mins
    static AUTO_CLOSE_TIMER = 300; // 5 mins

    //--- STATE DATA -----------------------------------------------------------------
    
    type = null; // Type of game (should be "study")
    start_time = null; // Start time of the game(for auto-closing)

    state = 0; // the current state
    questions = []; // List of questions to be used by the game

    // not sure if this is really necessary either
    round_idx = 0;
    
    answering_start_time = null; // Date() of the time when the answering period/"live time" started

    signalContinue = null; // Function to resolve the promise making the main game flow(serveQuestions) wait for CONTINUE
    // Effectively, calling signalContinue() allows the main flow to continue with the next question

    signalNextRound = null; // Same idea as signalContinue

    // user-visible settings
    settings = {
        rounds: 0, // how many questions to send 
        categories: [], // which categories to pull from
        preview: 0, // question preview time
        dead: 0, // question dead time
        live: 0, // question live time
    };

    // client-related
    host = null; // the host connection in format:
    // {ws, name, points, List(answer idx)}
    
    // signal handler: map of signal names to functions with the signature
    // (ws, body) => void to handle the signal
    handlers = {
        host: {},
    };

    //--- FUNCTIONS ---------------------------------------------------------------

    /**
     * Entry point for a study session thread: initializes data, registers
     * callbacks for all events, start waiting in "Lobby" state
     * @param {} data common session data
     */
    constructor(data) {
        this.code = data.code;
        this.type = data.type;
        this.state = studyGame.STATES.LOBBY;
        this.start_time = data.start_time;

        // (host) - can send START, KICK and CONTINUE
        ws_api.support(this.handlers.host, ws_api.signals.START, (ws, body) => {
            if (this.state === studyGame.STATES.LOBBY) {
                this.startGame(body);
            } 
            else {
                ws.err("Game has already started.");
            }
        });

        ws_api.support(this.handlers.host, ws_api.signals.CONTINUE, (ws, body) => {
            if (this.state === studyGame.STATES.AWAIT_CONTINUE) {
                this.signalContinue();
            } else if (this.state === studyGame.STATES.FINAL && ws === this.host) {
                this.endGame(ws, body);
            } else if(ws !== this.host) {
                ws.signal(ws_api.signals.ERR, {err: "Only host can continue."});
            } else if(this.state === studyGame.STATES.ENDED) {
                ws.signal(ws_api.signals.ERR, {err: "Game has already ended."});
            }
        });

        ws_api.support(this.handlers.host, ws_api.signals.NEXTROUND, (ws, body) => {
            if (this.state === studyGame.STATES.AWAIT_NEXT) {
                this.signalNextRound();
            } else if(ws !== this.host) {
                ws.signal(ws_api.signals.ERR, {err: "Only host can continue."});
            } else if(this.state === studyGame.STATES.ENDED) {
                ws.signal(ws_api.signals.ERR, {err: "Game has already ended."});
            }
        });

        ws_api.support(this.handlers.host, ws_api.signals.ANSWER, (ws, body) => {
            this.registerAnswer(ws, body);
            ws.signal(ws_api.signals.ACK, { msg: `received your answer (${body.num})`});
        });
    }

    /**
     * Logs an error for the session
     * @param {*} err 
     */
    error(err) {
        this.log(`ERROR: ${err}`);
    }

    /**
     * Logs a message for the session
     * @param {*} msg 
     */
    log(msg) {
        console.log(`[Session ${this.code}]: ${msg}`);
    }

    /**
     * @author Connor Hekking, Will Mungas, Riley Wickens
     * @description sends a signal to all connected websockets
     * @param sig signal type (must be from ws_api.signals)
     * @param body body of the signal (must be an object with valid fields)
     */
    sendAll(sig, body) {
        if(this.host) {
            this.host.ws.signal(sig, body);
        }
    }


    /**
     * Handles user joining the game through a websocket connection
     * @param {WebSocket} ws websocket attempting to join this game
     */
    join(ws, name) {
        if (this.state !== studyGame.STATES.LOBBY) {
            ws.respond(ws_api.signals.JOIN, false);
            ws.err("Game already started.");
            return;
        }

        // First joinee is host, all others aren't supposed to be here!
        if(this.host === null) {
            ws.handler = this.handlers.host;
            this.host = {name, ws, points: 0, answers: []};
            this.log("host joined");
            this.host.ws.respond(ws_api.signals.JOIN, true);
        } else {
            ws.err("Host already Joined.");
        }
    }

    /**
     * Checks if the game settings are in valid ranges
     * @param {*} settings grouping of settings to validate
     * @returns true/false if the settings are valid
     */
    validateSettings(settings) {
        let valid = true;
        try {
            const inRange = (a, range) => {
                return a <= range.MAX && a >= range.MIN;
            }
            if(!inRange(settings.rounds, studyGame.RANGES.ROUNDS)) {
                this.host.ws.err( "Invalid setting: number of questions.");
                valid = false;
            }
            if(!inRange(settings.preview, studyGame.RANGES.PREVIEW_TIME)) {
                this.host.ws.err( "Invalid setting: preview time.");
                valid = false;
            }
            if(!inRange(settings.dead, studyGame.RANGES.DEAD_TIME)) {
                this.host.ws.err( "Invalid setting: dead time.");
                valid = false;
            }
            if(!inRange(settings.live, studyGame.RANGES.LIVE_TIME)) {
                this.host.ws.err( "Invalid setting: live time.");
                valid = false;
            }
            if(!inRange(settings.categories.length, studyGame.RANGES.CATEGORIES)) {
                this.host.ws.err( "Invalid setting: categories.");
                valid = false;
            }
            // Check duplicates
            if(new Set(settings.categories).size !== settings.categories.length) {
                this.host.ws.err( "Invalid setting: categories.");
                valid = false;
            }
        } catch(e) {
            this.host.ws.err(`Error reading settings: ${e.message}`);
            this.log(e.stack);
            valid = false;
        }

        return valid
    }

    /**
     * Returns category accuracy for host
     * @returns List of category accuracies as a percent and category answer ratios. 
     * List({category_num, accuracy, num_correct, num_questions})
     */
    getCategoryAccuracy() {
        let hosts = [this.host];
        const category_accuracy = [];
        for(let i = 0; i < 6; i++) {
            category_accuracy.push({
                category_num: i+1, 
                accuracy: 0, 
                num_correct: 0, 
                num_questions: 0
            });
        }

        // Tally answers
        for(let i = 0; i < this.questions.length; i++) {
            const category_stat = category_accuracy[this.questions[i].category - 1];
            hosts.forEach((p) => {
                category_stat.num_questions += 1;
                if(i < p.answers.length) {
                    if(this.questions[i].correct_idx === p.answers[i]) {
                        category_stat.num_correct += 1;
                    }
                }
            });
        }

        // Calculate accuracy
        category_accuracy.forEach((category_stat) => {
            // Leave at 0% if no questions in category
            if(category_stat.num_questions !== 0) {
                category_stat.accuracy = Math.round((category_stat.num_correct / category_stat.num_questions) * 100);
            }
        });


        return category_accuracy;
    }

    getCurrentAccuracy() {
        let host = this.host;
        const currentAccuracy = {
            accuracy: 0, 
            num_correct: 0, 
            num_questions: 0    
        }

        for (let i = 0; i < host.answers.length; i++) {
            if(this.questions[i].correct_idx === host.answers[i]) {
                currentAccuracy.num_correct += 1;
            }
            currentAccuracy.num_questions += 1;
        }

        currentAccuracy.accuracy = Math.round((currentAccuracy.num_correct / currentAccuracy.num_questions) * 100);
        return currentAccuracy;
    }

    // Returns Host without ws field
    getSanitizedHost() {
        return {
            name: this.host.name, 
            points: this.host.points, 
            answers: this.host.answers
        };
    }

    /**
     * Configures settings from message, gets list of questions from database,
     * and sends out the first question.
     * @param {Object} settings settings passed in by host
     */
    async startGame(settings) {
        if(!this.validateSettings(settings)) {
            this.host.ws.signal(ws_api.signals.ERR, { err: "Invalid settings." })
            return;
        }
        this.settings = settings;

        // Load questions & error check
        let db_questions;
        try {
            db_questions = await questionDAO.selectRandQuestions(settings.rounds, settings.categories);
        } catch (e) {
            this.sendAll(
                ws_api.signals.ERR, 
                { err: "Questions could not be loaded succcessfully." }
            );
            return;
        }
        if(db_questions.length < settings.rounds) {   
            this.sendAll(
                ws_api.signals.ERR, 
                { err: `Not enough questions in Database. Need ${settings.rounds}, has ${db_questions.length}` }
            );
            return;
        }

        console.log("Test, contents of first question pulled from db:", db_questions[0]);

        // pre-sort and save correct indices
        this.questions = db_questions.map((question) => {
            const choices = [question.corrAnswer, question.incorrONE, question.incorrTWO, question.incorrTHREE];
            utils.shuffle(choices);
            const correct_idx = choices.indexOf(question.corrAnswer);
            return { text: question.question, choices, correct_idx, category: question.category };
        });

        // Start main game flow
        this.runGame();
    }


    /**
     * @author Connor Hekking, Will Mungas
     * @description Contains the main game flow of serving questions and answers, and managing delays.
     */
    async runGame() {
        // used only in here: set a delay of a given number of milliseconds
        const delay = (ms) => { return new Promise(resolve => setTimeout(resolve, ms)) };

        // run the set number of rounds
        for(let i = 0; i < this.settings.rounds; i++) {
            await this.runRound(i, delay);
            await this.waitForNextRound();
        }

        this.host.ws.signal(ws_api.signals.FINAL, {
            data_you: this.getSanitizedHost(),
            data_all: this.getCurrentAccuracy(),
            category_accuracy: this.getCategoryAccuracy(),
        });

        this.state = studyGame.STATES.FINAL;

        // Now wait till CONTINUE to end game

        await delay(1000 * studyGame.AUTO_CLOSE_TIMER);

        // If game not closed yet, do it manually
        if(this.state === studyGame.STATES.FINAL) {
            this.endGame(this.host.ws, null);
        }
    }

    /**
     * Runs a single round of the game
     * @param {*} i round index (round number is i + 1)
     * @param {*} delay function that sets delays as a Promise
     */
    async runRound(i, delay) {
        this.round_idx = i;
        // Send QUESTION to host
        this.sendAll(
            ws_api.signals.QUESTION, 
            {
                text: this.questions[i].text,
                num: i + 1,
                preview: this.settings.preview,
                dead: this.settings.dead,
                live: this.settings.live,
                rounds: this.settings.rounds
            }
        );

        this.state = studyGame.STATES.SHOW_QUESTION;

        // Delay 1 - Show question
        await delay(1000 * this.settings.preview);

        // Send CHOICES to host
        const choices = this.questions[i].choices;
        this.sendAll(ws_api.signals.CHOICES, {choices});

        this.state = studyGame.STATES.SHOW_ANSWERS;

        // Delay 2 - Show Answers
        await delay(1000 * this.settings.dead);

        // Send READY
        this.sendAll(ws_api.signals.READY, {});

        this.state = studyGame.STATES.RECEIVE_RESPONSES;

        // Delay 3 - Accept Answers
        this.answering_start_time = new Date();
        await delay(1000 * this.settings.live);

        // Fill in incorrect response(-1) if host didn't answer
        if(this.host.answers[i] === undefined) {
            this.host.answers[i] = ws_api.choices.NONE;
        }
        // Don't need to add any points - host did not answer
        // A host who answered already have their points from registerAnswer

        // Send DONE
        const correct_idx = this.questions[i].correct_idx;
        const class_accuracy_percent = 0;
        this.host.ws.signal(ws_api.signals.DONE, {
            correct_idx,
            data_you: this.getSanitizedHost(),
            class_accuracy_percent,
        });

        this.state = studyGame.STATES.AWAIT_CONTINUE;

        // Wait for CONTINUE
        await this.waitForContinue();

        // Send RESULTS
        this.host.ws.signal(ws_api.signals.RESULTS, {
            data_you: this.getSanitizedHost(),
            data_all: this.getCurrentAccuracy(),
            category_accuracy: this.getCategoryAccuracy(null),
        });

        this.state = studyGame.STATES.AWAIT_NEXT;
    }

    /**
     * Registers a Host's answer in the game state.
     * @param {WebSocket} ws Host websocket which initiated the request
     * @param {Object} body Message object containing the request
     */
    registerAnswer(ws, body) {
        // do not allow answers outside of answer window
        if(!this.state == studyGame.STATES.RECEIVE_RESPONSES) {
            ws.err("Too late!");
            return;
        }

        if (this.host.ws !== ws) {
            ws.err("Unrecognised connection");
            return;
        }

        const host = this.host;
        // Do not allow multiple answers
        if (host.answers[this.round_idx] !== undefined) {
            ws.err( "Multiple answer submissions not allowed.");
            return;
        }

        const choice = body.idx;

        // Check invalid answer number
        if(choice !== ws_api.choices.NONE && (choice < ws_api.choices.MIN || choice > ws_api.choices.MAX)) {
            ws.err( "Invalid answer number.");
            return;
        }

        // Register answer
        host.answers[this.round_idx] = choice;
        // Add points
        if (choice === this.questions[this.round_idx].correct_idx) {
            const elapsed_time = new Date() - this.answering_start_time;
            const elapsed_seconds = elapsed_time / 1000; // Date() is in milliseconds

            // Points = ratio of elapsed time to live time, multiplied by the base number of points
            let points = ((this.settings.live - elapsed_seconds) / this.settings.live) * studyGame.BASE_QUESTION_POINTS;
            points = Math.round(points); // Round to integer

            host.points += points;
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
            }, studyGame.AUTO_CONTINUE_TIMER * 1000);
        });
    }

    /**
     * Called by main flow to wait for CONTINUE signal
     * @returns A promise waiting for something to call signalContinue()
     */
    waitForNextRound() {
        return new Promise(resolve => {
            this.signalNextRound = () => {
                clearTimeout(timeout);
                resolve();
            };

            // In case host disconnects, auto-continue
            const timeout = setTimeout(() => {
                this.signalNextRound = null;
                resolve();
            }, studyGame.AUTO_NEXTROUND_TIMER * 1000);
        });
    }

    

    /**
     * Sends out GAMEOVER signal then closes all connections
     * @param {WebSocket} ws Host websocket which initiated the request
     * @param {Object} message Message object containing the request
     */
    endGame(ws, message) {
        //TODO this needs to be adjusted once rest of file done

        // Close host
        this.host.ws.signal(ws_api.signals.GAMEOVER, {});
        this.host.ws.kill("Game finished");

        this.state = studyGame.STATES.ENDED;

        // Cleanup memory
        this.host.ws.handler = null;
        this.questions = [];
    }
}

//--- EXPORTS -----------------------------------------------------------------

module.exports.studyGame = studyGame;
