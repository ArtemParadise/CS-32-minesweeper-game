// Перелік станів клітинки
const CellState = {
  CLOSED: "closed",
  OPENED: "opened",
  FLAGGED: "flagged",
};

// Перелік станів гри
const GameStatus = {
  IN_PROGRESS: "in_progress",
  WON: "won",
  LOST: "lost",
};

// Опис об'єкта клітинки
function createCell(hasMine = false) {
  return {
    hasMine,          // boolean: наявність міни
    adjacentMines: 0, // number: кількість сусідніх мін
    state: CellState.CLOSED, // 'closed' | 'opened' | 'flagged'
  };
}

function createGameState(rows, cols, mineCount) {
  return {
    rows,             // розмірність: кількість рядків
    cols,             // розмірність: кількість колонок
    mineCount,        // кількість мін
    flagsLeft: mineCount,
    status: GameStatus.IN_PROGRESS, // поточний стан гри
    board: Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => createCell(false)),
    ),
    seconds: 0,
    timerId: null,
    started: false,
  };
}

function inBounds(gs, r, c) {
  return r >= 0 && c >= 0 && r < gs.rows && c < gs.cols;
}

function countAdjacentMines(gs, r, c) {
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (inBounds(gs, nr, nc) && gs.board[nr][nc].hasMine) count++;
    }
  }
  return count;
}


function initTestBoard(gs) {
  // Координати мін для прикладу
  const mines = [
    [1, 1],
    [4, 1],
    [4, 3],
    [7, 3],
    [7, 5],
  ];
  mines.forEach(([r, c]) => (gs.board[r][c].hasMine = true));
  // Заповнити adjacentMines
  for (let r = 0; r < gs.rows; r++) {
    for (let c = 0; c < gs.cols; c++) {
      gs.board[r][c].adjacentMines = countAdjacentMines(gs, r, c);
    }
  }
}

function render(gs) {
  const boardEl = document.getElementById("board");
  boardEl.style.gridTemplateColumns = `repeat(${gs.cols}, 24px)`;
  boardEl.innerHTML = "";

  for (let r = 0; r < gs.rows; r++) {
    for (let c = 0; c < gs.cols; c++) {
      const cell = gs.board[r][c];
      const div = document.createElement("div");
      div.classList.add("cell");
      div.dataset.r = String(r);
      div.dataset.c = String(c);

      if (cell.state === CellState.CLOSED) {
        div.classList.add("closed");
      } else if (cell.state === CellState.FLAGGED) {
        div.classList.add("closed", "flagged");
      } else {
        // OPENED
        div.classList.add("opened");
        if (cell.hasMine) {
          div.classList.add("mine", "revealed");
        } else if (cell.adjacentMines > 0) {
          div.textContent = String(cell.adjacentMines);
          div.classList.add(`num${cell.adjacentMines}`);
        }
      }

      if (gs.status === GameStatus.LOST && cell.hasMine && cell.state !== CellState.OPENED) {
        div.classList.remove("closed", "flagged");
        div.classList.add("opened", "mine", "revealed");
      }

      boardEl.appendChild(div);
    }
  }

  document.getElementById("minesCounter").textContent = pad3(gs.flagsLeft);
  document.getElementById("timer").textContent = pad3(gs.seconds);

  const restartBtn = document.getElementById("restartBtn");
  restartBtn.textContent =
    gs.status === GameStatus.IN_PROGRESS ? "🙂" :
      gs.status === GameStatus.WON ? "😎" : "🙁";
}

function pad3(n) {
  const v = Math.max(0, Math.min(999, n | 0));
  return v.toString().padStart(3, "0");
}

function openCell(gs, r, c) {
  if (!inBounds(gs, r, c)) return;
  const cell = gs.board[r][c];
  if (cell.state !== CellState.CLOSED) return;
  cell.state = CellState.OPENED;

  if (cell.hasMine) {
    gs.status = GameStatus.LOST;
    stopTimer(gs);
    return;
  }
  if (cell.adjacentMines === 0) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        openCell(gs, r + dr, c + dc);
      }
    }
  }
}

function toggleFlag(gs, r, c) {
  if (!inBounds(gs, r, c)) return;
  const cell = gs.board[r][c];
  if (cell.state === CellState.OPENED) return;
  if (cell.state === CellState.CLOSED && gs.flagsLeft > 0) {
    cell.state = CellState.FLAGGED;
    gs.flagsLeft--;
  } else if (cell.state === CellState.FLAGGED) {
    cell.state = CellState.CLOSED;
    gs.flagsLeft++;
  }
}

function checkWin(gs) {
  for (let r = 0; r < gs.rows; r++) {
    for (let c = 0; c < gs.cols; c++) {
      const cell = gs.board[r][c];
      if (!cell.hasMine && cell.state !== CellState.OPENED) {
        return false;
      }
    }
  }
  gs.status = GameStatus.WON;
  stopTimer(gs);
  return true;
}

function startTimer(gs) {
  if (gs.started) return;
  gs.started = true;
  gs.timerId = setInterval(() => {
    gs.seconds = Math.min(999, gs.seconds + 1);
    document.getElementById("timer").textContent = pad3(gs.seconds);
  }, 1000);
}

function stopTimer(gs) {
  if (gs.timerId) clearInterval(gs.timerId);
  gs.timerId = null;
}

function newGame(rows = 9, cols = 9, mines = 10) {
  const gs = createGameState(rows, cols, mines);
  initTestBoard(gs); // фіксовані дані для лабораторної
  render(gs);

  const boardEl = document.getElementById("board");

  // ЛКМ — відкрити
  boardEl.addEventListener("click", e => {
    if (gs.status !== GameStatus.IN_PROGRESS) return;
    const target = e.target;
    if (!(target instanceof HTMLElement) || !target.classList.contains("cell")) return;
    const r = Number(target.dataset.r), c = Number(target.dataset.c);

    startTimer(gs);
    openCell(gs, r, c);
    render(gs);
    if (gs.status === GameStatus.IN_PROGRESS) {
      checkWin(gs);
      render(gs);
    }
  });

  // ПКМ — прапорець
  boardEl.addEventListener("contextmenu", e => {
    e.preventDefault();
    if (gs.status !== GameStatus.IN_PROGRESS) return;
    const target = e.target;
    if (!(target instanceof HTMLElement) || !target.classList.contains("cell")) return;
    const r = Number(target.dataset.r), c = Number(target.dataset.c);

    startTimer(gs);
    toggleFlag(gs, r, c);
    render(gs);
    if (gs.status === GameStatus.IN_PROGRESS) {
      checkWin(gs);
      render(gs);
    }
  });

  document.getElementById("restartBtn").onclick = () => {
    stopTimer(gs);
    Object.assign(gs, createGameState(rows, cols, mines));
    initTestBoard(gs);
    render(gs);
  };

  return gs;
}

// Запуск
window.addEventListener("DOMContentLoaded", () => {
  newGame(9, 9, 10);
});
