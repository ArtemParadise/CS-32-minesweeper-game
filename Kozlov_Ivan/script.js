// Константи станів
const CellState = {
  CLOSED: "closed",
  OPENED: "opened",
  FLAGGED: "flagged",
};

const GameStatus = {
  IN_PROGRESS: "in_progress",
  WON: "won",
  LOST: "lost",
};

// Модель клітинки для поля
function createCell(hasMine = false) {
  return {
    hasMine,
    adjacentMines: 0,
    state: CellState.CLOSED,
    isFlagged: false, // дублюючий прапорець для ясності в консолі
  };
}

// Глобальний стан гри для консольних функцій
const Game = {
  field: [],       // двовимірний масив клітинок
  rows: 0,
  cols: 0,
  mines: 0,
  status: GameStatus.IN_PROGRESS,
  flagsLeft: 0,
  seconds: 0,
  timerId: null,
  started: false,
};

// 1) Генерація ігрового поля
function generateField(rows, cols, mines) {
  if (mines >= rows * cols) {
    throw new Error("Кількість мін має бути меншою за кількість клітинок");
  }
  Game.rows = rows;
  Game.cols = cols;
  Game.mines = mines;
  Game.flagsLeft = mines;
  Game.status = GameStatus.IN_PROGRESS;
  Game.seconds = 0;
  Game.started = false;
  if (Game.timerId) {
    clearInterval(Game.timerId);
    Game.timerId = null;
  }

  const field = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => createCell(false)),
  );

  // Розставляємо міни випадково
  const positions = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) positions.push([r, c]);
  }
  // перемішування Фішера-Йейтса
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  for (let k = 0; k < mines; k++) {
    const [r, c] = positions[k];
    field[r][c].hasMine = true;
  }

  // Заповнюємо adjacentMines
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      field[r][c].adjacentMines = countNeighbourMines(field, r, c);
    }
  }

  Game.field = field;

  console.log("Згенероване поле (M=міна, цифра=сусідні міни):");
  printFieldToConsole(Game.field, { revealAll: true });

  // Рендер (необов’язковий для завдання, але хай буде)
  renderBoard();
  updateHud();

  return field;
}

// 2) Підрахунок кількості мін навколо клітинки
function countNeighbourMines(field, row, col) {
  const rows = field.length;
  const cols = field[0].length;
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr, c = col + dc;
      if (r >= 0 && c >= 0 && r < rows && c < cols && field[r][c].hasMine) count++;
    }
  }
  return count;
}

// 3) Відкриття клітинки
function openCell(row, col) {
  if (!inBounds(row, col)) return;
  if (Game.status !== GameStatus.IN_PROGRESS) return;

  if (!Game.started) startTimer();

  const cell = Game.field[row][col];
  if (cell.state === CellState.OPENED || cell.isFlagged) return;

  cell.state = CellState.OPENED;

  if (cell.hasMine) {
    Game.status = GameStatus.LOST;
    stopTimer();
    console.log("Стан: ПРОГРАШ. Відкрито міну на:", row, col);
    printFieldToConsole(Game.field, { revealAll: true, highlight: [row, col] });
    renderBoard(true, [row, col]);
    updateHud();
    return;
  }

  if (cell.adjacentMines === 0) {
    floodOpen(row, col);
  }

  console.log(`Відкрито (${row}, ${col}). Поточний стан: ${Game.status}`);
  printFieldToConsole(Game.field);
  checkWin();
  renderBoard();
  updateHud();
}

function floodOpen(row, col) {
  const stack = [[row, col]];
  const seen = new Set();

  const key = (r, c) => `${r},${c}`;

  while (stack.length) {
    const [r, c] = stack.pop();
    if (!inBounds(r, c)) continue;
    if (seen.has(key(r, c))) continue;
    seen.add(key(r, c));

    const cell = Game.field[r][c];
    if (cell.isFlagged) continue;
    if (cell.state !== CellState.OPENED) cell.state = CellState.OPENED;

    if (cell.adjacentMines === 0 && !cell.hasMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          stack.push([r + dr, c + dc]);
        }
      }
    }
  }
}

// 4) Встановлення/зняття прапорця
function toggleFlag(row, col) {
  if (!inBounds(row, col)) return;
  if (Game.status !== GameStatus.IN_PROGRESS) return;

  if (!Game.started) startTimer();

  const cell = Game.field[row][col];
  if (cell.state === CellState.OPENED) return;

  cell.isFlagged = !cell.isFlagged;
  cell.state = cell.isFlagged ? CellState.FLAGGED : CellState.CLOSED;
  Game.flagsLeft += cell.isFlagged ? -1 : 1;

  console.log(`Прапорець (${row}, ${col}) -> ${cell.isFlagged}`);
  printFieldToConsole(Game.field);
  renderBoard();
  updateHud();
}

// 5) Таймер
function startTimer() {
  if (Game.started) return;
  Game.started = true;
  Game.timerId = setInterval(() => {
    Game.seconds = Math.min(999, Game.seconds + 1);
    console.log("Секунди:", Game.seconds);
    updateHud();
  }, 1000);
}

function stopTimer() {
  if (Game.timerId) clearInterval(Game.timerId);
  Game.timerId = null;
}

// Перевірка меж
function inBounds(r, c) {
  return r >= 0 && c >= 0 && r < Game.rows && c < Game.cols;
}

// Перевірка перемоги
function checkWin() {
  for (let r = 0; r < Game.rows; r++) {
    for (let c = 0; c < Game.cols; c++) {
      const cell = Game.field[r][c];
      if (!cell.hasMine && cell.state !== CellState.OPENED) {
        return false;
      }
    }
  }
  Game.status = GameStatus.WON;
  stopTimer();
  console.log("Стан: ПЕРЕМОГА!");
  updateHud();
  return true;
}

// Допоміжний вивід поля у консоль
function printFieldToConsole(field, options = {}) {
  const { revealAll = false, highlight = null } = options;
  const rows = field.length;
  const cols = field[0].length;
  const lines = [];
  for (let r = 0; r < rows; r++) {
    let line = "";
    for (let c = 0; c < cols; c++) {
      const cell = field[r][c];
      let ch = "";
      if (revealAll || cell.state === CellState.OPENED) {
        if (cell.hasMine) ch = "M";
        else ch = cell.adjacentMines === 0 ? "." : String(cell.adjacentMines);
      } else if (cell.isFlagged) {
        ch = "F";
      } else {
        ch = "#";
      }
      if (highlight && highlight[0] === r && highlight[1] === c) {
        ch = `[${ch}]`;
      }
      line += ch.padStart(3, " ");
    }
    lines.push(line);
  }
  console.log(lines.join("\n"));
}

// Мінімальний DOM-рендер (для візуальної перевірки)
function renderBoard(revealAll = false, highlight = null) {
  const boardEl = document.getElementById("board");
  boardEl.style.gridTemplateColumns = `repeat(${Game.cols}, 24px)`;
  boardEl.innerHTML = "";

  for (let r = 0; r < Game.rows; r++) {
    for (let c = 0; c < Game.cols; c++) {
      const cell = Game.field[r][c];
      const div = document.createElement("div");
      div.className = "cell";
      div.dataset.r = String(r);
      div.dataset.c = String(c);

      let opened = cell.state === CellState.OPENED || (revealAll && cell.hasMine);
      if (opened) {
        div.classList.add("opened");
        if (cell.hasMine) {
          div.classList.add("mine", highlight && highlight[0] === r && highlight[1] === c ? "mine-triggered" : "revealed");
        } else if (cell.adjacentMines > 0) {
          div.textContent = String(cell.adjacentMines);
          div.classList.add(`num${cell.adjacentMines}`);
        }
      } else {
        div.classList.add("closed");
        if (cell.isFlagged) div.classList.add("flagged");
      }

      // Події миші для швидкої перевірки
      div.addEventListener("click", () => openCell(r, c));
      div.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        toggleFlag(r, c);
      });

      boardEl.appendChild(div);
    }
  }
}

function updateHud() {
  const minesCounter = document.getElementById("minesCounter");
  const timer = document.getElementById("timer");
  minesCounter.textContent = String(Math.max(0, Math.min(999, Game.flagsLeft))).padStart(3, "0");
  timer.textContent = String(Math.max(0, Math.min(999, Game.seconds))).padStart(3, "0");
}

// Ініціалізація для ручних тестів з консолі
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("restartBtn").addEventListener("click", () => {
    generateField(9, 9, 10);
  });

  // Авто-генерація на старті
  generateField(9, 9, 10);

  // Підказка по консольним викликам
  console.log("Готово. Приклади викликів у консолі:");
  console.log(`generateField(9, 9, 10)`);
  console.log(`countNeighbourMines(Game.field, 0, 0)`);
  console.log(`openCell(0, 0)`);
  console.log(`toggleFlag(0, 1)`);
  console.log(`startTimer(); stopTimer();`);
});
