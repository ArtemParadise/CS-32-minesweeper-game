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
  flagsUsed: 0,
};

const boardElement = document.querySelector(".board");
const timerElement = document.getElementById("timer");
const flagsElement = document.getElementById("flags-left");
const btnStart = document.querySelector(".btn-start");
const emojiSpan = btnStart.querySelector(".emoji");

function createCell() {
  return {
    isMine: false,
    neighborCount: 0,
    isOpen: false,
    isFlagged: false,
  };
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
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy,
              nx = x + dx;
            if (
              ny >= 0 &&
              ny < rows &&
              nx >= 0 &&
              nx < cols &&
              field[ny][nx].isMine
            ) {
              count++;
            }
          }
        }
        field[y][x].neighborCount = count;
      }
    }
  }
  return field;
}

function startTimer() {
  if (gameState.timerId) return;
  gameState.timerId = setInterval(() => {
    gameState.timer++;
    updateHeader();
  }, 1000);
}

function stopTimer() {
  if (gameState.timerId) {
    clearInterval(gameState.timerId);
    gameState.timerId = null;
  }
}

function checkWin() {
  let openedCount = 0;
  for (let row of gameState.board) {
    for (let cell of row) {
      if (cell.isOpen) openedCount++;
    }
  }
  const totalCells = gameState.rows * gameState.cols;
  if (openedCount === totalCells - gameState.minesCount) {
    gameState.status = GAME_STATUS.WON;
    stopTimer();
    alert("Вітаємо! Ви виграли!");
    updateHeader();
    renderBoard();
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
  )
    return;

  if (gameState.status === GAME_STATUS.PENDING) {
    gameState.status = GAME_STATUS.PLAYING;
    startTimer();
  }

  cell.isOpen = true;

  if (cell.isMine) {
    gameState.status = GAME_STATUS.LOST;
    stopTimer();
    revealAllMines();
    updateHeader();
  } else {
    if (cell.neighborCount === 0) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          openCell(row + dy, col + dx);
        }
      }
    }
    checkWin();
  }
  renderBoard();
}

function toggleFlag(row, col) {
  const cell = gameState.board[row][col];
  if (
    cell.isOpen ||
    gameState.status === GAME_STATUS.WON ||
    gameState.status === GAME_STATUS.LOST
  )
    return;

  cell.isFlagged = !cell.isFlagged;
  gameState.flagsUsed += cell.isFlagged ? 1 : -1;

  updateHeader();
  renderBoard();
}

function revealAllMines() {
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      if (gameState.board[r][c].isMine) {
        gameState.board[r][c].isOpen = true;
      }
    }
  }
}

function updateHeader() {
  timerElement.innerText = gameState.timer.toString().padStart(3, "0");

  const flagsLeft = gameState.minesCount - gameState.flagsUsed;
  flagsElement.innerText = flagsLeft.toString().padStart(3, "0");

  if (gameState.status === GAME_STATUS.WON) {
    emojiSpan.innerText = "😎";
  } else if (gameState.status === GAME_STATUS.LOST) {
    emojiSpan.innerText = "😵";
  } else {
    emojiSpan.innerText = "🙂";
  }
}

function renderBoard() {
  boardElement.innerHTML = "";

  for (let y = 0; y < gameState.rows; y++) {
    for (let x = 0; x < gameState.cols; x++) {
      const cellData = gameState.board[y][x];
      const cellDiv = document.createElement("div");

      cellDiv.classList.add("cell");

      if (cellData.isOpen) {
        cellDiv.classList.add("opened");

        if (cellData.isMine) {
          cellDiv.classList.add("mine");
          cellDiv.innerText = "💣";
        } else if (cellData.neighborCount > 0) {
          cellDiv.classList.add(`num-${cellData.neighborCount}`);
          cellDiv.innerText = cellData.neighborCount;
        }
      } else if (cellData.isFlagged) {
        cellDiv.classList.add("flagged");
        cellDiv.innerText = "🚩";
      }

      cellDiv.addEventListener("click", () => {
        openCell(y, x);
      });

      cellDiv.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        toggleFlag(y, x);
      });

      boardElement.appendChild(cellDiv);
    }
  }
}

function initGame() {
  stopTimer();
  gameState.timer = 0;
  gameState.flagsUsed = 0;
  gameState.status = GAME_STATUS.PENDING;
  gameState.board = generateField(
    gameState.rows,
    gameState.cols,
    gameState.minesCount
  );

  updateHeader();
  renderBoard();
}

btnStart.addEventListener("click", initGame);

initGame();
