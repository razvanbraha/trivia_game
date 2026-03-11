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

const {messages, sendWebSocketMessage, closeWebsocket, sendError} = require("../websocket-server");
const questionsDB = require("../db_queries/questions-db");
const { all } = require("../rest_api/dbAPI");


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
        // After final state, game is closed out
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
    answers = {}; // Dict{socket(player): List(answer #)} - list indicies correspond to questions list
    // -1 = no answer
    points = {}; // Dict{socket(player): Number}

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

    num_questions = 0;
    categories = [];
    preview_time = 0;
    dead_time = 0;
    live_time = 0;


    //--- FUNCTIONS ---------------------------------------------------------------

    constructor(data) {
        initTeachingSession(data);
    }

    /**
     * Entry point for a teaching session thread: initializes data, registers
     * callbacks for all events, start waiting in "Lobby" state
     * @param {} data common session data
     */
    initTeachingSession(data) {
        this.code = data.game_code;
        this.type = data.game_type;
        this.state = STATES.LOBBY;
        this.host.handler = this.receiveMessage;
    }

    sendAllPlayers(message) {
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
        // TODO other validation?
        try {
            const type = message.type;

            // Handle all messages
            switch(type) {
                case (messages.START):
                    if (this.state === STATES.LOBBY && socket === this.host) {
                        this.startGame(socket, message);
                    } else if(socket !== this.host) {
                        sendError(socket, "Only host can contiinue.");
                    } else {
                        sendError(socket, "Game has already started.");
                    }
                    break;
                case (messages.ANSWER):
                    if (this.state === STATES.RECEIVE_RESPONSES && socket !== this.host) {
                        this.registerAnswer(socket, message);
                    } else if(socket === this.host) {
                        sendError(socket, "Host cannot submit an answer.");
                    } else {
                        sendError(socket, "Game is not accepting answers.");
                    }
                    break;
                case (messages.CONTINUE):
                    if (this.state === STATES.AWAIT_NEXT && socket === this.host) {
                        this.advanceQuestion(socket, message);
                    } else if (this.state === STATES.FINAL && socket === this.host) {
                        this.endGame(socket, message);
                    } else if(socket !== this.host) {
                        sendError(socket, "Only host can contiinue.");
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
        socket.handler = this.receiveMessage;

        // First join = host, later joins = player
        if(this.host === null) {
            this.host = socket;
            return;
        }

        // Add player entries to data
        this.players.push(socket);
        this.answers[socket] = [];
        this.points[socket] = 0;
    }

    /**
     * Checks if the game settings
     * @param {Number} num_questions Number of questions in the game
     * @param {Array} categories Array of numbers corresponding to categories included in the game
     * @param {Number} preview_time Time the question text is shown but not answers
     * @param {Number} dead_time Time the answers are shown but not answerable
     * @param {Number} live_time Time the question is live for answers
     * @returns true/false if the settings are valid
     */
    validateSettings(num_questions, categories, preview_time, dead_time, live_time) {
        const valid = true;
        if(num_questions > this.MAX_QUESTIONS || num_questions < this.MIN_QUESTIONS) {
            sendError(socket, "Invalid setting: number of questions.");
            valid = false;
            return;
        }
        if(preview_time > this.MAX_PREVIEW_TIME || preview_time < this.MIN_PREVIEW_TIME) {
            sendError(socket, "Invalid setting: preview time.");
            valid = false;
            return;
        }
        if(dead_time > this.MAX_DEAD_TIME || dead_time < this.MIN_DEAD_TIME) {
            sendError(socket, "Invalid setting: dead time.");
            valid = false;
            return;
        }
        if(live_time > this.MAX_LIVE_TIME || live_time < this.MIN_LIVE_TIME) {
            sendError(socket, "Invalid setting: live time.");
            valid = false;
            return;
        }
        if(categories.length > this.NUM_CATEGORIES || categories.length < 1){
            sendError(socket, "Invalid setting: categories.");
            valid = false;
            return;
        }
        categories.forEach((categoryNum) => {
            if(categoryNum > this.NUM_CATEGORIES || categoryNum < 1){
                sendError(socket, "Invalid setting: categories.");
                valid = false;
                return;
            }
        });
        categories.reduce((acc, cur) => {
            acc[cur] = (acc[curr] || 0) + 1;
            if(acc[cur] > 1) {
                sendError(socket, "Invalid setting: categories.");
                valid = false;
                return;
            }
            return acc;
        });

        return valid
    }


    shuffle(array) {
        let currentIndex = array.length;

        // While there remain elements to shuffle...
        while (currentIndex != 0) {

            // Pick a remaining element...
            let randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
        }
    }

    /**
     * Loads questions into the teaching game
     * @param {Array} categories Array of numbers corresponding to categories included in the game
     * @param {Number} count Number of questions
     */
    loadQuestions(categories, count) {
        const allQuestions = [];

        categories.forEach((category) => {
            allQuestions.push(questionsDB.getByCategory(category));
        });

        this.shuffle(allQuestions);

        this.questions = allQuestions.slice(count - 1);
    }

    /**
     * Returns rankings of players, including their number rank and points value associated to their websocket.
     * @returns Dict{Websocket: {rank: Number, points: Number}} (nested)
     */
    getRankings() {
       const rankings = {};
       const rankings_list = [];

       this.players.forEach((player) => {
            rankings_list.push({
                "player": player,
                "points": this.points[player],
            });
       });

       // Sort list in descending order of points
       rankings_list.sort((a, b) => {
            return b.points - a.points;
       });

       // Add the rankings value
       rankings_list.reduce((counter, cur) => {
            counter = (counter || 0) + 1;
            cur.rank = counter;
            return acc;
       });

       // Reformat
       rankings_list.forEach((ranking) => {
            rankings[ranking.player] = {
                "rank": ranking.rank,
                "points": ranking.points,
            };
       });

       return rankings;
    }

    /**
     * Configures settings from message, gets list of questions from database,
     * and sends out the first question.
     * @param {WebSocket} socket Host websocket which initiated the request
     * @param {Object} message Message object containing the request
     */
    startGame(socket, message) {
        // TODO load settings(&validate), get questions, and start
        const num_questions = message.num_questions;
        const categories = message.categories;
        const preview_time = message.preview_time;
        const dead_time = message.dead_time;
        const live_time = message.live_time;

        const valid = this.validateSettings(num_questions, categories, preview_time, dead_time);
        if(!valid) {
            return; // Do nothing
        }
        this.num_questions = num_questions;
        this.categories = categories;
        this.preview_time = preview_time;
        this.dead_time = dead_time;
        this.live_time = live_time;

        // Load questions
        this.loadQuestions(categories, num_questions);

        // Start main game flow
        this.serveQuestions();
    }

    delay(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }

    /**
     * Contains the main game flow of serving questions and answers, and managing delays.
     * See "Teaching Game Flow" https://drive.google.com/file/d/1Ot5iEwynpoNxzL3qfV24YOHXDSmfGL-P/view?usp=sharing
     */
    async serveQuestions() {
        while(this.current_question_idx  < this.num_questions) {
            // Send QUESTION to host & players
            let currentMessage = {
                "type": messages.QUESTION,
                "question_text": this.questions[this.current_question_idx].question,
                "question_number": this.current_question_idx + 1,
                "num_questions": this.num_questions,
            };
            sendWebSocketMessage(this.host, currentMessage);
            this.sendAllPlayers(currentMessage);

            this.state = STATES.SHOW_QUESTION;

            // Delay 1 - Show question
            await this.delay(1000 * this.preview_time);

            // Send CHOICES to host & players
            const choices_list = [];
            const correct_answer = this.questions[this.current_question_idx].corrAnswer
            choices_list.push(correct_answer);
            choices_list.push(this.questions[this.current_question_idx].incorrONE);
            choices_list.push(this.questions[this.current_question_idx].incorrTWO);
            choices_list.push(this.questions[this.current_question_idx].incorrTHREE);
            this.shuffle(choices_list);
            const correct_answer_number = choices_list.indexOf(correct_answer) + 1;

            currentMessage = {
                "type": messages.CHOICES,
                "answer_choices": choices_list,
            };
            sendWebSocketMessage(this.host, currentMessage);
            this.sendAllPlayers(currentMessage);

            this.state = STATES.SHOW_ANSWERS;

            // Delay 2 - Show Answers
            await this.delay(1000 * this.dead_time);

            // Send READY
            currentMessage = {
                "type": messages.READY,
            };
            sendWebSocketMessage(this.host, currentMessage);
            this.sendAllPlayers(currentMessage);

            this.state = STATES.RECEIVE_RESPONSES;

            // Delay 3 - Accept Answers
            await this.delay(1000 * this.live_time);

            // Fill in incorrect response(-1) for players who didn't answer
            //TODO

            // Calculate points for all players
            //TODO


            // Send CLOSE
            const rankings = this.getRankings();
            sendWebSocketMessage(this.host, {
                "type": messages.CLOSE,
                "correct_answer_number": correct_answer_number,
                "current_player": null,
                "other_players": rankings,
            });
            this.players.forEach((player) => {
                const other_players = [];
                // TODO left off here
                // TODO construct other_players

                sendWebSocketMessage(player, {
                    "type": messages.CLOSE,
                    "correct_answer_number": correct_answer_number,
                    "current_player": rankings[player],
                    "other_players": other_players,
                });
            });

            this.state = STATES.AWAIT_NEXT;

            // Wait for CONTINUE
            //TOOD

            // Increment question index
            this.current_question_idx = this.current_question_idx + 1;
        }

        // Send RESULTS
        //TODO
    }

    /**
     * Registers a player's answer in the game state.
     * @param {WebSocket} socket Player websocket which initiated the request
     * @param {Object} message Message object containing the request
     */
    registerAnswer(socket, message) {
        // TODO
    }

    /**
     * Sends out next question.
     * @param {WebSocket} socket Host websocket which initiated the request
     * @param {Object} message Message object containing the request
     */
    advanceQuestion(socket, message) {
        // TODO
    }

    

    /**
     * Sends out DONE signal then closes all connections
     * @param {WebSocket} socket Host websocket which initiated the request
     * @param {Object} message Message object containing the request
     */
    endGame(socket, message) {
        this.state = STATES.FINAL;
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
    }
}

//--- EXPORTS -----------------------------------------------------------------

module.teachingGame = teachingGame;
