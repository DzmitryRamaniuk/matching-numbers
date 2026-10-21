(function (root) {
  'use strict';

  // Board is a flat array read left to right, `columns` cells per row.
  // A removed or unused cell is null.
  const TARGET_SUM = 10;
  const ADD_ROW_LIMIT = 5;

  const LEVELS = { low: 30, medium: 42, hard: 54 };
  const DEFAULT_SETTINGS = { numbers: LEVELS.medium, columns: 9 };
  const LIMITS = { numbersMin: 10, numbersMax: 150, columnsMin: 3, columnsMax: 12 };

  const randomDigit = (rng) => Math.floor(rng() * 9) + 1;

  function rowsFor(numbers, columns) {
    return Math.ceil(numbers / columns);
  }

  // Returns an error message, or null when the settings are usable.
  function validateSettings({ numbers, columns }) {
    if (!Number.isInteger(numbers) || numbers < LIMITS.numbersMin || numbers > LIMITS.numbersMax) {
      return `Numbers must be between ${LIMITS.numbersMin} and ${LIMITS.numbersMax}.`;
    }
    if (numbers % 2 !== 0) {
      return 'Numbers must be even so every number can be paired.';
    }
    if (!Number.isInteger(columns) || columns < LIMITS.columnsMin || columns > LIMITS.columnsMax) {
      return `Columns must be between ${LIMITS.columnsMin} and ${LIMITS.columnsMax}.`;
    }
    return null;
  }

  // Fills the first `numbers` cells with digits; the rest of the last row stays empty.
  function createBoard(numbers, columns, rng = Math.random) {
    const length = rowsFor(numbers, columns) * columns;
    return Array.from({ length }, (_, i) => (i < numbers ? randomDigit(rng) : null));
  }

  // Copies every number still on the board under the current board, in order,
  // as full rows. Empty cells already on the board are left alone.
  function addMore(cells, columns) {
    const existing = cells.filter((cell) => cell !== null);
    if (existing.length === 0) return cells;
    const padding = (columns - (existing.length % columns)) % columns;
    return [...cells, ...existing, ...Array(padding).fill(null)];
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

  function findMatchingPair(cells, width) {
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
    LEVELS,
    DEFAULT_SETTINGS,
    LIMITS,
    ADD_ROW_LIMIT,
    rowsFor,
    validateSettings,
    createBoard,
    addMore,
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
