// ===== Состояние
const CellState = { CLOSED: "closed", OPEN: "open", FLAG: "flag" };
const GameStatus = { RUNNING: "running", WIN: "win", LOSE: "lose" };

// ===== Клетка
function makeCell(hasMine = false) {
  return {
    hasMine, // булевое
    neighborMines: 0, // число 0..8
    state: CellState.CLOSED, // "closed" | "open" | "flag"
  };
}

// ===== Состояние игры
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

// ===== Дополнительное
const DIRS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];
const inBounds = (g, r, c) => r >= 0 && c >= 0 && r < g.rows && c < g.cols;

function computeNeighborMines(g) {
  for (let r = 0; r < g.rows; r++)
    for (let c = 0; c < g.cols; c++) {
      const cell = g.board[r][c];
      if (cell.hasMine) {
        cell.neighborMines = 0;
        continue;
      }
      let count = 0;
      for (const [dr, dc] of DIRS) {
        const nr = r + dr,
          nc = c + dc;
        if (inBounds(g, nr, nc) && g.board[nr][nc].hasMine) count++;
      }
      cell.neighborMines = count;
    }
}

// ===== Базовые действия
function toggleFlag(g, r, c) {
  const cell = g.board[r][c];
  if (g.status !== GameStatus.RUNNING || cell.state === CellState.OPEN) return;
  if (cell.state === CellState.FLAG) {
    cell.state = CellState.CLOSED;
    g.flagsLeft++;
  } else if (g.flagsLeft > 0) {
    cell.state = CellState.FLAG;
    g.flagsLeft--;
  }
}

function openCell(g, r, c) {
  const cell = g.board[r][c];
  if (g.status !== GameStatus.RUNNING || cell.state !== CellState.CLOSED)
    return;
  cell.state = CellState.OPEN;

  if (cell.hasMine) {
    g.status = GameStatus.LOSE;
    return;
  }

  g.openedSafe++;
  if (cell.neighborMines === 0) {
    for (const [dr, dc] of DIRS) {
      const nr = r + dr,
        nc = c + dc;
      if (inBounds(g, nr, nc)) openCell(g, nr, nc);
    }
  }
  const totalSafe = g.rows * g.cols - g.mines;
  if (g.openedSafe === totalSafe) g.status = GameStatus.WIN;
}

const game = makeGameState(8, 8, 10);
const testMines = [
  [0, 5],
  [1, 7],
  [2, 1],
  [3, 4],
  [3, 7],
  [4, 0],
  [5, 2],
  [6, 7],
  [7, 3],
  [7, 6],
];
for (const [r, c] of testMines) game.board[r][c].hasMine = true;
computeNeighborMines(game);

console.log("Статус:", game.status, "Прапорців лишилось:", game.flagsLeft);
console.table(
  game.board.map((row) =>
    row.map((cell) =>
      cell.state === CellState.OPEN
        ? cell.neighborMines
        : cell.state === CellState.FLAG
        ? "F"
        : cell.hasMine
        ? "•"
        : "■"
    )
  )
);

game.rows, game.cols, game.mines, game.status;
console.table(
  game.board.map((row) =>
    row.map((c) =>
      c.state === "open"
        ? c.neighborMines
        : c.state === "flag"
        ? "F"
        : c.hasMine
        ? "•"
        : "■"
    )
  )
);
openCell(game, 0, 0);
game.status;
toggleFlag(game, 0, 5);
game.flagsLeft;
