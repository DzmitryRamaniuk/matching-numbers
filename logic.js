(function (root) {
  'use strict';

  // Board is a flat array read left to right, WIDTH cells per row.
  // A removed cell is null.
  const WIDTH = 9;
  const START_ROWS = 4;
  const ADD_ROW_LIMIT = 5;
  const TARGET_SUM = 10;

  const randomDigit = (rng) => Math.floor(rng() * 9) + 1;

  function createBoard(rng = Math.random) {
    return Array.from({ length: START_ROWS * WIDTH }, () => randomDigit(rng));
  }

  function addRow(cells, rng = Math.random) {
    return [...cells, ...Array.from({ length: WIDTH }, () => randomDigit(rng))];
  }

  // Two numbers match when they are equal or add up to 10.
  function isMatch(a, b) {
    return a !== null && b !== null && (a === b || a + b === TARGET_SUM);
  }

  // Two cells are connected when every cell between them is removed and they lie
  // on one line: the same row (reading order, wrapping to the next row), the same
  // column, or a diagonal that stays inside the board.
  function areConnected(cells, width, from, to) {
    const a = Math.min(from, to);
    const b = Math.max(from, to);
    if (a === b) return false;

    const col = a % width;
    const diff = b - a;
    const steps = [1, width, width - 1, width + 1];

    return steps.some((step) => {
      if (diff % step !== 0) return false;
      const k = diff / step;
      if (step === width - 1 && col - k < 0) return false;
      if (step === width + 1 && col + k >= width) return false;
      for (let m = 1; m < k; m++) {
        if (cells[a + m * step] !== null) return false;
      }
      return true;
    });
  }

  function findMatchingPair(cells, width = WIDTH) {
    for (let a = 0; a < cells.length; a++) {
      if (cells[a] === null) continue;
      for (let b = a + 1; b < cells.length; b++) {
        if (isMatch(cells[a], cells[b]) && areConnected(cells, width, a, b)) {
          return [a, b];
        }
      }
    }
    return null;
  }

  function removePair(cells, a, b) {
    const next = [...cells];
    next[a] = null;
    next[b] = null;
    return next;
  }

  function isCleared(cells) {
    return cells.every((cell) => cell === null);
  }

  const api = {
    WIDTH,
    START_ROWS,
    ADD_ROW_LIMIT,
    createBoard,
    addRow,
    isMatch,
    areConnected,
    findMatchingPair,
    removePair,
    isCleared,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.MatchingLogic = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
