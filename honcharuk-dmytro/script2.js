// Константы состояния
const CellState = {
  CLOSED: "closed",
  OPEN: "open",
  FLAG: "flag",
  MINE: "mine",
};
const GameStatus = { RUNNING: "running", WIN: "win", LOSE: "lose" };

// Глобальное состояние игры
let currentField = [];
let gameStatus = GameStatus.RUNNING;

// Создание клетки
function makeCell(hasMine = false) {
  return {
    hasMine,
    neighborMines: 0,
    state: CellState.CLOSED,
  };
}

// Расстановка мин
function placeMines({ field, mines, rows, cols }) {
  let placedMines = 0;
  while (placedMines < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!field[r][c].hasMine) {
      field[r][c].hasMine = true;
      placedMines++;
    }
  }
}

// Генерация поля
function generateField(rows, cols, mines) {
  const field = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => makeCell(false))
  );
  placeMines({ field, mines, rows, cols });
  const directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let count = 0;
      for (const [dr, dc] of directions) {
        const nr = r + dr,
          nc = c + dc;
        if (
          nr >= 0 &&
          nc >= 0 &&
          nr < rows &&
          nc < cols &&
          field[nr][nc].hasMine
        ) {
          count++;
        }
      }
      field[r][c].neighborMines = count;
    }
  }
  return field;
}

// Рендер поля
function updateBoard(field) {
  const grid = document.querySelector(".grid");
  grid.innerHTML = "";
  const rows = field.length;
  const cols = field[0].length;
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = `repeat(${cols}, 32px)`;
  grid.style.gridAutoRows = `32px`;
  grid.style.gap = "4px";

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = field[r][c];
      const btn = document.createElement("button");
      btn.classList.add("cell");
      btn.dataset.state = cell.state;
      btn.dataset.count = cell.neighborMines;
      if (cell.state === CellState.OPEN) {
        btn.textContent =
          cell.neighborMines === 0 ? "" : String(cell.neighborMines);
      } else if (cell.state === CellState.FLAG) {
        btn.textContent = "🚩";
      } else if (
        cell.state === CellState.MINE ||
        (gameStatus === GameStatus.LOSE && cell.hasMine)
      ) {
        btn.textContent = "💣";
      } else {
        btn.textContent = "";
      }
      btn.addEventListener("click", () => openCell(field, r, c));
      btn.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        toggleFlag(field, r, c);
      });

      grid.appendChild(btn);
    }
  }
}

// Открыть клетку
function openCell(field, row, col) {
  if (gameStatus !== GameStatus.RUNNING) return;
  const cell = field[row][col];
  if (cell.state === CellState.OPEN || cell.state === CellState.FLAG) return;
  if (cell.hasMine) {
    cell.state = CellState.MINE;
    revealAllMines(field);
    gameStatus = GameStatus.LOSE;
    stopTimer();
    updateBoard(field);
    console.log("Проигрыш! 💥");
    return;
  }
  cell.state = CellState.OPEN;
  if (cell.neighborMines === 0) {
    const directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];
    for (const [dr, dc] of directions) {
      const nr = row + dr,
        nc = col + dc;
      if (
        nr >= 0 &&
        nc >= 0 &&
        nr < field.length &&
        nc < field[0].length &&
        field[nr][nc].state !== CellState.OPEN
      ) {
        openCell(field, nr, nc);
      }
    }
  }

  updateBoard(field);
  checkWin(field);
}
// Поставить/снять флаг
function toggleFlag(field, row, col) {
  if (gameStatus !== GameStatus.RUNNING) return;
  const cell = field[row][col];
  if (cell.state === CellState.OPEN) return;
  cell.state =
    cell.state === CellState.FLAG ? CellState.CLOSED : CellState.FLAG;
  updateBoard(field);
}
// Показать все мины
function revealAllMines(field) {
  for (const row of field) {
    for (const cell of row) {
      if (cell.hasMine && cell.state !== CellState.MINE) {
        cell.state = CellState.MINE;
      }
    }
  }
}
// Проверка победы
function checkWin(field) {
  for (const row of field) {
    for (const cell of row) {
      if (!cell.hasMine && cell.state !== CellState.OPEN) return;
    }
  }
  gameStatus = GameStatus.WIN;
  stopTimer();
  console.log("Победа! 🏆");
}

// Таймер
let timer;
let seconds = 0;
function startTimer() {
  clearInterval(timer);
  timer = setInterval(() => {
    seconds++;
    document.getElementById("timer").textContent = seconds
      .toString()
      .padStart(3, "0");
  }, 1000);
}
function stopTimer() {
  clearInterval(timer);
}

// Новая игра
function newGame(rows = 8, cols = 8, mines = 10) {
  currentField = generateField(rows, cols, mines);
  gameStatus = GameStatus.RUNNING;
  seconds = 0;
  document.getElementById("timer").textContent = "000";
  updateBoard(currentField);
  startTimer();
}

const newGameBtn = document.getElementById("new-game-btn");
newGameBtn.onclick = () => newGame(8, 8, 10);
newGame(8, 8, 10);
