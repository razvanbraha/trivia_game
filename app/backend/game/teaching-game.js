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


//--- OBJECT ---------------------------------------------------------------
// Declare this file as an object to be able to use multiple instances of it
class teachingGame {

    //--- CONSTANTS ---------------------------------------------------------------

    static STATES = {
        LOBBY: 1, // lobby state - awaiting game start 
        SHOW_QUESTION: 2, // state of each turn when game reveals the question
        SHOW_ANSWERS: 3, // state of each turn when game reveals answer choices
        RECEIVE_RESPONSES: 4, // state of each turn when game accepts responses
        AWAIT_CONTINUE: 5, // state of each turn when game waits for teacher to proceed to show player progress
        AWAIT_NEXT: 6, // state of each turn when game waits for teacher to proceed to next question
        FINAL: 7, // final state: game shows final results & waits for game to end
        ENDED: 8, // After final state, game is closed out
    }

    // setting limits as ranges
    static RANGES = {
        ROUNDS: {
            MIN: 5,
            MAX: 50
        },
        PREVIEW_TIME: {
            MIN: 0,
            MAX: 30,
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
    static AUTO_NEXTROUND_TIMER = 60; // 1 mins
    static AUTO_CLOSE_TIMER = 300; // 5 mins

    //--- STATE DATA -----------------------------------------------------------------

    // Given by sessions
    code = null; // Game join code
    
    type = null; // Type of game (should be "teaching")
    start_time = null; // Start time of the game(for auto-closing)

    state = 0; // the current state
    questions = []; // List of questions to be used by the game
    current_question_idx = 0; // Index of current question in game(increment on "CONTINUE")
    current_correct_answer_number = -1; // Correct answer number (1/2/3/4)
    
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
    host = null; // the host WebSocket connection
    // list of players, each storing: name, websocket, points, and last answer(latest)
    // {ws, name, points, latest_answer, List(answer #)}
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
        ws_api.support(this.handlers.host, ws_api.signals.START, (ws, body) => {
            if (this.state === teachingGame.STATES.LOBBY) {
                this.startGame(body);
            } 
            else {
                ws.err("Game has already started.");
            }
        });

        ws_api.support(this.handlers.host, ws_api.signals.KICK, (ws, body) => {
            const player = this.players.find((p) => p.name === body.name);
            
            let success = false;
            if(player) {
                this.players.splice(this.players.indexOf(player), 1);

                player.ws.kill("Kicked by host");
                this.log(`kicked player '${body.name}'`);

                success = true;
            }

            ws.respond(ws_api.signals.KICK, success);
            if(!success) {
                const err = `Could not find player '${body.name}'`;
                this.log(err);
                this.sendAll(
                    ws_api.signals.ERR, 
                    { err: err }
                );
            }
        });

        ws_api.support(this.handlers.host, ws_api.signals.CONTINUE, (ws, body) => {
            if (this.state === teachingGame.STATES.AWAIT_CONTINUE) {
                this.signalContinue();
            } else if (this.state === teachingGame.STATES.FINAL && ws === this.host) {
                this.endGame(ws, body);
            } else if(ws !== this.host) {
                ws.signal(ws_api.signals.ERR, {err: "Only host can continue."});
            } else if(this.state === teachingGame.STATES.ENDED) {
                ws.signal(ws_api.signals.ERR, {err: "Game has already ended."});
            }
        });

        ws_api.support(this.handlers.host, ws_api.signals.NEXTROUND, (ws, body) => {
            if (this.state === teachingGame.STATES.AWAIT_NEXT) {
                this.signalNextRound();
            } else if(ws !== this.host) {
                ws.signal(ws_api.signals.ERR, {err: "Only host can continue."});
            } else if(this.state === teachingGame.STATES.ENDED) {
                ws.signal(ws_api.signals.ERR, {err: "Game has already ended."});
            }
        });

        // students (players) - only signal needed is answer
        ws_api.support(this.handlers.player, ws_api.signals.ANSWER, (ws, body) => {
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
     * @author Connor Hekking, Will Mungas
     * @description sends a signal to all connected websockets
     * @param sig signal type (must be from ws_api.signals)
     * @param body body of the signal (must be an object with valid fields)
     */
    sendAll(sig, body) {
        if(this.host) {
            this.host.signal(sig, body);
        }
        for(const player of this.players) {
            player.ws.signal(sig, body);
        }
    }

    /**
     * Handles user joining the game through a websocket connection
     * @param {WebSocket} ws websocket attempting to join this game
     */
    join(ws, name) {
        if (this.state !== teachingGame.STATES.LOBBY) {
            ws.err("Game already started.");
            return;
        }

        // First joinee is host, all others are players
        if(this.host === null) {
            ws.handler = this.handlers.host;
            this.host = ws;
            this.log("host joined");
            this.host.respond(ws_api.signals.JOIN, true);
            return;
        }
        ws.handler = this.handlers.player;
        this.players.push({name, ws, latest: teachingGame.NO_ANSWER_NUM, points: 0, answers: []});

        this.log(`player ${this.players.length} (${name}) joined`);
        ws.respond(ws_api.signals.JOIN, true);
        this.host.signal(ws_api.signals.JOINEE, {name});
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
            if(!inRange(settings.rounds, teachingGame.RANGES.ROUNDS)) {
                this.host.err( "Invalid setting: number of questions.");
                valid = false;
            }
            if(!inRange(settings.preview, teachingGame.RANGES.PREVIEW_TIME)) {
                this.host.err( "Invalid setting: preview time.");
                valid = false;
            }
            if(!inRange(settings.dead, teachingGame.RANGES.DEAD_TIME)) {
                this.host.err( "Invalid setting: dead time.");
                valid = false;
            }
            if(!inRange(settings.live, teachingGame.RANGES.LIVE_TIME)) {
                this.host.err( "Invalid setting: live time.");
                valid = false;
            }
            if(!inRange(settings.categories.length, teachingGame.RANGES.CATEGORIES)) {
                this.host.err( "Invalid setting: categories.");
                valid = false;
            }
            // Check duplicates
            if(new Set(settings.categories).size !== settings.categories.length) {
                this.host.err( "Invalid setting: categories.");
                valid = false;
            }
        } catch(e) {
            this.host.err(`Error reading settings: ${e.message}`);
            this.log(e.stack);
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
     * Returns class accuracy percent for a given question
     * @param {Number} questionIdx Index of the question
     * @param {Number} correctAnswerNumber Correct answer number (1-4)
     */
    getClassAccuracy(questionIdx, correctAnswerNumber) {
        // if no students
        if(this.players.length === 0) {
            return 0;
        }

        let num_correct = 0;

        this.players.forEach((player) => {
            try {
                if(player.answers[questionIdx] === correctAnswerNumber) {
                    num_correct += 1;
                }
            } catch (e) {
                // Do nothing, may not have answered yet
            }  
        });

        return Math.round((num_correct / this.players.length) * 100);
    }

    // Returns player without ws field
    getSanitizedPlayer(player) {
        return {
            name: player.name, 
            points: player.points, 
            latest_answer: player.latest_answer,
            answers: player.answers
        };
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
            this.host.signal(ws_api.signals.ERR, { err: "Invalid settings." })
            return;
        }
        this.settings = settings;

        // Load questions & error check
        try {
            this.questions = await questionsDB.selectRandQuestions(settings.rounds, settings.categories);
        } catch (e) {
            this.sendAll(
                ws_api.signals.ERR, 
                { err: "Questions could not be loaded succcessfully." }
            );
        }
        
        if(this.questions.length < settings.rounds) {   
            this.sendAll(
                ws_api.signals.ERR, 
                { err: `Not enough questions in Database. Need ${settings.rounds}, has ${this.questions.length}` }
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
        const delay = (ms) => { return new Promise(resolve => setTimeout(resolve, ms)) };


        while(this.current_question_idx  < this.settings.rounds) {
            // Send QUESTION to host & players
            this.sendAll(
                ws_api.signals.QUESTION, 
                {
                    text: this.questions[this.current_question_idx].question,
                    num: this.current_question_idx + 1,
                    preview: this.settings.preview,
                    dead: this.settings.dead,
                    live: this.settings.live
                }
            );

            this.state = teachingGame.STATES.SHOW_QUESTION;

            // Delay 1 - Show question
            await delay(1000 * this.settings.preview);

            // Send CHOICES to host & players
            const question = this.questions[this.current_question_idx];
            const correct_answer = question.corrAnswer;
            const choices_list = [question.corrAnswer, question.incorrONE, question.incorrTWO, question.incorrTHREE];
            teachingGame.shuffle(choices_list);
            this.current_correct_answer_number = choices_list.indexOf(correct_answer) + 1;

            this.sendAll(ws_api.signals.CHOICES, {
                "choices": choices_list,
            });

            this.state = teachingGame.STATES.SHOW_ANSWERS;

            // Delay 2 - Show Answers
            await delay(1000 * this.settings.dead);

            // Send READY
            this.sendAll(ws_api.signals.READY, {});

            this.state = teachingGame.STATES.RECEIVE_RESPONSES;

            // Delay 3 - Accept Answers
            this.answering_start_time = new Date();
            await delay(1000 * this.settings.live);

            // Fill in incorrect response(-1) for players who didn't answer
            this.players.forEach((player) => {
                if(player.answers[this.current_question_idx] === undefined) {
                    player.answers[this.current_question_idx] = teachingGame.NO_ANSWER_NUM;
                }
                // Don't need to add any points
            });

            // Send DONE
            const class_accuracy = this.getClassAccuracy(this.current_question_idx, this.current_correct_answer_number);
            this.host.signal(ws_api.signals.DONE, {
                correct_answer_num: this.current_correct_answer_number,
                data_you: null,
                class_accuracy_percent: class_accuracy,
            });
            this.players.forEach((player) => {
                player.ws.signal(ws_api.signals.DONE, {
                    correct_answer_num: this.current_correct_answer_number,
                    data_you: this.getSanitizedPlayer(player),
                    class_accuracy_percent: class_accuracy,
                });
            });

            this.state = teachingGame.STATES.AWAIT_CONTINUE;

            // Wait for CONTINUE
            await this.waitForContinue();

            // Send RESULTS
            const allRankings = this.getRankings();
            this.host.signal(ws_api.signals.RESULTS, {
                data_you: null,
                data_all: allRankings,
            });
            this.players.forEach((player) => {
                player.ws.signal(ws_api.signals.RESULTS, {
                    data_you: this.getSanitizedPlayer(player),
                    data_all: allRankings
                });
            });

            this.state = teachingGame.STATES.AWAIT_NEXT;

            // Wait for NEXTROUND
            await this.waitForNextRound();

            // Increment question index
            this.current_question_idx = this.current_question_idx + 1;
        }

        // Send FINAL
        const allRankings = this.getRankings();

        this.host.signal(ws_api.signals.FINAL, {
            data_you: null,
            data_all: allRankings,
        });
        this.players.forEach((player) => {
            player.ws.signal(ws_api.signals.FINAL, {
                data_you: this.getSanitizedPlayer(player),
                data_all: allRankings
            });
        });

        this.state = teachingGame.STATES.FINAL;

        // Now wait till CONTINUE to end game

        await delay(1000 * teachingGame.AUTO_CLOSE_TIMER);

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
        const answer_number = message.num;

        // Check invalid answer number
        if(answer_number > 4 || answer_number < 1) {
            ws.err( "Invalid answer number.");
            return;
        }

        const player = this.players.find((p) => p.ws == ws);

        // Stop duplicate answers
        if (player.answers[this.current_question_idx] !== undefined) {
            return;
        }    

        // Register answer
        player.answers[this.current_question_idx] = answer_number;
        // Add points
        if (answer_number === this.current_correct_answer_number) {
            const elapsed_time = new Date() - this.answering_start_time;
            const elapsed_seconds = elapsed_time / 1000; // Date() is in milliseconds

            // Points = ratio of elapsed time to live time, multiplied by the base number of points
            let points = ((this.live_time - elapsed_seconds) / this.live_time) * teachingGame.BASE_QUESTION_POINTS;
            points = Math.round(points); // Round to integer

            if(points < 0) {
                // Timed out, no points
                points = 0;
                // Set no answer because answer did not come in time
                player.answers[this.current_question_idx] = teachingGame.NO_ANSWER_NUM;
            }

            player.points += points;
            player.latest_answer = answer_number;
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
            }, teachingGame.AUTO_CONTINUE_TIMER * 1000);
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
            }, teachingGame.AUTO_NEXTROUND_TIMER * 1000);
        });
    }

    

    /**
     * Sends out DONE signal then closes all connections
     * @param {WebSocket} ws Host websocket which initiated the request
     * @param {Object} message Message object containing the request
     */
    endGame(ws, message) {
        //TODO this needs to be adjusted once rest of file done

        // Close host
        this.host.signal(ws_api.signals.GAMEOVER, {});
        this.host.kill("Game finished");
        // Close players
        this.players.forEach((player) => {
            player.ws.signal(ws_api.signals.GAMEOVER, {});
            player.ws.kill("Game finished.");
        });

        this.state = teachingGame.STATES.ENDED;

        // Cleanup memory
        this.host.handler = null;
        this.players = [];
        this.questions = [];
    }
}

//--- EXPORTS -----------------------------------------------------------------

module.exports.teachingGame = teachingGame;
