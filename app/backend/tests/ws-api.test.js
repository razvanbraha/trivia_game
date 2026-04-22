const wsApi = require('../../../shared/ws-api');

function createMockWS() {
    const handlers = {};

    return {
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
}

describe('ws-api', () => {
    test('exports expected top-level api', () => {
        expect(typeof wsApi.init).toBe('function');
        expect(typeof wsApi.support).toBe('function');
        expect(typeof wsApi.signals).toBe('object');
        expect(typeof wsApi.users).toBe('object');
    });

    test('init sets websocket fields', () => {
        const ws = createMockWS();

        wsApi.init(ws, wsApi.users.SERVER, {}, null);

        expect(ws.user).toBe(wsApi.users.SERVER);
        expect(ws.other).toBe(wsApi.users.CLIENT);
        expect(ws.expecting).toBe(null);
        expect(ws.handler).toEqual({});
        expect(typeof ws.signal).toBe('function');
        expect(typeof ws.respond).toBe('function');
        expect(typeof ws.expect).toBe('function');
        expect(typeof ws.err).toBe('function');
        expect(typeof ws.kill).toBe('function');
    });

    test('init sends ACK on open and calls first callback', () => {
        const ws = createMockWS();
        const first = jest.fn();

        wsApi.init(ws, wsApi.users.SERVER, {}, first);
        ws.trigger('open');

        expect(ws.send).toHaveBeenCalledWith(
            JSON.stringify({
                type: wsApi.signals.ACK.id,
                body: { msg: 'hi' }
            })
        );
        expect(first).toHaveBeenCalled();
    });

    test('support registers handler by signal id', () => {
        const handler = {};
        const action = jest.fn();

        wsApi.support(handler, wsApi.signals.JOIN, action);

        expect(handler.JOIN).toBe(action);
    });

    test('respond sends RES packet', () => {
        const ws = createMockWS();

        wsApi.init(ws, wsApi.users.SERVER, {}, null);
        ws.respond(wsApi.signals.JOIN, true);

        expect(ws.send).toHaveBeenCalledWith(
            JSON.stringify({
                type: wsApi.signals.RES.id,
                body: { to: wsApi.signals.JOIN.id, success: true }
            })
        );
    });

    test('err sends ERR packet', () => {
        const ws = createMockWS();

        wsApi.init(ws, wsApi.users.SERVER, {}, null);
        ws.err('bad stuff');

        expect(ws.send).toHaveBeenCalledWith(
            JSON.stringify({
                type: wsApi.signals.ERR.id,
                body: { err: 'bad stuff' }
            })
        );
    });

    test('kill closes websocket with code 1000', () => {
        const ws = createMockWS();

        wsApi.init(ws, wsApi.users.SERVER, {}, null);
        ws.kill('done');

        expect(ws.close).toHaveBeenCalledWith(1000, 'done');
    });

    test('signal rejects unauthorized signal type', () => {
        const ws = createMockWS();

        wsApi.init(ws, wsApi.users.SERVER, {}, null);
        const result = ws.signal(wsApi.signals.JOIN, { code: 'ABCD', name: 'Bob' });

        expect(result).toBe(false);
        expect(ws.send).not.toHaveBeenCalled();
    });

    test('message event routes supported signal handler', () => {
        const ws = createMockWS();
        const joinHandler = jest.fn();
        const handler = {};

        wsApi.support(handler, wsApi.signals.JOIN, joinHandler);
        wsApi.init(ws, wsApi.users.SERVER, handler, null);

        ws.trigger('message', Buffer.from(JSON.stringify({
            type: 'JOIN',
            body: { code: 'ABCD', name: 'Bob' }
        })));

        expect(joinHandler).toHaveBeenCalledWith(ws, { code: 'ABCD', name: 'Bob' });
    });

    test('invalid JOIN body sends ERR packet', () => {
        const ws = createMockWS();
        const handler = {};

        wsApi.init(ws, wsApi.users.SERVER, handler, null);

        ws.trigger('message', Buffer.from(JSON.stringify({
            type: 'JOIN',
            body: { code: 'ABCD' }
        })));

        expect(ws.send).toHaveBeenCalledWith(
            JSON.stringify({
                type: 'ERR',
                body: { err: 'invalid format for JOIN' }
            })
        );
    });
});