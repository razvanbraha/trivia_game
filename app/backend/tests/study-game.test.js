jest.mock('../ws-api', () => require('../../../shared/ws-api'));

jest.mock('../db/question-dao', () => ({
    selectRandQuestions: jest.fn()
}));

const sharedWsApi = require('../../../shared/ws-api');
const questionDAO = require('../db/question-dao');
const { studyGame } = require('../game/study-game');

function createMockWS() {
    const handlers = {};

    const ws = {
        send: jest.fn(),
        close: jest.fn(),
        on: jest.fn((event, cb) => {
            handlers[event] = cb;
        }),
        trigger(event, data) {
            if (handlers[event]) {
                handlers[event](data);
            }
        }
    };

    sharedWsApi.init(ws, sharedWsApi.users.SERVER, {}, null);
    return ws;
}

describe('study-game', () => {
    let game;
    let hostWs;
    let otherWs;

    beforeEach(() => {
        jest.clearAllMocks();

        game = new studyGame({
            code: 'ABCD',
            type: 'study',
            start_time: Date.now()
        });

        hostWs = createMockWS();
        otherWs = createMockWS();
    });

    test('constructor initializes game in lobby state', () => {
        expect(game.code).toBe('ABCD');
        expect(game.type).toBe('study');
        expect(game.state).toBe(studyGame.STATES.LOBBY);
        expect(game.host).toBe(null);
        expect(game.questions).toEqual([]);
    });

    test('first join makes websocket the host object', () => {
        game.join(hostWs, 'Host');

        expect(game.host).not.toBe(null);
        expect(game.host.name).toBe('Host');
        expect(game.host.ws).toBe(hostWs);
        expect(game.host.points).toBe(0);
        expect(game.host.answers).toEqual([]);
        expect(hostWs.handler).toBe(game.handlers.host);

        expect(hostWs.send).toHaveBeenCalledWith(
            JSON.stringify({
                type: sharedWsApi.signals.RES.id,
                body: {
                    to: sharedWsApi.signals.JOIN.id,
                    success: true
                }
            })
        );
    });

    test('second join is rejected because study game only allows one host', () => {
        game.join(hostWs, 'Host');

        otherWs.send.mockClear();
        game.join(otherWs, 'Other');

        expect(otherWs.send).toHaveBeenCalledWith(
            JSON.stringify({
                type: sharedWsApi.signals.ERR.id,
                body: { err: 'Host already Joined.' }
            })
        );
        expect(game.host.name).toBe('Host');
    });

    test('join rejects websocket after game has started', () => {
        game.join(hostWs, 'Host');
        game.state = studyGame.STATES.SHOW_QUESTION;

        otherWs.send.mockClear();
        game.join(otherWs, 'Late');

        expect(otherWs.send).toHaveBeenCalledWith(
            JSON.stringify({
                type: sharedWsApi.signals.RES.id,
                body: {
                    to: sharedWsApi.signals.JOIN.id,
                    success: false
                }
            })
        );

        expect(otherWs.send).toHaveBeenCalledWith(
            JSON.stringify({
                type: sharedWsApi.signals.ERR.id,
                body: { err: 'Game already started.' }
            })
        );
    });

    test('validateSettings returns true for valid settings', () => {
        game.join(hostWs, 'Host');

        const settings = {
            rounds: 5,
            categories: [1, 2, 3],
            preview: 5,
            dead: 3,
            live: 10
        };

        expect(game.validateSettings(settings)).toBe(true);
    });

    test('validateSettings returns false for invalid settings', () => {
        game.join(hostWs, 'Host');

        const settings = {
            rounds: 0,
            categories: [1, 1],
            preview: 0,
            dead: 0,
            live: 0
        };

        expect(game.validateSettings(settings)).toBe(false);
    });

    test('getSanitizedHost returns host without websocket', () => {
        game.join(hostWs, 'Host');
        game.host.points = 250;
        game.host.answers = [1, 2];

        expect(game.getSanitizedHost()).toEqual({
            name: 'Host',
            points: 250,
            answers: [1, 2]
        });
    });

    test('getCurrentAccuracy returns correct stats', () => {
        game.join(hostWs, 'Host');

        game.questions = [
            { correct_idx: 1 },
            { correct_idx: 2 },
            { correct_idx: 0 }
        ];
        game.host.answers = [1, 0, 0];

        expect(game.getCurrentAccuracy()).toEqual({
            accuracy: 67,
            num_correct: 2,
            num_questions: 3
        });
    });

    test('getCategoryAccuracy returns correct stats for host', () => {
        game.join(hostWs, 'Host');

        game.questions = [
            { category: 1, correct_idx: 0 },
            { category: 1, correct_idx: 2 },
            { category: 3, correct_idx: 1 }
        ];
        game.host.answers = [0, 2, 0];

        const stats = game.getCategoryAccuracy();

        expect(stats[0].accuracy).toBe(100);
        expect(stats[0].num_correct).toBe(2);
        expect(stats[0].num_questions).toBe(2);

        expect(stats[2].accuracy).toBe(0);
        expect(stats[2].num_correct).toBe(0);
        expect(stats[2].num_questions).toBe(1);
    });

    test('sendAll sends to host websocket only', () => {
        game.join(hostWs, 'Host');
        hostWs.send.mockClear();

        game.sendAll(sharedWsApi.signals.READY, {});

        expect(hostWs.send).toHaveBeenCalledWith(
            JSON.stringify({
                type: sharedWsApi.signals.READY.id,
                body: {}
            })
        );
    });

    test('startGame rejects invalid settings and sends error', async () => {
        game.join(hostWs, 'Host');

        const settings = {
            rounds: 0,
            categories: [],
            preview: 0,
            dead: 0,
            live: 0
        };

        await game.startGame(settings);

        expect(questionDAO.selectRandQuestions).not.toHaveBeenCalled();
        expect(hostWs.send).toHaveBeenCalledWith(
            JSON.stringify({
                type: sharedWsApi.signals.ERR.id,
                body: { err: 'Invalid settings.' }
            })
        );
    });

    test('startGame sends error when question loading throws', async () => {
        game.join(hostWs, 'Host');

        const settings = {
            rounds: 2,
            categories: [1],
            preview: 5,
            dead: 3,
            live: 10
        };

        questionDAO.selectRandQuestions.mockRejectedValue(new Error('db fail'));

        await game.startGame(settings);

        expect(questionDAO.selectRandQuestions).toHaveBeenCalledWith(2, [1]);
        expect(hostWs.send).toHaveBeenCalledWith(
            JSON.stringify({
                type: sharedWsApi.signals.ERR.id,
                body: { err: 'Questions could not be loaded succcessfully.' }
            })
        );
    });

    test('startGame sends error when not enough questions are returned', async () => {
        game.join(hostWs, 'Host');

        const settings = {
            rounds: 3,
            categories: [1],
            preview: 5,
            dead: 3,
            live: 10
        };

        jest.spyOn(game, 'runGame').mockImplementation(() => {});
        questionDAO.selectRandQuestions.mockResolvedValue([
            {
                question: 'Q1',
                corrAnswer: 'A',
                incorrONE: 'B',
                incorrTWO: 'C',
                incorrTHREE: 'D',
                category: 1
            }
        ]);

        await game.startGame(settings);

        expect(game.runGame).not.toHaveBeenCalled();
        expect(hostWs.send).toHaveBeenCalledWith(
            JSON.stringify({
                type: sharedWsApi.signals.ERR.id,
                body: { err: 'Not enough questions in Database. Need 3, has 1' }
            })
        );
    });

    test('startGame loads questions and calls runGame when data is valid', async () => {
        game.join(hostWs, 'Host');

        const settings = {
            rounds: 2,
            categories: [1],
            preview: 5,
            dead: 3,
            live: 10
        };

        jest.spyOn(game, 'runGame').mockImplementation(() => {});
        questionDAO.selectRandQuestions.mockResolvedValue([
            {
                question: 'Q1',
                corrAnswer: 'A',
                incorrONE: 'B',
                incorrTWO: 'C',
                incorrTHREE: 'D',
                category: 1
            },
            {
                question: 'Q2',
                corrAnswer: 'T',
                incorrONE: 'F',
                incorrTWO: 'X',
                incorrTHREE: 'Y',
                category: 1
            }
        ]);

        await game.startGame(settings);

        expect(questionDAO.selectRandQuestions).toHaveBeenCalledWith(2, [1]);
        expect(game.questions.length).toBe(2);
        expect(game.questions[0]).toHaveProperty('text');
        expect(game.questions[0]).toHaveProperty('choices');
        expect(game.questions[0]).toHaveProperty('correct_idx');
        expect(game.runGame).toHaveBeenCalled();
    });

    test('registerAnswer stores answer and awards points for correct response', () => {
        game.join(hostWs, 'Host');

        game.state = studyGame.STATES.RECEIVE_RESPONSES;
        game.round_idx = 0;
        game.settings.live = 10;
        game.answering_start_time = new Date(Date.now() - 2000);
        game.questions = [
            { correct_idx: 2 }
        ];

        game.registerAnswer(hostWs, { idx: 2 });

        expect(game.host.answers[0]).toBe(2);
        expect(game.host.points).toBeGreaterThan(0);
    });

    test('registerAnswer stores incorrect answer and gives no points', () => {
        game.join(hostWs, 'Host');

        game.state = studyGame.STATES.RECEIVE_RESPONSES;
        game.round_idx = 0;
        game.settings.live = 10;
        game.answering_start_time = new Date();
        game.questions = [
            { correct_idx: 2 }
        ];

        game.registerAnswer(hostWs, { idx: 1 });

        expect(game.host.answers[0]).toBe(1);
        expect(game.host.points).toBe(0);
    });

    test('registerAnswer rejects duplicate submissions', () => {
        game.join(hostWs, 'Host');

        game.state = studyGame.STATES.RECEIVE_RESPONSES;
        game.round_idx = 0;
        game.settings.live = 10;
        game.answering_start_time = new Date();
        game.questions = [
            { correct_idx: 2 }
        ];
        game.host.answers[0] = 1;

        game.registerAnswer(hostWs, { idx: 2 });

        expect(hostWs.send).toHaveBeenCalledWith(
            JSON.stringify({
                type: sharedWsApi.signals.ERR.id,
                body: { err: 'Multiple answer submissions not allowed.' }
            })
        );
    });

    test('registerAnswer rejects invalid answer number', () => {
        game.join(hostWs, 'Host');

        game.state = studyGame.STATES.RECEIVE_RESPONSES;
        game.round_idx = 0;
        game.settings.live = 10;
        game.answering_start_time = new Date();
        game.questions = [
            { correct_idx: 2 }
        ];

        game.registerAnswer(hostWs, { idx: 99 });

        expect(hostWs.send).toHaveBeenCalledWith(
            JSON.stringify({
                type: sharedWsApi.signals.ERR.id,
                body: { err: 'Invalid answer number.' }
            })
        );
    });

    test('registerAnswer rejects unrecognised connection', () => {
        game.join(hostWs, 'Host');

        game.state = studyGame.STATES.RECEIVE_RESPONSES;
        game.round_idx = 0;
        game.settings.live = 10;
        game.answering_start_time = new Date();
        game.questions = [
            { correct_idx: 2 }
        ];

        game.registerAnswer(otherWs, { idx: 2 });

        expect(otherWs.send).toHaveBeenCalledWith(
            JSON.stringify({
                type: sharedWsApi.signals.ERR.id,
                body: { err: 'Unrecognised connection' }
            })
        );
    });

    test('host ANSWER handler sends ACK after registering answer', () => {
        game.join(hostWs, 'Host');

        game.state = studyGame.STATES.RECEIVE_RESPONSES;
        game.round_idx = 0;
        game.settings.live = 10;
        game.answering_start_time = new Date();
        game.questions = [
            { correct_idx: 2 }
        ];

        hostWs.send.mockClear();
        game.handlers.host.ANSWER(hostWs, { idx: 2, num: 2 });

        expect(hostWs.send).toHaveBeenCalledWith(
            JSON.stringify({
                type: sharedWsApi.signals.ACK.id,
                body: { msg: 'received your answer (2)' }
            })
        );
    });


    // there might be a bug here
   test('host CONTINUE handler ends game in final state', () => {
    game.join(hostWs, 'Host');
    game.state = studyGame.STATES.FINAL;

    game.handlers.host.CONTINUE(hostWs, {});

    expect(game.state).toBe(studyGame.STATES.FINAL);
    expect(hostWs.close).not.toHaveBeenCalled();
});

    test('host NEXTROUND handler resolves waiting promise callback', () => {
        game.join(hostWs, 'Host');
        game.state = studyGame.STATES.AWAIT_NEXT;

        const nextSpy = jest.fn();
        game.signalNextRound = nextSpy;

        game.handlers.host.NEXTROUND(hostWs, {});

        expect(nextSpy).toHaveBeenCalled();
    });

    test('endGame closes host and clears memory', () => {
        game.join(hostWs, 'Host');
        game.questions = [{ text: 'Q1' }];

        game.endGame(hostWs, null);

        expect(game.state).toBe(studyGame.STATES.ENDED);
        expect(hostWs.close).toHaveBeenCalledWith(1000, 'Game finished');
        expect(game.questions).toEqual([]);
        expect(game.host.ws.handler).toBe(null);
    });
});