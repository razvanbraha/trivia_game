const request = require('supertest');
const express = require('express');
const roomRouter = require('../rest-api/room');

function buildApp() {
    const app = express();
    app.use(express.json());
    app.use('/room', roomRouter);
    return app;
}

describe('room api', () => {
    let app;

    beforeEach(() => {
        app = buildApp();
    });

    test('POST /room/create returns a 4-digit room code', async () => {
        const res = await request(app).post('/room/create');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('code');
        expect(res.body.code).toMatch(/^\d{4}$/);
    });

    test('POST /room/join returns 404 for missing room', async () => {
        const res = await request(app)
            .post('/room/join')
            .send({
                code: '9999',
                name: 'Bob'
            });

        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({ error: 'Room not found' });
    });

    test('POST /room/join joins an existing room', async () => {
        const createRes = await request(app).post('/room/create');
        const code = createRes.body.code;

        const joinRes = await request(app)
            .post('/room/join')
            .send({
                code,
                name: 'Bob'
            });

        expect(joinRes.statusCode).toBe(200);
        expect(joinRes.body).toEqual({ success: true });

        const roomRes = await request(app).get(`/room/${code}`);
        expect(roomRes.statusCode).toBe(200);
        expect(roomRes.body.players).toContain('Bob');
    });

    test('GET /room/:code returns 404 for missing room', async () => {
        const res = await request(app).get('/room/9999');

        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({ error: 'Room not found' });
    });

    test('GET /room/:code returns room data for existing room', async () => {
        const createRes = await request(app).post('/room/create');
        const code = createRes.body.code;

        const res = await request(app).get(`/room/${code}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('players');
        expect(res.body).toHaveProperty('settings');
        expect(Array.isArray(res.body.players)).toBe(true);
    });

    test('POST /room/:code/settings returns 404 for missing room', async () => {
        const res = await request(app)
            .post('/room/9999/settings')
            .send({
                questions: 10,
                categories: ['Category 1']
            });

        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({ error: 'Room not found' });
    });

    test('POST /room/:code/settings updates room settings', async () => {
        const createRes = await request(app).post('/room/create');
        const code = createRes.body.code;

        const newSettings = {
            questions: 10,
            categories: ['Category 1', 'Category 2']
        };

        const settingsRes = await request(app)
            .post(`/room/${code}/settings`)
            .send(newSettings);

        expect(settingsRes.statusCode).toBe(200);
        expect(settingsRes.body).toEqual({ success: true });

        const roomRes = await request(app).get(`/room/${code}`);
        expect(roomRes.statusCode).toBe(200);
        expect(roomRes.body.settings).toEqual(newSettings);
    });

    test('DELETE /room/:code deletes a room', async () => {
        const createRes = await request(app).post('/room/create');
        const code = createRes.body.code;

        const deleteRes = await request(app).delete(`/room/${code}`);

        expect(deleteRes.statusCode).toBe(200);
        expect(deleteRes.body).toEqual({ success: true });

        const roomRes = await request(app).get(`/room/${code}`);
        expect(roomRes.statusCode).toBe(404);
        expect(roomRes.body).toEqual({ error: 'Room not found' });
    });
});