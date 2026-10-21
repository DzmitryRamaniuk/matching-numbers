(function () {
  'use strict';

  const {
    WIDTH,
    ADD_ROW_LIMIT,
    createBoard,
    addRow,
    isMatch,
    areConnected,
    findMatchingPair,
    removePair,
    isCleared,
  } = window.MatchingLogic;

  const BEST_KEY = 'matching-numbers-best';

  const boardEl = document.getElementById('board');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const statusEl = document.getElementById('status');
  const addRowBtn = document.getElementById('add-row');
  const rowsLeftEl = document.getElementById('rows-left');
  const newGameBtn = document.getElementById('new-game');
  const helpBtn = document.getElementById('help');
  const helpDialog = document.getElementById('help-dialog');
  const helpCloseBtn = document.getElementById('help-close');

  let state;

  function readBest() {
    try {
      return Number(localStorage.getItem(BEST_KEY)) || 0;
    } catch (e) {
      return 0;
    }
  }

  function writeBest(value) {
    try {
      localStorage.setItem(BEST_KEY, String(value));
    } catch (e) {
      // Storage can be blocked; the best score just won't persist.
    }
  }

  function newGame() {
    state = {
      cells: createBoard(),
      selected: null,
      score: 0,
      rowsLeft: ADD_ROW_LIMIT,
    };
    render();
  }

  function isOver() {
    return isCleared(state.cells) ||
      (state.rowsLeft === 0 && findMatchingPair(state.cells) === null);
  }

  function onCellTap(index) {
    if (isOver() || state.cells[index] === null) return;

    const { cells, selected } = state;
    if (selected === null) {
      state.selected = index;
    } else if (selected === index) {
      state.selected = null;
    } else if (isMatch(cells[selected], cells[index]) && areConnected(cells, WIDTH, selected, index)) {
      state.cells = removePair(cells, selected, index);
      state.selected = null;
      state.score += 1;
      if (state.score > readBest()) writeBest(state.score);
    } else {
      state.selected = index;
    }
    render();
  }

  function onAddRow() {
    if (isOver() || state.rowsLeft === 0) return;
    state.cells = addRow(state.cells);
    state.rowsLeft -= 1;
    state.selected = null;
    render();
  }

  function statusText() {
    if (isCleared(state.cells)) return 'Board cleared! You win.';
    if (isOver()) return 'No moves left. Game over.';
    if (findMatchingPair(state.cells) === null) return 'No pairs left. Add a row.';
    return 'Tap two numbers that match or add to 10.';
  }

  function render() {
    const { cells, selected } = state;

    boardEl.innerHTML = cells.map((value, i) => {
      if (value === null) return '<div class="cell empty" aria-hidden="true"></div>';
      const classes = i === selected ? 'cell selected' : 'cell';
      return `<button class="${classes}" data-index="${i}" aria-label="${value}">${value}</button>`;
    }).join('');

    scoreEl.textContent = state.score;
    bestEl.textContent = readBest();
    rowsLeftEl.textContent = state.rowsLeft;
    statusEl.textContent = statusText();
    addRowBtn.disabled = isOver() || state.rowsLeft === 0;
  }

  boardEl.addEventListener('click', (event) => {
    const cell = event.target.closest('.cell:not(.empty)');
    if (cell) onCellTap(Number(cell.dataset.index));
  });
  addRowBtn.addEventListener('click', onAddRow);
  newGameBtn.addEventListener('click', newGame);
  helpBtn.addEventListener('click', () => helpDialog.showModal());
  helpCloseBtn.addEventListener('click', () => helpDialog.close());

  newGame();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {
      // Offline caching is optional; the game works without it.
    });
  }
})();
