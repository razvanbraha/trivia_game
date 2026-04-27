const { shuffle } = require('../game/utils');

describe('utils - shuffle', () => {
    test('does not change array length', () => {
        const arr = [1, 2, 3, 4, 5];
        shuffle(arr);
        expect(arr.length).toBe(5);
    });

    test('contains same elements after shuffle', () => {
        const arr = [1, 2, 3, 4, 5];
        const original = [...arr];

        shuffle(arr);

        expect([...arr].sort()).toEqual([...original].sort());
    });

    test('modifies the original array in place', () => {
        const arr = [1, 2, 3, 4, 5];
        const sameRef = arr;

        shuffle(arr);

        expect(arr).toBe(sameRef);
    });

    test('handles empty array', () => {
        const arr = [];
        shuffle(arr);
        expect(arr).toEqual([]);
    });

    test('handles single-element array', () => {
        const arr = [42];
        shuffle(arr);
        expect(arr).toEqual([42]);
    });
});