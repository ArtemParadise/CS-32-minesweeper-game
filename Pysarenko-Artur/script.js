function createCell(hasMine = false, adjacentMines = 0, state = "closed") {
    return {
      hasMine: hasMine,             // чи є міна (true/false)
      adjacentMines: adjacentMines, // кількість мін навколо (0-8)
      state: state                  // "closed" | "open" | "flagged"
    };
  }
  
// 2. Створення ігрового поля (двовимірний масив)
function createField(rows, cols) {
    const field = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push(createCell());
      }
      field.push(row);
    }
    return field;
  }

function createGameState(rows, cols, minesCount) {
    return {
      rows: rows,                   // кількість рядків
      cols: cols,                   // кількість колонок
      minesCount: minesCount,       // загальна кількість мін
      status: "in_progress",        // "in_progress" | "win" | "lose"
      field: createField(rows, cols) // саме поле (двовимірний масив клітинок)
    };
  }


function generateField(rows, cols, mines) {
  const field = createField(rows, cols);

  let minesPlaced = 0;
  while (minesPlaced < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!field[r][c].hasMine) {
      field[r][c].hasMine = true;
      minesPlaced++;
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!field[r][c].hasMine) {
        field[r][c].adjacentMines = countNeighbourMines(field, r, c);
      }
    }
  }

  return field;
}

function countNeighbourMines(field, row, col) {
  const rows = field.length;
  const cols = field[0].length;
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        if (field[nr][nc].hasMine) count++;
      }
    }
  }
  return count;
}

function openCell(game, row, col) {
  const cell = game.field[row][col];
  if (cell.state !== "closed" || game.status !== "in_progress") return;
  if (cell.hasMine) {
    cell.state = "open";
    game.status = "lose";
    console.log("💥 Гравець програв!");
    return;
  }
  cell.state = "open";
  if (cell.adjacentMines === 0) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < game.rows && nc >= 0 && nc < game.cols) {
          openCell(game, nr, nc);
        }
      }
    }
  }
}

function toggleFlag(game, row, col) {
  const cell = game.field[row][col];
  if (cell.state === "closed") {
    cell.state = "flagged";
  } else if (cell.state === "flagged") {
    cell.state = "closed";
  }
  console.log(
    `toggleFlag: cell [${row},${col}] now is "${cell.state}"`
  );

}

let timerId = null;
let seconds = 0;

function startTimer() {
  if (timerId !== null) return;
  seconds = 0;
  timerId = setInterval(() => {
    seconds++;
    console.log("⏱️", seconds, "сек");
  }, 1000);
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
  console.log("⏹️ Таймер зупинено на", seconds, "сек");
}

const game = createGameState(9, 9, 9);
game.field = generateField(game.rows, game.cols, game.minesCount);

console.log("Поле з випадковими мінами:");
console.log(game.field);

startTimer();
openCell(game, 0, 0);
openCell(game, 0, 3);
openCell(game, 4, 0);
openCell(game, 1, 0);
openCell(game, 1, 1);
openCell(game, 1, 2);
openCell(game, 1, 3);
openCell(game, 1, 4);
openCell(game, 1, 5);
openCell(game, 1, 6);
openCell(game, 1, 7);
openCell(game, 1, 8);
console.log(game);
console.log(countNeighbourMines(game.field, 3, 0));
toggleFlag(game, 1, 1);
console.log(game.field[1][1]);
stopTimer();