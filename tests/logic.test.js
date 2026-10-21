const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../logic.js');

const W = 9;
const board = (...rows) => rows.flat();
const pad = (cells) => [...cells, ...Array(W - (cells.length % W || W)).fill(null)];

test('equal numbers match', () => {
  assert.equal(L.isMatch(4, 4), true);
});

test('numbers adding to 10 match', () => {
  assert.equal(L.isMatch(3, 7), true);
  assert.equal(L.isMatch(1, 9), true);
});

test('other numbers and removed cells do not match', () => {
  assert.equal(L.isMatch(2, 3), false);
  assert.equal(L.isMatch(5, null), false);
  assert.equal(L.isMatch(null, null), false);
});

test('adjacent cells in a row are connected', () => {
  const cells = pad([1, 2]);
  assert.equal(L.areConnected(cells, W, 0, 1), true);
});

test('cells in a row are connected when only removed cells lie between them', () => {
  const cells = pad([1, null, null, 2]);
  assert.equal(L.areConnected(cells, W, 0, 3), true);
});

test('a live cell between two cells blocks the connection', () => {
  const cells = pad([1, 5, 2]);
  assert.equal(L.areConnected(cells, W, 0, 2), false);
});

test('cells connect across a row wrap when the gap is empty', () => {
  // index 8 is the last cell of row 0, index 9 the first of row 1
  const cells = pad([...Array(8).fill(null), 3, 7]);
  assert.equal(L.areConnected(cells, W, 8, 9), true);
});

test('vertical neighbours connect, and a cell in the column blocks them', () => {
  // index 0 (row 0, col 0) and index 18 (row 2, col 0)
  const open = pad([3, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 7]);
  assert.equal(L.areConnected(open, W, 0, 18), true);

  const blocked = [...open];
  blocked[9] = 5; // a live cell in the middle of the column
  assert.equal(L.areConnected(blocked, W, 0, 18), false);
});

test('diagonal neighbours connect', () => {
  // index 0 (row 0, col 0) and index 10 (row 1, col 1)
  const cells = pad([3, ...Array(8).fill(null), null, 7]);
  assert.equal(L.areConnected(cells, W, 0, 10), true);
});

test('diagonal does not wrap around the board edge', () => {
  // index 8 (row 0, col 8) and index 18 (row 2, col 0) would need a wrap.
  // Cell 12 is live, so the reading-order path is blocked too.
  const cells = pad([...Array(8).fill(null), 3, null, null, null, 5, null, null, null, null, 7]);
  assert.equal(L.areConnected(cells, W, 8, 18), false);
});

test('findMatchingPair returns a connected matching pair', () => {
  const cells = pad([1, 2, 3, 7]);
  assert.deepEqual(L.findMatchingPair(cells, W), [2, 3]);
});

test('findMatchingPair returns null when no pair can be reached', () => {
  const cells = pad([3, 5, 7]);
  assert.equal(L.findMatchingPair(cells, W), null);
});

test('removePair clears both cells without changing the input', () => {
  const cells = pad([1, 2, 3]);
  const next = L.removePair(cells, 0, 2);
  assert.equal(next[0], null);
  assert.equal(next[2], null);
  assert.equal(next[1], 2);
  assert.equal(cells[0], 1);
});

test('isCleared is true only when every cell is removed', () => {
  assert.equal(L.isCleared([null, null]), true);
  assert.equal(L.isCleared([null, 1]), false);
});

test('createBoard makes a full starting board of digits 1-9', () => {
  const cells = L.createBoard(() => 0.5);
  assert.equal(cells.length, L.START_ROWS * W);
  assert.ok(cells.every((c) => Number.isInteger(c) && c >= 1 && c <= 9));
});

test('addRow appends one row of digits', () => {
  const cells = L.addRow(board([1, 2, 3, 4, 5, 6, 7, 8, 9]), () => 0.0);
  assert.equal(cells.length, 18);
  assert.equal(cells[9], 1);
});

test('a generated board can be solved greedily to a cleared state', () => {
  // Sanity check on a board that is clearly solvable by pairing neighbours.
  let cells = pad([1, 9, 2, 8, 5, 5]);
  for (let guard = 0; guard < 50; guard++) {
    const pair = L.findMatchingPair(cells, W);
    if (!pair) break;
    cells = L.removePair(cells, pair[0], pair[1]);
  }
  assert.equal(L.isCleared(cells), true);
});
