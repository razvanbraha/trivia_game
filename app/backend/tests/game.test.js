const request = require('supertest');
const express = require('express');

jest.mock('../game/sessions', () => ({
    create: jest.fn(),
    join: jest.fn(),
    exists: jest.fn()
}));

const sessions = require('../game/sessions');
const gameRouter = require('../rest-api/game');

function buildApp() {
    const app = express();
    app.use(express.json());
    app.use('/games', gameRouter);
    return app;
}

describe('game api', () => {
    let app;

    beforeEach(() => {
        app = buildApp();
        jest.clearAllMocks();
    });

    test('GET /games/:code returns 200 when session exists', async () => {
        sessions.exists.mockReturnValue(true);

        const res = await request(app).get('/games/abcd');

        expect(res.statusCode).toBe(200);
        expect(sessions.exists).toHaveBeenCalledWith('ABCD');
    });

    test('GET /games/:code returns 404 when session does not exist', async () => {
        sessions.exists.mockReturnValue(false);

        const res = await request(app).get('/games/abcd');

        expect(res.statusCode).toBe(404);
        expect(sessions.exists).toHaveBeenCalledWith('ABCD');
    });

    test('POST /games returns 200 and code when session is created', async () => {
        sessions.create.mockReturnValue('ABCD');

        const res = await request(app)
            .post('/games')
            .send({ type: 'teaching' });

        expect(res.statusCode).toBe(200);
        expect(sessions.create).toHaveBeenCalledWith('teaching');
        expect(res.body).toEqual({ code: 'ABCD' });
    });

    test('POST /games returns 500 when session creation fails', async () => {
        sessions.create.mockReturnValue(null);

        const res = await request(app)
            .post('/games')
            .send({ type: 'bad-type' });

        expect(res.statusCode).toBe(500);
        expect(sessions.create).toHaveBeenCalledWith('bad-type');
    });
});