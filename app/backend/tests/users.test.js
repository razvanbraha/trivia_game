const request = require('supertest');
const express = require('express');

process.env.ADMIN_PASSWORD = 'secret';

jest.mock('../db/user-dao', () => ({
    addUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    getAllUser: jest.fn(),
    getByUnityId: jest.fn(),
    getByID: jest.fn()
}));

const {
    addUser,
    updateUser,
    deleteUser,
    getAllUser,
    getByUnityId,
    getByID
} = require('../db/user-dao');

const userRouter = require('../rest-api/user');

function buildApp() {
    const app = express();
    app.use(express.json());
    app.use('/users', userRouter);
    return app;
}

describe('users api', () => {
    let app;

    beforeEach(() => {
        app = buildApp();
        jest.clearAllMocks();
    });

    test('GET /users returns all users', async () => {
        getAllUser.mockResolvedValue([
            { userID: 1, unityID: 'abc123' },
            { userID: 2, unityID: 'xyz789' }
        ]);

        const res = await request(app).get('/users');

        expect(res.statusCode).toBe(200);
        expect(getAllUser).toHaveBeenCalled();
        expect(res.body).toEqual([
            { userID: 1, unityID: 'abc123' },
            { userID: 2, unityID: 'xyz789' }
        ]);
    });

    test('GET /users?id=1 returns user by id', async () => {
        getByID.mockResolvedValue([{ userID: 1, unityID: 'abc123' }]);

        const res = await request(app).get('/users?id=1');

        expect(res.statusCode).toBe(200);
        expect(getByID).toHaveBeenCalledWith('1');
        expect(res.body).toEqual([{ userID: 1, unityID: 'abc123' }]);
    });

    test('GET /users?unityId=abc123 returns user by unityId', async () => {
        getByUnityId.mockResolvedValue([{ userID: 1, unityID: 'abc123' }]);

        const res = await request(app).get('/users?unityId=abc123');

        expect(res.statusCode).toBe(200);
        expect(getByUnityId).toHaveBeenCalledWith('abc123');
        expect(res.body).toEqual([{ userID: 1, unityID: 'abc123' }]);
    });

    test('POST /users returns 403 with wrong admin password', async () => {
        const res = await request(app)
            .post('/users')
            .send({
                unityID: 'abc123',
                adminPassword: 'wrong'
            });

        expect(res.statusCode).toBe(403);
        expect(addUser).not.toHaveBeenCalled();
    });

    test('POST /users returns 201 for valid user', async () => {
        addUser.mockResolvedValue(1);

        const res = await request(app)
            .post('/users')
            .send({
                unityID: 'abc123',
                adminPassword: 'secret'
            });

        expect(res.statusCode).toBe(201);
        expect(addUser).toHaveBeenCalledWith({
            unityID: 'abc123',
            adminPassword: 'secret'
        });
        expect(res.body).toEqual({ message: 'User added' });
    });

    test('POST /users returns 400 for invalid user body', async () => {
        const res = await request(app)
            .post('/users')
            .send({
                unityID: 'toolong99',
                adminPassword: 'secret'
            });

        expect(res.statusCode).toBe(400);
        expect(addUser).not.toHaveBeenCalled();
    });

    test('DELETE /users returns 403 with wrong admin password', async () => {
        const res = await request(app)
            .delete('/users')
            .set('x-shib-uid', 'teacher1')
            .send({
                userID: 1,
                unityID: 'student1',
                adminPassword: 'wrong'
            });

        expect(res.statusCode).toBe(403);
        expect(deleteUser).not.toHaveBeenCalled();
    });

    test('DELETE /users returns 403 when deleting yourself', async () => {
        const res = await request(app)
            .delete('/users')
            .set('x-shib-uid', 'abc123')
            .send({
                userID: 1,
                unityID: 'abc123',
                adminPassword: 'secret'
            });

        expect(res.statusCode).toBe(403);
        expect(deleteUser).not.toHaveBeenCalled();
    });

    test('DELETE /users returns 200 for valid delete', async () => {
        getByID.mockResolvedValue([{ userID: 1, unityID: 'student1', userPriv: false }]);
        deleteUser.mockResolvedValue(1);

        const res = await request(app)
            .delete('/users')
            .set('x-shib-uid', 'teacher1')
            .send({
                userID: 1,
                unityID: 'student1',
                adminPassword: 'secret'
            });

        expect(res.statusCode).toBe(200);
        expect(deleteUser).toHaveBeenCalledWith(1);
    });

    test('PUT /users returns 403 with wrong admin password', async () => {
        const res = await request(app)
            .put('/users')
            .set('x-shib-uid', 'teacher1')
            .send({
                userID: 1,
                unityID: 'student1',
                adminPassword: 'wrong'
            });

        expect(res.statusCode).toBe(403);
        expect(updateUser).not.toHaveBeenCalled();
    });

    test('PUT /users returns 403 when modifying yourself', async () => {
        const res = await request(app)
            .put('/users')
            .set('x-shib-uid', 'abc123')
            .send({
                userID: 1,
                unityID: 'abc123',
                adminPassword: 'secret'
            });

        expect(res.statusCode).toBe(403);
        expect(updateUser).not.toHaveBeenCalled();
    });

    test('PUT /users returns 200 for valid update', async () => {
        getByID.mockResolvedValue([{ userID: 1, unityID: 'student1', userPriv: false }]);
        updateUser.mockResolvedValue(1);

        const res = await request(app)
            .put('/users')
            .set('x-shib-uid', 'teacher1')
            .send({
                userID: 1,
                unityID: 'student1',
                note: 'updated',
                questionPriv: true,
                userPriv: false,
                adminPassword: 'secret'
            });

        expect(res.statusCode).toBe(200);
        expect(updateUser).toHaveBeenCalled();
        expect(res.body).toEqual({ message: 'User updated' });
    });
});