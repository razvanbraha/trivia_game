jest.mock('../ws-api', () => require('../../../shared/ws-api'));

jest.mock('../db/question-dao', () => ({
    selectRandQuestions: jest.fn()
}));

const sharedWsApi = require('../../../shared/ws-api');
const questionDAO = require('../db/question-dao');
const { teachingGame } = require('../game/teaching-game');

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

describe('teaching-game', () => {
    let game;
    let hostWs;
    let playerWs;

    beforeEach(() => {
        jest.clearAllMocks();

        game = new teachingGame({
            code: 'ABCD',
            type: 'teaching',
            start_time: Date.now()
        });

        hostWs = createMockWS();
        playerWs = createMockWS();
    });

    test('constructor initializes game in lobby state', () => {
        expect(game.code).toBe('ABCD');
        expect(game.type).toBe('teaching');
        expect(game.state).toBe(teachingGame.STATES.LOBBY);
        expect(game.players).toEqual([]);
        expect(game.host).toBe(null);
    });

    test('first join makes websocket the host', () => {
        game.join(hostWs, 'Host');

        expect(game.host).toBe(hostWs);
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

    test('second join adds a player and notifies host', () => {
        game.join(hostWs, 'Host');
        hostWs.send.mockClear();

        game.join(playerWs, 'Bob');

        expect(game.players.length).toBe(1);
        expect(game.players[0].name).toBe('Bob');
        expect(playerWs.handler).toBe(game.handlers.player);

        expect(playerWs.send).toHaveBeenCalledWith(
            JSON.stringify({
                type: sharedWsApi.signals.RES.id,
                body: {
                    to: sharedWsApi.signals.JOIN.id,
                    success: true
                }
            })
        );

        expect(hostWs.send).toHaveBeenCalledWith(
            JSON.stringify({
                type: sharedWsApi.signals.JOINEE.id,
                body: { name: 'Bob' }
            })
        );
    });

    test('duplicate player name is rejected', () => {
        game.join(hostWs, 'Host');

        const ws1 = createMockWS();
        const ws2 = createMockWS();

        game.join(ws1, 'Bob');
        game.join(ws2, 'Bob');

        expect(game.players.length).toBe(1);
        expect(ws2.send).toHaveBeenCalledWith(
            JSON.stringify({
                type: sharedWsApi.signals.RES.id,
                body: {
                    to: sharedWsApi.signals.JOIN.id,
                    success: false
                }
            })
        );
    });

    test('join rejects empty player name', () => {
        game.join(hostWs, 'Host');

        game.join(playerWs, '');

        expect(game.players.length).toBe(0);
        expect(playerWs.send).toHaveBeenCalledWith(
            JSON.stringify({
                type: sharedWsApi.signals.RES.id,
                body: {
                    to: sharedWsApi.signals.JOIN.id,
                    success: false
                }
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

    test('getClassAccuracy returns 0 when there are no players', () => {
        expect(game.getClassAccuracy(0, 1)).toBe(0);
    });

    test('getClassAccuracy computes percentage correctly', () => {
        game.join(hostWs, 'Host');

        const ws1 = createMockWS();
        const ws2 = createMockWS();
        const ws3 = createMockWS();

        game.join(ws1, 'A');
        game.join(ws2, 'B');
        game.join(ws3, 'C');

        game.players[0].answers = [2];
        game.players[1].answers = [2];
        game.players[2].answers = [1];

        expect(game.getClassAccuracy(0, 2)).toBe(67);
    });

    test('getRankings sorts players by points descending', () => {
        game.join(hostWs, 'Host');

        const ws1 = createMockWS();
        const ws2 = createMockWS();

        game.join(ws1, 'A');
        game.join(ws2, 'B');

        game.players[0].points = 100;
        game.players[1].points = 300;

        const rankings = game.getRankings();

        expect(rankings[0].name).toBe('B');
        expect(rankings[1].name).toBe('A');
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

        expect(questionDAO.selectRandQuestions).toHaveBeenCalledWith(3, [1]);
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

    test('endGame closes host and all players and marks state ended', () => {
        game.join(hostWs, 'Host');

        const ws1 = createMockWS();
        const ws2 = createMockWS();

        game.join(ws1, 'A');
        game.join(ws2, 'B');

        game.endGame(hostWs, null);

        expect(game.state).toBe(teachingGame.STATES.ENDED);
        expect(hostWs.close).toHaveBeenCalledWith(1000, 'Game finished');
        expect(ws1.close).toHaveBeenCalledWith(1000, 'Game finished.');
        expect(ws2.close).toHaveBeenCalledWith(1000, 'Game finished.');
        expect(game.players).toEqual([]);
        expect(game.questions).toEqual([]);
    });

        test('join rejects players after game has started', () => {
        game.join(hostWs, 'Host');
        game.state = teachingGame.STATES.SHOW_QUESTION;

        game.join(playerWs, 'LatePlayer');

        expect(playerWs.send).toHaveBeenCalledWith(
            JSON.stringify({
                type: sharedWsApi.signals.RES.id,
                body: {
                    to: sharedWsApi.signals.JOIN.id,
                    success: false
                }
            })
        );
    });

    test('sendAll sends to host and all players', () => {
        game.join(hostWs, 'Host');

        const ws1 = createMockWS();
        const ws2 = createMockWS();
        game.join(ws1, 'A');
        game.join(ws2, 'B');

        hostWs.send.mockClear();
        ws1.send.mockClear();
        ws2.send.mockClear();

        game.sendAll(sharedWsApi.signals.READY, {});

        expect(hostWs.send).toHaveBeenCalled();
        expect(ws1.send).toHaveBeenCalled();
        expect(ws2.send).toHaveBeenCalled();
    });

    test('getCategoryAccuracy returns zeroes when no answers are correct', () => {
        game.join(hostWs, 'Host');

        const ws1 = createMockWS();
        game.join(ws1, 'A');

        game.questions = [
            { category: 1, correct_idx: 0 },
            { category: 2, correct_idx: 1 }
        ];

        game.players[0].answers = [2, 3];

        const stats = game.getCategoryAccuracy(game.players[0]);

        expect(stats[0].accuracy).toBe(0);
        expect(stats[0].num_correct).toBe(0);
        expect(stats[0].num_questions).toBe(1);

        expect(stats[1].accuracy).toBe(0);
        expect(stats[1].num_correct).toBe(0);
        expect(stats[1].num_questions).toBe(1);
    });

    test('getCategoryAccuracy returns 100 for correct answers in used categories', () => {
        game.join(hostWs, 'Host');

        const ws1 = createMockWS();
        game.join(ws1, 'A');

        game.questions = [
            { category: 1, correct_idx: 0 },
            { category: 1, correct_idx: 2 },
            { category: 3, correct_idx: 1 }
        ];

        game.players[0].answers = [0, 2, 1];

        const stats = game.getCategoryAccuracy(game.players[0]);

        expect(stats[0].accuracy).toBe(100);
        expect(stats[0].num_correct).toBe(2);
        expect(stats[0].num_questions).toBe(2);

        expect(stats[2].accuracy).toBe(100);
        expect(stats[2].num_correct).toBe(1);
        expect(stats[2].num_questions).toBe(1);
    });

    test('registerAnswer stores answer and awards points for correct response', () => {
        game.join(hostWs, 'Host');

        const ws1 = createMockWS();
        game.join(ws1, 'A');

        game.state = teachingGame.STATES.RECEIVE_RESPONSES;
        game.round_idx = 0;
        game.settings.live = 10;
        game.answering_start_time = new Date(Date.now() - 2000);
        game.questions = [
            { correct_idx: 2 }
        ];

        game.registerAnswer(ws1, { idx: 2 });

        expect(game.players[0].answers[0]).toBe(2);
        expect(game.players[0].points).toBeGreaterThan(0);
    });

    test('registerAnswer stores incorrect answer and gives no points', () => {
        game.join(hostWs, 'Host');

        const ws1 = createMockWS();
        game.join(ws1, 'A');

        game.state = teachingGame.STATES.RECEIVE_RESPONSES;
        game.round_idx = 0;
        game.settings.live = 10;
        game.answering_start_time = new Date();
        game.questions = [
            { correct_idx: 2 }
        ];

        game.registerAnswer(ws1, { idx: 1 });

        expect(game.players[0].answers[0]).toBe(1);
        expect(game.players[0].points).toBe(0);
    });

    test('registerAnswer rejects duplicate submissions', () => {
        game.join(hostWs, 'Host');

        const ws1 = createMockWS();
        game.join(ws1, 'A');

        game.state = teachingGame.STATES.RECEIVE_RESPONSES;
        game.round_idx = 0;
        game.settings.live = 10;
        game.answering_start_time = new Date();
        game.questions = [
            { correct_idx: 2 }
        ];
        game.players[0].answers[0] = 1;

        game.registerAnswer(ws1, { idx: 2 });

        expect(ws1.send).toHaveBeenCalledWith(
            JSON.stringify({
                type: sharedWsApi.signals.ERR.id,
                body: { err: 'Multiple answer submissions not allowed.' }
            })
        );
    });

    test('registerAnswer rejects invalid answer number', () => {
        game.join(hostWs, 'Host');

        const ws1 = createMockWS();
        game.join(ws1, 'A');

        game.state = teachingGame.STATES.RECEIVE_RESPONSES;
        game.round_idx = 0;
        game.settings.live = 10;
        game.answering_start_time = new Date();
        game.questions = [
            { correct_idx: 2 }
        ];

        game.registerAnswer(ws1, { idx: 99 });

        expect(ws1.send).toHaveBeenCalledWith(
            JSON.stringify({
                type: sharedWsApi.signals.ERR.id,
                body: { err: 'Invalid answer number.' }
            })
        );
    });

   test('registerAnswer throws for unrecognised connection', () => {
    game.join(hostWs, 'Host');

    const outsider = createMockWS();

    game.state = teachingGame.STATES.RECEIVE_RESPONSES;
    game.round_idx = 0;
    game.settings.live = 10;
    game.answering_start_time = new Date();
    game.questions = [
        { correct_idx: 2 }
    ];

    expect(() => {
        game.registerAnswer(outsider, { idx: 2 });
    }).toThrow();
});

    test('host KICK handler removes player and closes their socket', () => {
        game.join(hostWs, 'Host');

        const ws1 = createMockWS();
        game.join(ws1, 'A');

        expect(game.players.length).toBe(1);

        game.handlers.host.KICK(hostWs, { name: 'A' });

        expect(game.players.length).toBe(0);
        expect(ws1.close).toHaveBeenCalledWith(1000, 'Kicked by host');
    });

    test('host KICK handler responds false when player is missing', () => {
        game.join(hostWs, 'Host');

        game.handlers.host.KICK(hostWs, { name: 'Missing' });

        expect(hostWs.send).toHaveBeenCalledWith(
            JSON.stringify({
                type: sharedWsApi.signals.RES.id,
                body: {
                    to: sharedWsApi.signals.KICK.id,
                    success: false
                }
            })
        );
    });
});