(function () {
  'use strict';

  const {
    LEVELS,
    DEFAULT_SETTINGS,
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
  } = window.MatchingLogic;

  const BEST_KEY = 'matching-numbers-best';

  const boardEl = document.getElementById('board');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const statusEl = document.getElementById('status');
  const addMoreBtn = document.getElementById('add-more');
  const rowsLeftEl = document.getElementById('rows-left');
  const newGameBtn = document.getElementById('new-game');
  const hintBtn = document.getElementById('hint');

  const newGameDialog = document.getElementById('new-game-dialog');
  const newGameForm = document.getElementById('new-game-form');
  const levelButtons = newGameForm.querySelectorAll('[data-level]');
  const numbersInput = document.getElementById('numbers-input');
  const columnsInput = document.getElementById('columns-input');
  const rowsOutput = document.getElementById('rows-output');
  const settingsError = document.getElementById('settings-error');
  const startBtn = document.getElementById('start-game');
  const cancelBtn = document.getElementById('cancel-game');

  // Settings used for the current game; the dialog edits copies of these.
  let settings = { ...DEFAULT_SETTINGS };
  let state;

  // Hint is a [from, to] pair of cell indexes, or null when nothing is highlighted.
  function onHint() {
    if (isOver()) return;
    state.hint = findMatchingPair(state.cells, state.columns);
    render();
  }

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
      cells: createBoard(settings.numbers, settings.columns),
      columns: settings.columns,
      selected: null,
      hint: null,
      score: 0,
      rowsLeft: ADD_ROW_LIMIT,
    };
    render();
  }

  function isOver() {
    return isCleared(state.cells) ||
      (state.rowsLeft === 0 && findMatchingPair(state.cells, state.columns) === null);
  }

  function onCellTap(index) {
    if (isOver() || state.cells[index] === null) return;

    const { cells, selected, columns } = state;
    if (state.hint && !state.hint.includes(index)) state.hint = null;

    if (selected === null) {
      state.selected = index;
    } else if (selected === index) {
      state.selected = null;
    } else if (isMatch(cells[selected], cells[index]) && areConnected(cells, columns, selected, index)) {
      state.cells = removePair(cells, selected, index);
      state.selected = null;
      state.hint = null;
      state.score += 1;
      if (state.score > readBest()) writeBest(state.score);
    } else {
      state.selected = index;
    }
    render();
  }

  function onAddMore() {
    if (isOver() || state.rowsLeft === 0) return;
    state.cells = addMore(state.cells, state.columns);
    state.rowsLeft -= 1;
    state.selected = null;
    state.hint = null;
    render();
  }

  function statusText() {
    if (isCleared(state.cells)) return 'Board cleared! You win.';
    if (isOver()) return 'No moves left. Game over.';
    if (findMatchingPair(state.cells, state.columns) === null) return 'No pairs left. Tap Add more.';
    return 'Tap two numbers that match or add to 10.';
  }

  function render() {
    const { cells, selected, hint } = state;

    boardEl.style.setProperty('--cols', state.columns);
    boardEl.innerHTML = cells.map((value, i) => {
      if (value === null) return '<div class="cell empty" aria-hidden="true"></div>';
      const classes = ['cell'];
      if (i === selected) classes.push('selected');
      if (hint && hint.includes(i)) classes.push('hint');
      return `<button class="${classes.join(' ')}" data-index="${i}" aria-label="${value}">${value}</button>`;
    }).join('');

    scoreEl.textContent = state.score;
    bestEl.textContent = readBest();
    rowsLeftEl.textContent = state.rowsLeft;
    statusEl.textContent = statusText();
    addMoreBtn.disabled = isOver() || state.rowsLeft === 0;
  }

  // New game dialog. The level buttons only set the number count; the level
  // shown as selected is whichever preset matches the current count.
  function levelFor(numbers) {
    return Object.keys(LEVELS).find((key) => LEVELS[key] === numbers) || null;
  }

  function readDialog() {
    return { numbers: Number(numbersInput.value), columns: Number(columnsInput.value) };
  }

  function updateDialog() {
    const draft = readDialog();
    const level = levelFor(draft.numbers);
    const error = validateSettings(draft);

    levelButtons.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.level === level));
    });
    rowsOutput.textContent = error ? '–' : rowsFor(draft.numbers, draft.columns);
    settingsError.textContent = error || '';
    settingsError.hidden = !error;
    startBtn.disabled = Boolean(error);
  }

  function openNewGame() {
    numbersInput.value = settings.numbers;
    columnsInput.value = settings.columns;
    updateDialog();
    newGameDialog.showModal();
  }

  levelButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      numbersInput.value = LEVELS[btn.dataset.level];
      updateDialog();
    });
  });
  numbersInput.addEventListener('input', updateDialog);
  columnsInput.addEventListener('input', updateDialog);
  cancelBtn.addEventListener('click', () => newGameDialog.close());

  newGameForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const draft = readDialog();
    if (validateSettings(draft)) return;
    settings = draft;
    newGameDialog.close();
    newGame();
  });

  boardEl.addEventListener('click', (event) => {
    const cell = event.target.closest('.cell:not(.empty)');
    if (cell) onCellTap(Number(cell.dataset.index));
  });
  addMoreBtn.addEventListener('click', onAddMore);
  newGameBtn.addEventListener('click', openNewGame);
  hintBtn.addEventListener('click', onHint);

  // Any tap outside the highlighted numbers and the Hint button clears the highlight.
  document.addEventListener('click', (event) => {
    if (!state.hint) return;
    if (event.target.closest('.cell.hint, #hint')) return;
    state.hint = null;
    render();
  });

  newGame();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {
      // Offline caching is optional; the game works without it.
    });
  }
})();
