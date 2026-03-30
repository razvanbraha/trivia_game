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
const ws_api = require("../ws-api");

const questionsDB = require("../db_queries/questions-db");
const { pl } = require("zod/v4/locales");


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
        ROUNDS: {
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
    
    type = null; // Type of game (should be "teaching")
    start_time = null; // Start time of the game(for auto-closing)

    state = 0; // the current state
    questions = []; // List of questions to be used by the game
    current_question_idx = 0; // Index of current question in game(increment on "CONTINUE")
    answers = new Map(); // Map{socket(player): List(answer #)} - list indicies correspond to questions list
    current_correct_answer_number = -1; // Correct answer number (1/2/3/4)
    
    answering_start_time = null; // Date() of the time when the answering period/"live time" started

    signalContinue = null; // Function to resolve the promise making the main game flow(serveQuestions) wait for CONTINUE
    // Effectively, calling signalContinue() allows the main flow to continue with the next question

    // user-visible settings
    settings = {
        rounds: 0, // how many questions to send 
        categories: [], // which categories to pull from
        preview: 0, // question preview time
        dead: 0, // question dead time
        live: 0, // question live time
    };

    // client-related
    host = null; // the host WebSocket connection
    // list of players, each storing: name, websocket, points, and last answer(latest)
    // {ws, name, points, latest}
    // order of list is implicitly the player ranks
    players = []; 
    
    // signal handler: map of signal names to functions with the signature
    // (ws, body) => void to handle the signal
    handlers = {
        host: {},
        player: {}
    };

    //--- FUNCTIONS ---------------------------------------------------------------

    /**
     * Entry point for a teaching session thread: initializes data, registers
     * callbacks for all events, start waiting in "Lobby" state
     * @param {} data common session data
     */
    constructor(data) {
        this.code = data.code;
        this.type = data.type;
        this.state = teachingGame.STATES.LOBBY;
        this.start_time = data.start_time;

        // teacher (host) - can send START, KICK and CONTINUE
        this.handlers.host[ws_api.signals.START.id] = (ws, body) => {
            if (this.state === teachingGame.STATES.LOBBY) {
                this.startGame(ws, body);
            } 
            else {
                ws_api.error(ws, "Game has already started.");
            }
        }
        this.handlers.host[ws_api.signals.KICK.id] = (ws, body) => {
            const player = this.players.find((p) => p.name === body.name);
            
            if(player) {
                this.players.splice(indexOf(player), 1);
                ws_api.close(player.ws, "Kicked by host");
            }
        }
        this.handlers.host[ws_api.signals.CONTINUE.id] = (ws, body) => {
            if (this.state === teachingGame.STATES.AWAIT_NEXT) {
                this.advanceQuestion(ws, body);
            } else if (this.state === teachingGame.STATES.FINAL && ws === this.host) {
                this.endGame(ws, body);
            } else if(ws !== this.host) {
                ws_api.error(ws, "Only host can continue.");
            } else if(this.state === teachingGame.STATES.ENDED) {
                ws_api.error(ws, "Game has already ended.");
            }
        }

        // students (players) - only signal needed is answer
        this.handlers.player[ws_api.signals.ANSWER.id] = (ws, body) => {
            console.log("Haven't implemented handling answers yet");
            ws_api.send(ws, ws_api.signals.ACK, { msg: `received your answer (${body.num}); answer handling not implemented yet`});
        }
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
     * @author Connor Hekking, Will Mungas
     * @description sends a signal to all connected websockets
     * @param sig signal type (must be from ws_api.signals)
     * @param body body of the signal (must be an object with valid fields)
     */
    sendAll(sig, body) {
        if(this.host) {
            ws_api.send(this.host, sig, body);
        }
        for(const player of players) {
            ws_api.send(player.ws, sig, body);
        }
    }

    /**
     * Handles user joining the game through a websocket connection
     * @param {WebSocket} ws websocket attempting to join this game
     */
    join(ws, name) {
        if (this.state !== teachingGame.STATES.LOBBY) {
            ws_api.error(ws, "Game already started.");
            return;
        }

        // First joinee is host, all others are players
        if(this.host === null) {
            this.host = ws;
            // handle signals a host can send
            ws.on("messsage", (data) => {ws_api.receive(ws, this.handlers.host, data)});
            this.log("host joined");
            
            return;
        }

        // Add player entries to data
        this.players.push({name, ws, latest: this.NO_ANSWER_NUM, points: 0});

        // handle signals a player can send
        ws.on("message", (data) => {ws_api.receive(ws, this.handlers.player, data)});
        this.log(`player ${this.players.length} (${name}) joined`);

        // let the host know a new player joined
        ws_api.send(this.host, ws_api.signals.JOINEE, { name });
    }

    /**
     * Checks if the game settings are in valid ranges
     * @param {*} settings grouping of settings to validate
     * @returns true/false if the settings are valid
     */
    validateSettings(settings) {
        const inRange = (a, range) => {
            return a <= range.MAX && a >= range.MIN;
        }

        let valid = true;
        if(!inRange(settings.rounds, RANGES.ROUNDS)) {
            ws_api.error(ws, "Invalid setting: number of questions.");
            valid = false;
        }
        if(!inRange(settings.preview, RANGES.PREVIEW_TIME)) {
            ws_api.error(ws, "Invalid setting: preview time.");
            valid = false;
        }
        if(!inRange(settings.dead, RANGES.DEAD_TIME)) {
            ws_api.error(ws, "Invalid setting: dead time.");
            valid = false;
        }
        if(!inRange(settings.live, RANGES.LIVE_TIME)) {
            ws_api.error(ws, "Invalid setting: live time.");
            valid = false;
        }
        if(!inRange(settings.categories.length, RANGES.CATEGORIES)) {
            ws_api.error(ws, "Invalid setting: categories.");
            valid = false;
        }
        // Check duplicates
        if(new Set(settings.categories).size !== settingscategories.length) {
            ws_api.error(ws, "Invalid setting: categories.");
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
     * Sorts players by points earned, then returns players without the websocket
     * @author Will Mungas
     * @returns 
     */
    getRankings() {
        this.players.sort((a, b) => {a.points - b.points});

        return this.players.map(({ws, ...rest}) => rest);
    }

    /**
     * Configures settings from message, gets list of questions from database,
     * and sends out the first question.
     * @param {Object} settings settings passed in by host
     */
    async startGame(settings) {
        if(!this.validateSettings(settings)) {
            ws_api.error(this.host, "Invalid settings")
            return;
        }
        this.settings = settings;

        // Load questions & error check
        try {
            this.questions = await questionsDB.selectRandQuestions(categories, num_questions);
        } catch (e) {
            this.sendAll(
                ws_api.signals.ERROR, 
                { err: "Questions could not be loaded succcessfully." }
            );
        }
        
        if(this.questions.length < count) {
            this.sendAll(
                ws_api.signals.ERROR, 
                { err: "Not enough questions in Database. Expect unstable behavior." }
            );
        }

        // Start main game flow
        this.serveQuestions();
    }


    /**
     * Contains the main game flow of serving questions and answers, and managing delays.
     * See "Teaching Game Flow" https://drive.google.com/file/d/1Ot5iEwynpoNxzL3qfV24YOHXDSmfGL-P/view?usp=sharing
     */
    async serveQuestions() {
        // used only in here: set a delay of a given number of milliseconds
        const delay = (ms) => { return new Promise(() => setTimeout(null, ms)) };


        while(this.questions_sent < this.settings.questions) {
            // Send QUESTION to host & players
            this.sendAll(
                ws_api.signals.QUESTION, 
                {
                    text: this.questions[this.current_question_idx].question,
                    num: this.questions_sent
                }
            );

            this.state = teachingGame.STATES.SHOW_QUESTION;

            // Delay 1 - Show question
            delay(1000 * this.preview_time);

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
            delay(1000 * this.dead_time);

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
                if(this.answers.get(player[ws])[this.current_question_idx] === undefined) {
                    this.answers.get(player[ws])[this.current_question_idx] = this.NO_ANSWER_NUM;
                }
                // Don't need to add any points
            });

            // Send DONE
            const allRankings = this.getRankings();
            ws_api.send(this.host, ws_api.signals.DONE, {
                correct_answer_num: this.current_correct_answer_number,
                data_you: null,
                data_all: allRankings
            });
            this.players.forEach((player) => {
                ws_api.send(player[ws], ws_api.signals.DONE, {
                    correct_answer_num: this.current_correct_answer_number,
                    data_you: player,
                    data_all: allRankings
                });
            });

            this.state = teachingGame.STATES.AWAIT_NEXT;

            // Wait for CONTINUE (advanceQuestion)
            await this.waitForContinue();

            // Increment question index
            this.current_question_idx = this.current_question_idx + 1;
        }

        // Send RESULTS
        const allRankings = this.getRankings();

        ws_api.send(this.host, ws_api.signals.RESULTS, {
            correct_answer_num: this.current_correct_answer_number,
            data_you: null,
            data_all: allRankings,
        });
        this.players.forEach((player) => {
            ws_api.send(player[ws], ws_api.signals.RESULTS, {
                correct_answer_num: this.current_correct_answer_number,
                data_you: player,
                data_all: allRankings
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
            ws_api.error(ws, "Invalid answer number.");
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
     * Advances game to the next question
     */
    advanceQuestion() {
        // TODO implement
    }

    

    /**
     * Sends out DONE signal then closes all connections
     * @param {WebSocket} ws Host websocket which initiated the request
     * @param {Object} message Message object containing the request
     */
    endGame(ws, message) {
        //TODO this needs to be adjusted once rest of file done

        // Close host
        ws_api.send(this.host, ws_api.signals.GAMEOVER, {});
        ws_api.close(this.host, "Game finished.");
        // Close players
        this.players.forEach((player) => {
            ws_api.send(player, ws_api.signals.GAMEOVER, {});
            ws_api.close(player, "Game finished.");
        });

        this.state = teachingGame.STATES.ENDED;

        // Cleanup memory
        this.host.handler = null;
        this.players = [];
        this.questions = [];
        this.answers.clear();
    }
}

//--- EXPORTS -----------------------------------------------------------------

module.exports.teachingGame = teachingGame;
