import { test } from 'node:test';
import assert from 'node:assert';
//import { User } from './User.js'; whatever class you want to test, import it here

test('Testing Template', () => {
    const tester = {name: 'Alice'}
    
    // Check if the name matches
    assert.strictEqual(tester.name, 'Alice');
});


// Command to run single test: node --test testTemplate.test.js
// Command to run all tests: node --test