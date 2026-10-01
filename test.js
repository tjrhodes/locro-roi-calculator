// node test.js — checks the compounding maths against hand-worked figures
const assert = require('assert');
const { cumulative, roundDown3sf } = require('./calc.js');

const annual = 250000 * 0.015 * 0.60;            // €2,250 a year
assert.strictEqual(annual, 2250);
assert.strictEqual(cumulative(1, annual, 0.10), 2250);
assert.strictEqual(cumulative(3, annual, 0.10), 2250 * (3 + 0.3));    // 7,425
assert.strictEqual(cumulative(10, annual, 0.10), 2250 * (10 + 4.5));  // 32,625
assert.strictEqual(cumulative(10, annual, 0), 22500);                 // no carry = straight line
assert.strictEqual(roundDown3sf(32625), 32600);
assert.strictEqual(roundDown3sf(999.9), 999);
console.log('all tests pass');
