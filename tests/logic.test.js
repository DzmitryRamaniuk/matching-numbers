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

test('default settings are medium: 42 numbers in 9 columns, 5 rows', () => {
  assert.equal(L.DEFAULT_SETTINGS.numbers, 42);
  assert.equal(L.DEFAULT_SETTINGS.columns, 9);
  assert.equal(L.rowsFor(42, 9), 5);
});

test('rowsFor recalculates from numbers and columns', () => {
  assert.equal(L.rowsFor(30, 9), 4);
  assert.equal(L.rowsFor(54, 9), 6);
  assert.equal(L.rowsFor(42, 6), 7);
  assert.equal(L.rowsFor(40, 10), 4);
});

test('validateSettings accepts usable values and rejects others', () => {
  assert.equal(L.validateSettings({ numbers: 42, columns: 9 }), null);
  assert.notEqual(L.validateSettings({ numbers: 9, columns: 9 }), null);
  assert.notEqual(L.validateSettings({ numbers: 151, columns: 9 }), null);
  assert.notEqual(L.validateSettings({ numbers: 41, columns: 9 }), null);
  assert.notEqual(L.validateSettings({ numbers: 42, columns: 2 }), null);
  assert.notEqual(L.validateSettings({ numbers: 42, columns: 13 }), null);
  assert.notEqual(L.validateSettings({ numbers: NaN, columns: 9 }), null);
});

test('createBoard places exactly the requested count of digits 1-9', () => {
  const cells = L.createBoard(42, 9, () => 0.5);
  assert.equal(cells.length, 45); // 5 rows of 9
  assert.equal(cells.filter((c) => c !== null).length, 42);
  assert.ok(cells.slice(0, 42).every((c) => Number.isInteger(c) && c >= 1 && c <= 9));
  assert.ok(cells.slice(42).every((c) => c === null));
});

const noSpent = (cells) => cells.map(() => null);

test('addMore appends copies of the numbers left and keeps gaps as they are', () => {
  const cells = [1, 3, null, null, 1, 3];
  assert.deepEqual(
    L.addMore(cells, noSpent(cells)).cells,
    [1, 3, null, null, 1, 3, 1, 3, 1, 3]
  );
});

test('addMore appends the same numbers in the same order with no padding', () => {
  const cells = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const next = L.addMore(cells, noSpent(cells));
  assert.deepEqual(next.cells, [1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(next.spent, noSpent(next.cells));
});

test('addMore fills the empty cells at the end of the last row first, then new rows', () => {
  const cells = [1, 2, 3, 4, 5, 6, 7, null, null];
  const next = L.addMore(cells, noSpent(cells));
  assert.deepEqual(next.cells, [1, 2, 3, 4, 5, 6, 7, 1, 2, 3, 4, 5, 6, 7]);
});

test('addMore does not write over a removed number at the end of the board', () => {
  const cells = [1, null];
  const spent = [null, 2];
  const next = L.addMore(cells, spent);
  assert.deepEqual(next.cells, [1, null, 1]);
  assert.deepEqual(next.spent, [null, 2, null]);
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

test('dropSpentRows removes a row whose numbers are all removed and moves rows below up', () => {
  // row 0: 1 and 2 removed (no live numbers) -> dropped; row 1: live 4, 6 kept
  const cells = [null, null, null, 4, 6, null];
  const spent = [1, 2, null, null, null, 5];
  const next = L.dropSpentRows(cells, spent, 3);
  assert.deepEqual(next.cells, [4, 6, null]);
  assert.deepEqual(next.spent, [null, null, 5]);
});

test('dropSpentRows keeps rows with a live number or with nothing removed', () => {
  const cells = [1, null, null, null, null, null];
  const spent = [null, null, null, null, null, null];
  const next = L.dropSpentRows(cells, spent, 3);
  assert.deepEqual(next.cells, cells);
  assert.deepEqual(next.spent, spent);
});
