function loadSessionsModule() {
    jest.resetModules();

    const teachingCtor = jest.fn((data) => ({
        ...data,
        join: jest.fn(),
        endGame: jest.fn(),
        state: 1
    }));

    const studyCtor = jest.fn((data) => ({
        ...data,
        join: jest.fn(),
        endGame: jest.fn(),
        state: 1
    }));

    jest.doMock('../ws-api', () => require('../../../shared/ws-api'));
    jest.doMock('../game/teaching-game', () => ({
        teachingGame: teachingCtor
    }));
    jest.doMock('../game/study-game', () => ({
        studyGame: studyCtor
    }));

    const setIntervalSpy = jest.spyOn(global, 'setInterval').mockImplementation(() => 123);

    const sessions = require('../game/sessions');

    return {
        sessions,
        teachingCtor,
        studyCtor,
        setIntervalSpy
    };
}

function createMockWS() {
    return {
        respond: jest.fn(),
        err: jest.fn()
    };
}

describe('sessions', () => {
    afterEach(() => {
        jest.restoreAllMocks();
        jest.resetModules();
    });

    test('create makes a teaching session and returns a 4-character code', () => {
        const { sessions, teachingCtor, studyCtor, setIntervalSpy } = loadSessionsModule();

        const code = sessions.create('teaching');

        expect(typeof code).toBe('string');
        expect(code).toMatch(/^[A-Z0-9]{4}$/);

        expect(teachingCtor).toHaveBeenCalledTimes(1);
        expect(studyCtor).not.toHaveBeenCalled();

        const ctorArg = teachingCtor.mock.calls[0][0];
        expect(ctorArg.code).toBe(code);
        expect(ctorArg.type).toBe('teaching');
        expect(typeof ctorArg.start_time).toBe('number');

        expect(sessions.exists(code)).toBe(true);
        expect(setIntervalSpy).toHaveBeenCalled();
    });

    test('create makes a study session and returns a 4-character code', () => {
        const { sessions, teachingCtor, studyCtor } = loadSessionsModule();

        const code = sessions.create('study');

        expect(typeof code).toBe('string');
        expect(code).toMatch(/^[A-Z0-9]{4}$/);

        expect(studyCtor).toHaveBeenCalledTimes(1);
        expect(teachingCtor).not.toHaveBeenCalled();

        const ctorArg = studyCtor.mock.calls[0][0];
        expect(ctorArg.code).toBe(code);
        expect(ctorArg.type).toBe('study');
        expect(typeof ctorArg.start_time).toBe('number');

        expect(sessions.exists(code)).toBe(true);
    });

    test('create returns null for invalid type', () => {
        const { sessions, teachingCtor, studyCtor } = loadSessionsModule();

        const code = sessions.create('invalid-type');

        expect(code).toBeNull();
        expect(teachingCtor).not.toHaveBeenCalled();
        expect(studyCtor).not.toHaveBeenCalled();
    });

    test('exists returns false for unknown code values', () => {
    const { sessions } = loadSessionsModule();

    expect(sessions.exists('ZZZZ')).toBe(false);
    expect(sessions.exists('')).toBeFalsy();
    expect(sessions.exists(null)).toBeNull();
    expect(sessions.exists(undefined)).toBeUndefined();
    });

    test('join routes websocket and name to existing session join handler', () => {
        const { sessions, teachingCtor } = loadSessionsModule();
        const code = sessions.create('teaching');

        const ws = createMockWS();
        const body = { code, name: 'Bob' };

        sessions.join(ws, body);

        const instance = teachingCtor.mock.results[0].value;

        expect(instance.join).toHaveBeenCalledTimes(1);
        expect(instance.join).toHaveBeenCalledWith(ws, 'Bob');

        expect(ws.err).not.toHaveBeenCalled();
        expect(ws.respond).toHaveBeenCalledTimes(1);
    });

    test('join sends error and false response when session does not exist', () => {
        const { sessions } = loadSessionsModule();
        const ws = createMockWS();

        sessions.join(ws, { code: 'NOPE', name: 'Bob' });

        expect(ws.err).toHaveBeenCalledWith('could not find session NOPE');
        expect(ws.respond).toHaveBeenCalledTimes(1);
    });

    test('join coerces name to string before passing to session', () => {
        const { sessions, teachingCtor } = loadSessionsModule();
        const code = sessions.create('teaching');

        const ws = createMockWS();
        sessions.join(ws, { code, name: 12345 });

        const instance = teachingCtor.mock.results[0].value;
        expect(instance.join).toHaveBeenCalledWith(ws, '12345');
    });

    test('create retries when generated code already exists', () => {
        const originalRandom = Math.random;

        const { sessions } = loadSessionsModule();

        // First session: AAAA
        let calls = 0;
        jest.spyOn(Math, 'random').mockImplementation(() => {
            calls += 1;
            return 0; // index 0 => 'A'
        });

        const firstCode = sessions.create('teaching');
        expect(firstCode).toBe('AAAA');

        // Second create:
        // first 4 calls => AAAA again (duplicate)
        // next 4 calls => BBBB
        const values = [
            0, 0, 0, 0,
            0, 0, 0, 0,
            0.03, 0.03, 0.03, 0.03
        ];
        let idx = 0;
        Math.random.mockImplementation(() => values[idx++]);

        const secondCode = sessions.create('study');

        expect(secondCode).not.toBe(firstCode);
        expect(secondCode).toBe('BBBB');

        Math.random = originalRandom;
    });

    test('sessions created by create are discoverable with exists', () => {
        const { sessions } = loadSessionsModule();

        const code1 = sessions.create('teaching');
        const code2 = sessions.create('study');

        expect(sessions.exists(code1)).toBe(true);
        expect(sessions.exists(code2)).toBe(true);
        expect(code1).not.toBe(code2);
    });
});