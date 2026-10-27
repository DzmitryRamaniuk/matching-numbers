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

  // Shuffles in place (Fisher-Yates) and returns the same array.
  function shuffle(values, rng) {
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    return values;
  }

  // Fills the first `numbers` cells with shuffled digits. The digits come in
  // pairs that add up to 10 (1 and 9, 3 and 7, 5 and 5, ...), so every number
  // on a new board has a partner. The rest of the last row stays empty.
  function createBoard(numbers, columns, rng = Math.random) {
    const length = rowsFor(numbers, columns) * columns;
    const values = [];
    for (let i = 0; i < numbers / 2; i++) {
      const a = randomDigit(rng);
      values.push(a, TARGET_SUM - a);
    }
    shuffle(values, rng);
    return Array.from({ length }, (_, i) => (i < numbers ? values[i] : null));
  }

  // Writes a copy of every number still on the board, in order, starting at the
  // empty cells at the end of the board (if any) and then on new rows. Empty
  // cells in the middle are left alone. `spent` is the removed value per cell, or
  // null; a removed number is not an empty cell, so it stops the end-fill.
  function addMore(cells, spent) {
    const existing = cells.filter((cell) => cell !== null);
    const nextCells = [...cells];
    const nextSpent = [...spent];

    let start = cells.length;
    while (start > 0 && cells[start - 1] === null && spent[start - 1] === null) start--;

    existing.forEach((value, k) => {
      if (start + k < nextCells.length) {
        nextCells[start + k] = value;
      } else {
        nextCells.push(value);
        nextSpent.push(null);
      }
    });
    return { cells: nextCells, spent: nextSpent };
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

  // Drops every row that holds no live numbers but at least one removed number
  // (`spent` is the removed value per cell, or null). Rows below move up.
  function dropSpentRows(cells, spent, width) {
    const nextCells = [];
    const nextSpent = [];
    for (let start = 0; start < cells.length; start += width) {
      const end = start + width;
      const live = cells.slice(start, end).some((cell) => cell !== null);
      const removed = spent.slice(start, end).some((value) => value !== null);
      if (live || !removed) {
        nextCells.push(...cells.slice(start, end));
        nextSpent.push(...spent.slice(start, end));
      }
    }
    return { cells: nextCells, spent: nextSpent };
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
    dropSpentRows,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.MatchingLogic = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
