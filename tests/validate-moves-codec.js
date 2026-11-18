const assert = require('node:assert/strict');
const moves = require('../moves-codec.js');
const button = command => ({ type: 'button', command });
const position = index => ({ type: 'position', index });

// A saved file is precisely the moves value; build=0/1 changes only its default.
const events = [button('digit:6'), button('submit'), position(0), button('numericalRewrite'),
  button('digit:2'), button('prod'), button('digit:3'), button('submit')];
for (const build of [false, true]) {
  const text = moves.encode(events, build);
  assert.deepEqual(moves.decode(text).events, events);
  assert.equal(moves.decode(text + '\n').build, build);
  assert.equal(new URLSearchParams({ moves: text }).get('moves'), text);
  assert.match(text, /^[A-Za-z0-9._-]+$/);
  assert.equal(text.split('.')[2].length, events.length);
}
for (const index of [0, 31, 32, 63, 64, 511, 1023]) {
  const text = moves.encode([position(index)]);
  assert.deepEqual(moves.decode(text).events, [position(index)]);
  assert.equal(text.split('.')[2].length, index < 32 ? 1 : 3);
}
assert.throws(() => moves.encode([position(1024)]), /too large/);
for (const command of moves.commands) {
  assert.deepEqual(moves.decode(moves.encode([button(command)])).events, [button(command)]);
}
const text = moves.encode(events);
assert.throws(() => moves.decode(text.slice(0, -1)), /incomplete/);
assert.throws(() => moves.decode(text.replace('.1.', '.0.')), /incomplete/);
assert.throws(() => moves.decode(text.replace('6I', '7I')), /incomplete/);
assert.throws(() => moves.decode('3.1.0.12345678'), /not a supported/);

const value = value => ({ type: 'value', value, args: [] });
const inv = child => ({ type: 'inv', args: [child] });
const root = { type: 'sum', args: [inv(inv(value('x'))), value('2')] };
assert.deepEqual(moves.targets(root).map(({ node }) => node.type), ['inv', 'inv', 'value', 'value']);
assert.deepEqual(moves.selectionPositions(root, { path: [0], firstPart: 0, lastPart: 0 }), [0]);
assert.deepEqual(moves.selectionPositions(root, { path: [0, 0], firstPart: 0, lastPart: 0 }), [1]);
assert.deepEqual(moves.selectionPositions(root, { path: [0, 0, 0], firstPart: 0, lastPart: 0 }), [2]);
assert.deepEqual(moves.selectionPositions(root, { path: [], firstPart: 0, lastPart: 1 }), [0, 3]);
const denominator = { type: 'sum', args: [value('x'), value('2')] };
assert.deepEqual(moves.selectionPositions(inv(denominator), { path: [0], firstPart: 0, lastPart: 1 }), [1, 2]);
console.log('Compact moves: action codes, extended positions, file defaults, round trips, inverse targets and corruption detection passed.');

// Current recordings preserve individual value, inverse-header and separator hits.
const orderedRoot = { type: 'sum', args: [value('2'), value('3'), value('4')] };
assert.deepEqual(moves.clickTargets(orderedRoot).map(t => [t.path, t.firstPart, t.lastPart]),
  [[[0], 0, 0], [[], 0, 1], [[1], 0, 0], [[], 1, 2], [[2], 0, 0]]);
const selected = { path: [], firstPart: 0, lastPart: 2, clicks: [
  { path: [2], firstPart: 0, lastPart: 0 }, { path: [0], firstPart: 0, lastPart: 0 }
] };
assert.deepEqual(moves.clickPositions(orderedRoot, selected), [4, 0], 'Preserve right-to-left click order');
assert.deepEqual(moves.clickPositions(orderedRoot, { path: [], firstPart: 0, lastPart: 1 }), [1]);
assert.deepEqual(moves.clickPositions(inv(denominator), { path: [], firstPart: 0, lastPart: 0 }), [0]);
assert.deepEqual(moves.clickPositions(inv(denominator), { path: [0, 0], firstPart: 0, lastPart: 0 }), [1]);
for (const version of [1, 2]) assert.equal(moves.decode(moves.encode(events, true, version)).version, version);
console.log('Selection click order, separator targets and both recording versions passed.');
