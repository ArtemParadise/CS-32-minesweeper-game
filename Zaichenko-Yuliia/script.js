// ===== КОНСТАНТЫ
const CellState = { CLOSED: "closed", OPEN: "open", FLAG: "flag", MINE: "mine", EXPLODED: "exploded" };
const GameStatus = { READY: "ready", RUNNING: "running", WIN: "win", LOSE: "lose" };
const DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

// ===== ГЛОБАЛЬНЫЙ СТЕЙТ
let game = null; // Глобальный объект игры
let firstClick = false;

// ===== ТАЙМЕР
let timerId = null, seconds = 0;
const elTimer = document.getElementById("timer");
const elFlags = document.getElementById("flags-left");

function resetTimer() {
  clearInterval(timerId);
  timerId = null;
  seconds = 0;
  elTimer.textContent = "⏱️ 000";
}

function startTimer() {
  if (timerId) return;
  timerId = setInterval(() => {
    seconds++;
    elTimer.textContent = `⏱️ ${String(seconds).padStart(3, "0")}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

// ===== DOM
const gridEl = document.querySelector(".grid");
document.addEventListener("contextmenu", e => e.preventDefault()); // Блок контекстного меню ПКМ

// ===== УТИЛИТЫ
const makeCell = () => ({ hasMine: false, neighborMines: 0, state: CellState.CLOSED });

function inBounds(game, row, col) {
  return row >= 0 && row < game.rows && col >= 0 && col < game.cols;
}

function neighbors(game, row, col) {
  const neighborCoordinates = [];
  for (const [deltaRow, deltaCol] of DIRS) {
    const newRow = row + deltaRow, newCol = col + deltaCol;
    if (inBounds(game, newRow, newCol)) neighborCoordinates.push([newRow, newCol]);
  }
  return neighborCoordinates;
}

// ===== СОЗДАНИЕ ИГРЫ
function makeGameState(rows, cols, mines) {
  return {
    rows,
    cols,
    mines,
    status: GameStatus.READY,
    flagsLeft: mines,
    openedSafe: 0,
    board: Array.from({ length: rows }, () => Array.from({ length: cols }, makeCell)),
  };
}

// ===== РАССТАНОВКА МИН
function placeMines(game, excludeRow, excludeCol) {
  const total = game.rows * game.cols;
  if (game.mines >= total) throw new Error("Занадто багато мін");

  const used = new Set();
  while (used.size < game.mines) {
    const randomIndex = Math.floor(Math.random() * total);
    const row = Math.floor(randomIndex / game.cols);
    const col = randomIndex % game.cols;
    // Избегаем первой кликнутой клетки и её соседей
    if ((row === excludeRow && col === excludeCol) || neighbors(game, excludeRow, excludeCol).some(([r, c]) => r === row && c === col)) continue;
    if (used.has(randomIndex)) continue;
    used.add(randomIndex);
    game.board[row][col].hasMine = true;
  }

  // Подсчёт соседних мин
  for (let row = 0; row < game.rows; row++) {
    for (let col = 0; col < game.cols; col++) {
      if (game.board[row][col].hasMine) continue;
      let count = 0;
      for (const [newRow, newCol] of neighbors(game, row, col)) {
        if (game.board[newRow][newCol].hasMine) count++;
      }
      game.board[row][col].neighborMines = count;
    }
  }
}

// ===== РЕНДЕР
function render() {
  gridEl.innerHTML = "";
  gridEl.style.gridTemplateColumns = `repeat(${game.cols}, var(--cell-size))`;

  for (let r = 0; r < game.rows; r++) {
    for (let c = 0; c < game.cols; c++) {
      const cell = game.board[r][c];
      const btn = document.createElement("button");
      btn.className = "cell";

      // Классы состояния
      btn.classList.toggle("open", cell.state === CellState.OPEN);
      btn.classList.toggle("flag", cell.state === CellState.FLAG);
      btn.classList.toggle("mine", cell.state === CellState.MINE);
      btn.classList.toggle("exploded", cell.state === CellState.EXPLODED);

      // Текст
      btn.textContent = "";
      if (cell.state === CellState.OPEN && cell.neighborMines > 0) {
        btn.textContent = String(cell.neighborMines);
        btn.classList.add(`n${cell.neighborMines}`);
      }
      if (cell.state === CellState.FLAG) btn.textContent = "🚩";
      if (cell.state === CellState.MINE) btn.textContent = "💣";
      if (cell.state === CellState.EXPLODED) btn.textContent = "💥";


      // Обработчики
      btn.addEventListener("click", () => onLeft(r, c));
      btn.addEventListener("mousedown", (e) => { if (e.button === 2) onRight(r, c); });

      // ДОБАВЛЯЕМ В DOM (это было упущено!)
      gridEl.appendChild(btn);
    }
  }

  // Обновляем флаги
  elFlags.textContent = `🚩 ${String(game.flagsLeft).padStart(3, "0")}`;
}

// ===== ОБРАБОТЧИКИ
function onLeft(row, col) {
  if (game.status === GameStatus.LOSE || game.status === GameStatus.WIN) return;
  openCell(game, row, col);
  render();
  checkGameEnd();
}

function onRight(row, col) {
  if (game.status === GameStatus.LOSE || game.status === GameStatus.WIN) return;
  toggleFlag(game, row, col);
  render();
}

// ===== ЛОГИКА ИГРЫ
function toggleFlag(game, row, col) {
  const cell = game.board[row][col];
  if (cell.state === CellState.OPEN) return;
  if (cell.state === CellState.FLAG) {
    cell.state = CellState.CLOSED;
    game.flagsLeft++;
  } else if (game.flagsLeft > 0) {
    cell.state = CellState.FLAG;
    game.flagsLeft--;
  }
}

function openCell(game, row, col) {
  const cell = game.board[row][col];
  if (cell.state !== CellState.CLOSED) return;
  cell.state = CellState.OPEN;

  if (!firstClick) {
    placeMines(game, row, col); // Расставляем мины после первого клика
    firstClick = true;
    game.status = GameStatus.RUNNING;
    startTimer();
  }

  if (cell.hasMine) {
    cell.state = CellState.EXPLODED;
    revealMines(game);
    game.status = GameStatus.LOSE;
    stopTimer();
    return;
  }

  game.openedSafe++;
  if (cell.neighborMines === 0) {
    for (const [newRow, newCol] of neighbors(game, row, col)) {
      if (game.board[newRow][newCol].state === CellState.CLOSED && !game.board[newRow][newCol].hasMine) {
        openCell(game, newRow, newCol);
      }
    }
  }
}

function revealMines(game) {
  for (let r = 0; r < game.rows; r++) {
    for (let c = 0; c < game.cols; c++) {
      const cell = game.board[r][c];
      if (cell.hasMine && cell.state !== CellState.EXPLODED) {
        cell.state = CellState.MINE;
      }
    }
  }
}

function checkGameEnd() {
  if (game.status === GameStatus.LOSE) return;
  const totalSafe = game.rows * game.cols - game.mines;
  if (game.openedSafe === totalSafe) {
    game.status = GameStatus.WIN;
    stopTimer();
    alert("Ви перемогли!");
  }
}

// ===== НОВАЯ ИГРА
function newGame(r = 10, c = 10, m = 10) {
  game = makeGameState(r, c, m);
  resetTimer();
  firstClick = false;
  render();
}

document.getElementById("new-game-btn").addEventListener("click", () => newGame(10, 10, 10));

// СТАРТ
newGame(10, 10, 10);
