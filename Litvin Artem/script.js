const GAME_STATUS = Object.freeze({
  PENDING: "pending",
  PLAYING: "playing",
  WON: "won",
  LOST: "lost",
});

const gameState = {
  rows: 9,
  cols: 9,
  minesCount: 10,
  status: GAME_STATUS.PENDING,
  board: [],
  timer: 0,
  timerId: null,
};

function createCell() {
  return {
    isMine: false,
    neighborCount: 0,
    isOpen: false,
    isFlagged: false,
  };
}

function countNeighbourMines(field, row, col) {
  let count = 0;

  for (let y = -1; y <= 1; y++) {
    for (let x = -1; x <= 1; x++) {
      const nRow = row + y;
      const nCol = col + x;

      if (
        nRow >= 0 &&
        nRow < field.length &&
        nCol >= 0 &&
        nCol < field[0].length
      ) {
        if (field[nRow][nCol].isMine) {
          count++;
        }
      }
    }
  }
  return count;
}

function generateField(rows, cols, mines) {
  const field = [];
  for (let y = 0; y < rows; y++) {
    const row = [];
    for (let x = 0; x < cols; x++) {
      row.push(createCell());
    }
    field.push(row);
  }

  let minesPlaced = 0;
  while (minesPlaced < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);

    if (!field[r][c].isMine) {
      field[r][c].isMine = true;
      minesPlaced++;
    }
  }

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!field[y][x].isMine) {
        field[y][x].neighborCount = countNeighbourMines(field, y, x);
      }
    }
  }

  return field;
}

function initGame() {
  stopTimer();
  gameState.timer = 0;
  gameState.status = GAME_STATUS.PENDING;

  gameState.board = generateField(
    gameState.rows,
    gameState.cols,
    gameState.minesCount
  );

  console.log("Гра створена! Статус:", gameState.status);
  console.table(gameState.board);
}

function startTimer() {
  if (gameState.timerId) return;

  console.log("Таймер запущено");
  gameState.timerId = setInterval(() => {
    gameState.timer++;
    console.log(`Час гри: ${gameState.timer} сек.`);
  }, 1000);
}

function stopTimer() {
  if (gameState.timerId) {
    clearInterval(gameState.timerId);
    gameState.timerId = null;
    console.log("Таймер зупинено");
  }
}

function openCell(row, col) {
  if (row < 0 || row >= gameState.rows || col < 0 || col >= gameState.cols)
    return;

  const cell = gameState.board[row][col];

  if (cell.isOpen || cell.isFlagged) return;

  if (
    gameState.status === GAME_STATUS.WON ||
    gameState.status === GAME_STATUS.LOST
  ) {
    console.warn("Гра завершена. Почніть нову.");
    return;
  }

  if (gameState.status === GAME_STATUS.PENDING) {
    gameState.status = GAME_STATUS.PLAYING;
    startTimer();
  }

  if (cell.isMine) {
    cell.isOpen = true;
    gameState.status = GAME_STATUS.LOST;
    stopTimer();
    console.error("БАБАХ! Ви програли.");
    console.table(gameState.board);
    return;
  }

  cell.isOpen = true;

  if (cell.neighborCount === 0) {
    for (let y = -1; y <= 1; y++) {
      for (let x = -1; x <= 1; x++) {
        openCell(row + y, col + x);
      }
    }
  }

  console.log(`Відкрито клітинку [${row}, ${col}]`);
}

function toggleFlag(row, col) {
  if (
    gameState.status === GAME_STATUS.WON ||
    gameState.status === GAME_STATUS.LOST
  )
    return;

  const cell = gameState.board[row][col];

  if (!cell.isOpen) {
    cell.isFlagged = !cell.isFlagged;
    console.log(`Прапорець на [${row}, ${col}]: ${cell.isFlagged}`);
  }
}

initGame();
