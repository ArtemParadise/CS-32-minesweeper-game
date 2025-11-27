const board = document.getElementById('game-board');
const flagsDisplay = document.getElementById('flags');
const timerDisplay = document.getElementById('timer');
const restartBtn = document.getElementById('restart-btn');

console.log('Flags Element:', flagsDisplay);
console.log('Flags Element is Null:', flagsDisplay === null);

const rows = 10;
const cols = 10;
const minesCount = 10;


let boardData = [];           // двовимірний масив із об'єктами клітинок
let flags = minesCount;
let timerId = null;
let seconds = 0;
let gameOver = false;
let firstClick = true;        // щоб забезпечити безпечний перший клік

// -------------------- ІНІЦІАЛІЗАЦІЯ --------------------
function initGame() {
  // Скидання стану
  stopTimer();
  seconds = 0;
  timerDisplay.textContent = seconds;
  flags = minesCount;
  flagsDisplay.textContent = flags;
  gameOver = false;
  firstClick = true;
  boardData = [];
  board.innerHTML = '';

  //  DOM та структура поля без мін (міни ставимо при першому кліку)
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const cellEl = document.createElement('div');
      cellEl.classList.add('cell', 'closed');
      cellEl.dataset.row = r;
      cellEl.dataset.col = c;

      // Події
      cellEl.addEventListener('click', leftClick);
      cellEl.addEventListener('contextmenu', rightClick);

      board.appendChild(cellEl);

      row.push({
        mine: false,
        open: false,
        flagged: false,
        neighborMines: 0,
        element: cellEl,
      });
    }
    boardData.push(row);
  }

}

// -------------------- РОЗСТАНОВКА МІН --------------------
function placeMinesSafe(excludeRow, excludeCol) {
  // Поміщуємо minesCount мін так, щоб (excludeRow, excludeCol) і його сусіди були вільні
  let placed = 0;
  const forbidden = new Set();

  // Забороняємо саму клітинку first click і її сусідів
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const rr = excludeRow + dr;
      const cc = excludeCol + dc;
      if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) {
        forbidden.add(rr + '-' + cc);
      }
    }
  }

  while (placed < minesCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    const key = r + '-' + c;
    if (forbidden.has(key)) continue;
    if (!boardData[r][c].mine) {
      boardData[r][c].mine = true;
      placed++;
    }
  }
}

// -------------------- ПІДРАХУНОК СУСІДНІХ МІН --------------------
function countNeighbourMines(field, row, col) {
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < field.length && nc >= 0 && nc < field[0].length) {
        if (field[nr][nc].mine) count++;
      }
    }
  }
  return count;
}

function calculateNeighbors() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!boardData[r][c].mine) {
        boardData[r][c].neighborMines = countNeighbourMines(boardData, r, c);
      } else {
        boardData[r][c].neighborMines = -1; // маркер для міни
      }
    }
  }
}

// -------------------- ЛІВИЙ КЛІК --------------------
function leftClick(e) {
  if (gameOver) return;
  const r = parseInt(this.dataset.row, 10);
  const c = parseInt(this.dataset.col, 10);

  // Якщо перший клік — розставляємо міни безпечним способом, розраховуємо сусідів і стартуємо таймер
  if (firstClick) {
    placeMinesSafe(r, c);
    calculateNeighbors();
    startTimer();
    firstClick = false;
  }

  openCell(boardData, r, c);
}

// -------------------- ПРАВИЙ КЛІК (ФЛАГ) --------------------
function rightClick(e) {
  e.preventDefault();
  if (gameOver) return;
  const r = parseInt(this.dataset.row, 10);
  const c = parseInt(this.dataset.col, 10);
  toggleFlag(boardData, r, c);
  flagsDisplay.textContent = flags;
}

// -------------------- ВІДКРИТТЯ КЛІТИНКИ (рекурсія для нулів) --------------------
function openCell(field, row, col) {
  const cell = field[row][col];

  if (cell.open || cell.flagged || gameOver) return;
  cell.open = true;

  // Обновляємо DOM
  cell.element.classList.remove('closed');
  cell.element.classList.add('open');
  cell.element.classList.remove('flag'); // якщо там був прапорець

  if (cell.mine) {
    // Програш
    cell.element.classList.add('clicked-mine');
    gameOver = true;
    revealMines();
    stopTimer();
    setTimeout(() => alert("Гра завершена! Ти натрапила на міну."), 50);
    return "GAME_OVER";
  }

  if (cell.neighborMines > 0) {
    cell.element.textContent = cell.neighborMines;
    cell.element.dataset.value = cell.neighborMines;
  } else {
    // Порожня клітинка — рекурсивно відкриваємо сусідні, але тільки ті, які ще не відкриті
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = row + dr;
        const nc = col + dc;
        if (
          nr >= 0 && nr < rows &&
          nc >= 0 && nc < cols &&
          !field[nr][nc].open
        ) {
          openCell(field, nr, nc);
        }
      }
    }
  }

  // Перевірка на перемогу після кожного відкриття
  checkWin();
  return "OK";
}

// -------------------- ФУНКЦІЯ ПЕРЕКИДУ ПРАПОРЦЯ --------------------
function toggleFlag(field, row, col) {
  const cell = field[row][col];

  if (cell.open) return;

  if (!cell.flagged && flags > 0) {
    cell.flagged = true;
    flags--;
    cell.element.classList.add("flag");
  } else if (cell.flagged) {
    cell.flagged = false;
    flags++;
    cell.element.classList.remove("flag");
  }

  flagsDisplay.textContent = flags; 
}



// -------------------- ПОКАЗАТИ ВСІ МІНИ --------------------
function revealMines() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = boardData[r][c];
      if (cell.mine && !cell.open) {
        cell.element.classList.add('mine');
      }
    }
  }
}

// -------------------- ПЕРЕВІРКА НА ПЕРЕМОГУ --------------------
function checkWin() {
  let opened = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (boardData[r][c].open) opened++;
    }
  }
  if (opened === rows * cols - minesCount) {
    gameOver = true;
    stopTimer();
    revealMines();
    setTimeout(() => alert("Вітаю! Ти виграла!"), 50);
  }
}

// -------------------- ТАЙМЕР --------------------
function startTimer() {
  if (timerId) return;
  timerId = setInterval(() => {
    seconds++;
    timerDisplay.textContent = seconds;
  }, 1000);
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

// -------------------- КНОПКА ПЕРЕЗАПУСКУ --------------------
restartBtn.addEventListener('click', () => {
  initGame();
});


window._ms = {
  get field() { return boardData; },
  open: (r, c) => openCell(boardData, r, c),
  flag: (r, c) => toggleFlag(boardData, r, c),
  placeMinesSafe,
  calculateNeighbors,
  countNeighbourMines
};

// -------------------- СТАРТ --------------------
initGame();
