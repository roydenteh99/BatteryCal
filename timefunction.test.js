import { test } from 'node:test';
import assert from 'node:assert';
import { addHours, getTimeDiffInHours } from './TimeFunction.js';

test('Testing addHours function', () => {
    const date = new Date(2026, 0, 1, 0, 0); // January 1, 2026, 00:00
    const newDate = addHours(date, 1.5);    
    assert.strictEqual(newDate.getHours(), 1);
    assert.strictEqual(newDate.getMinutes(), 30);
});

test('Testing getTimeDiffInHours function', () => {
    const date1 = new Date(2026, 0, 1, 0, 0); // January 1, 2026, 00:00
    const date2 = new Date(2026, 0, 1, 2, 30); // January 1, 2026, 02:30
    const diff = getTimeDiffInHours(date1, date2);
    assert.strictEqual(diff, 2.5);
});



// Command to run single test: node --test timefunction.test.js