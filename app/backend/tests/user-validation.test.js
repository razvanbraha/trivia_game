const validateUser = require('../db/user-validation');

describe('user-validation', () => {
    test('returns true for a valid unityID', () => {
        const body = { unityID: 'abc123' };
        expect(validateUser(body)).toBe(true);
    });

    test('returns false when unityID is missing', () => {
        const body = {};
        expect(validateUser(body)).toBe(false);
    });

    test('returns false when unityID is empty', () => {
        const body = { unityID: '' };
        expect(validateUser(body)).toBe(false);
    });

    test('returns false when unityID is longer than 8 characters', () => {
        const body = { unityID: 'toolong99' };
        expect(validateUser(body)).toBe(false);
    });

    test('returns true when unityID is exactly 8 characters', () => {
        const body = { unityID: 'abcd1234' };
        expect(validateUser(body)).toBe(true);
    });

    test('ignores extra fields if unityID is valid', () => {
        const body = {
            unityID: 'student1',
            note: 'test note',
            questionPriv: true,
            userPriv: false
        };
        expect(validateUser(body)).toBe(true);
    });
});