"use strict";

/* ========= Константи станів ========= */
const CellState = { CLOSED: "closed", OPEN: "open", FLAG: "flag" };
const GameStatus = { RUNNING: "running", WIN: "win", LOSE: "lose" };

/* ========= Модель клітинки ========= */
function makeCell(hasMine = false) {
  return {
    hasMine, // булеве
    neighborMines: 0, // кількість мін навколо (0..8)
    state: CellState.CLOSED, // closed | open | flag
  };
}

/* ========= Модель стану гри ========= */
function makeGameState(rows, cols, mines) {
  return {
    rows,
    cols,
    mines,
    status: GameStatus.RUNNING,
    flagsLeft: mines,
    openedSafe: 0,
    board: Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => makeCell(false))
    ),
  };
}

/* ========= Утиліти для роботи з полем ========= */
function inBounds(game, row, col) {
  return row>= 0 && row < game.rows && col >= 0 && col < game.cols;
}

const DIRECTION_OFFSETS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

function neighbors(game, row, col) {
  const neighborCoordinates = [];
  for (const [deltaRow, deltaCol] of DIRECTION_OFFSETS) {
    const newRow = row + deltaRow,
      newCol = col + deltaCol;
    if (inBounds(game, newRow, newCol)) neighborCoordinates.push([newRow, newCol]);
  }
  return neighborCoordinates;
}

/* ========= Розстановка мін і підрахунок сусідів ========= */
function placeMinesRandomly(game) {
  const total = game.rows * game.cols;
  if (game.mines >= total) throw new Error("Занадто багато мін");

  const used = new Set();
  while (used.size < game.mines) {
    const randomIndex = Math.floor(Math.random() * total);
    if (used.has(randomIndex)) continue;
    used.add(randomIndex);
    const row = Math.floor(randomIndex / game.cols);
    const col = randomIndex % game.cols;
    game.board[row][col].hasMine = true;
  }

  for (let row = 0; row < game.rows; row++) {
    for (let col = 0; col < game.cols; col++) {
      if (game.board[row][col].hasMine) {
        game.board[row][col].neighborMines = 0;
        continue;
      }
      let neighborMineCount = 0;
      for (const [newRow, newCol] of neighbors(game, row, col)) {
        if (game.board[newRow][newCol].hasMine) neighborMineCount++;
      }
      game.board[row][col].neighborMines = neighborMineCount;
    }
  }
}

/* ========= Допоміжний вивід у консоль ========= */
function boardToMineMap(game) {
  return game.board.map((row) =>
    row.map((cell) => (cell.hasMine ? "💣" : "."))
  );
}

function boardToNumbers(game) {
  return game.board.map((row) =>
    row.map((cell) => (cell.hasMine ? "X" : String(cell.neighborMines)))
  );
}

function printBoardPretty(grid, title) {
  console.log(title);
  const asStrings = grid.map((row) => row.join(" "));
  console.log(asStrings.join("\n"));
}

/* ========= Демо-ініціалізація (10×10, 15 мін) ========= */
const game = makeGameState(10, 10, 15);
placeMinesRandomly(game);

/* ========= Вивід, який вимагає завдання ========= */
console.log("=== Стан гри (метадані) ===");
console.log({
  rows: game.rows,
  cols: game.cols,
  mines: game.mines,
  status: game.status,
  flagsLeft: game.flagsLeft,
});

console.log("=== Приклад структури клітинки [0][0] ===");
console.log(game.board[0][0]); 

console.log("=== Двовимірний масив об’єктів (перший рядок) ===");
console.log(game.board[0]); 

printBoardPretty(boardToMineMap(game), "=== Карта мін (💣 | .) ===");
printBoardPretty(boardToNumbers(game), "=== Карта чисел (X = міна) ===");

console.log("=== Карта чисел (console.table) ===");
console.table(boardToNumbers(game));

/* ========= (Не обов’язково) Приклади змін стану ========= */
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

  if (cell.hasMine) {
    game.status = GameStatus.LOSE;
    return;
  }
  game.openedSafe++;
  if (cell.neighborMines === 0) {
    for (const [newRow, newCol] of neighbors(game, row, col)) {
      if (
        game.board[newRow][newCol].state === CellState.CLOSED &&
        !game.board[newRow][newCol].hasMine
      ) {
        openCell(game, newRow, newCol);
      }
    }
  }
  const totalSafe = game.rows * game.cols - game.mines;
  if (game.openedSafe === totalSafe) game.status = GameStatus.WIN;
}
toggleFlag(game, 0, 0);
openCell(game, 5, 5);
console.log("=== Після декількох дій ===");
console.log({
  status: game.status,
  flagsLeft: game.flagsLeft,
  openedSafe: game.openedSafe,
});
