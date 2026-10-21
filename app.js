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
    dropSpentRows,
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

  const gameOverDialog = document.getElementById('game-over-dialog');
  const finalScoreEl = document.getElementById('final-score');
  const gameOverNewBtn = document.getElementById('game-over-new');

  // Settings used for the current game; the dialog edits copies of these.
  let settings = { ...DEFAULT_SETTINGS };
  let state;

  // Hint is a [from, to] pair of cell indexes, or null when nothing is highlighted.
  // Spent holds the number that was removed from each cell (null if none), so the
  // board can show it greyed out after the pair is gone.
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

  // Starts a fresh board with the current settings, keeping the given score.
  function newBoard(score) {
    const cells = createBoard(settings.numbers, settings.columns);
    state = {
      cells,
      spent: cells.map(() => null),
      columns: settings.columns,
      selected: null,
      hint: null,
      score,
      rowsLeft: ADD_ROW_LIMIT,
    };
  }

  function newGame() {
    newBoard(0);
    render();
  }

  function isOver() {
    return state.rowsLeft === 0 && findMatchingPair(state.cells, state.columns) === null;
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
      const spent = [...state.spent];
      spent[selected] = cells[selected];
      spent[index] = cells[index];
      const trimmed = dropSpentRows(removePair(cells, selected, index), spent, columns);
      state.cells = trimmed.cells;
      state.spent = trimmed.spent;
      state.selected = null;
      state.hint = null;
      state.score += 1;
      if (state.score > readBest()) writeBest(state.score);
      if (isCleared(state.cells)) newBoard(state.score);
    } else {
      state.selected = index;
    }
    render();
  }

  function onAddMore() {
    if (isOver() || state.rowsLeft === 0) return;
    const added = addMore(state.cells, state.spent);
    state.cells = added.cells;
    state.spent = added.spent;
    state.rowsLeft -= 1;
    state.selected = null;
    state.hint = null;
    render();
  }

  function statusText() {
    if (isOver()) return 'No moves left. Game over.';
    if (findMatchingPair(state.cells, state.columns) === null) return 'No pairs left. Tap Add more.';
    return 'Tap two numbers that match or add to 10.';
  }

  function render() {
    const { cells, spent, selected, hint } = state;

    boardEl.style.setProperty('--cols', state.columns);
    boardEl.innerHTML = cells.map((value, i) => {
      if (value === null && spent[i] === null) return '<div class="cell empty" aria-hidden="true"></div>';
      if (value === null) {
        return `<button class="cell removed" data-index="${i}" disabled aria-label="${spent[i]} removed">${spent[i]}</button>`;
      }
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

    if (isOver() && !gameOverDialog.open) {
      finalScoreEl.textContent = state.score;
      gameOverDialog.showModal();
    }
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

  // The game-over dialog stays open until the player starts a new game.
  gameOverDialog.addEventListener('cancel', (event) => event.preventDefault());
  gameOverNewBtn.addEventListener('click', () => {
    gameOverDialog.close();
    openNewGame();
  });

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
  openNewGame();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {
      // Offline caching is optional; the game works without it.
    });
  }
})();
