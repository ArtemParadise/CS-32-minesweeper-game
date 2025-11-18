const boardEl = document.getElementById('board');
const mineCounter = document.getElementById('mineCounter');
const timerEl = document.getElementById('timer');
const restartBtn = document.getElementById('restart');
const btnEasy = document.getElementById('btn-easy');
const btnMed = document.getElementById('btn-medium');
const btnHard = document.getElementById('btn-hard');
const btnNew = document.getElementById('btn-new');

let rows = 9, cols = 9, mines = 10;
let grid = [];
let started = false, timer = null, seconds = 0;
let flags = 0, opened = 0, totalCells = 0;

function setDifficulty(rowCount, colCount, mineCount) {
  rows = rowCount;
  cols = colCount;
  mines = mineCount;
  newGame();
}

btnEasy.onclick = () => setDifficulty(9, 9, 10);
btnMed.onclick = () => setDifficulty(16, 16, 40);
btnHard.onclick = () => setDifficulty(16, 30, 99);
btnNew.onclick = () => newGame();
restartBtn.onclick = () => newGame();

function formatNum(n) {
  return String(n).padStart(3, '0');
}

function newGame() {
  started = false;
  clearInterval(timer);
  seconds = 0;
  timerEl.textContent = formatNum(0);
  flags = 0;
  opened = 0;
  mineCounter.textContent = formatNum(mines);
  boardEl.innerHTML = '';
  grid = [];
  totalCells = rows * cols;

  boardEl.style.gridTemplateColumns = `repeat(${cols}, auto)`;
  for (let row = 0; row < rows; row++) {
    grid[row] = [];
    for (let col = 0; col < cols; col++) {
      const cell = {
        row,
        col,
        mine: false,
        num: 0,
        opened: false,
        flagged: false,
        el: null
      };
      const el = document.createElement('div');
      el.className = 'tile closed';
      el.dataset.row = row;
      el.dataset.col = col;
      el.oncontextmenu = e => { e.preventDefault(); toggleFlag(cell); };
      el.addEventListener('click', () => handleOpen(cell));
      el.addEventListener('dblclick', () => handleChord(cell));
      cell.el = el;
      boardEl.appendChild(el);
      grid[row][col] = cell;
    }
  }
}

function placeMines(firstRow, firstCol) {
  let placed = 0;
  while (placed < mines) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    if (grid[row][col].mine) continue;
    if (row === firstRow && col === firstCol) continue;
    grid[row][col].mine = true;
    placed++;
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row][col].mine) continue;
      let count = 0;
      for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
        for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
          const newRow = row + deltaRow;
          const newCol = col + deltaCol;
          if (
            newRow >= 0 && newRow < rows &&
            newCol >= 0 && newCol < cols &&
            grid[newRow][newCol].mine
          ) count++;
        }
      }
      grid[row][col].num = count;
    }
  }
}

function startTimer() {
  timerEl.textContent = formatNum(0);
  seconds = 0;
  timer = setInterval(() => {
    seconds++;
    timerEl.textContent = formatNum(Math.min(seconds, 999));
  }, 1000);
}

function handleOpen(cell) {
  if (cell.opened || cell.flagged) return;
  if (!started) {
    placeMines(cell.row, cell.col);
    started = true;
    startTimer();
  }
  openCell(cell);
  checkWin();
}

function openCell(cell) {
  if (cell.opened || cell.flagged) return;
  cell.opened = true;
  opened++;
  const el = cell.el;
  el.classList.remove('closed');
  el.style.cursor = 'default';
  if (cell.mine) {
    el.classList.add('bomb');
    el.textContent = '💣';
    gameOver(false);
    return;
  }
  if (cell.num > 0) {
    el.classList.add('num' + cell.num);
    el.textContent = cell.num;
  } else {
    el.textContent = '';
    for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
      for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
        const newRow = cell.row + deltaRow;
        const newCol = cell.col + deltaCol;
        if (
          newRow >= 0 && newRow < rows &&
          newCol >= 0 && newCol < cols
        ) {
          openCell(grid[newRow][newCol]);
        }
      }
    }
  }
}

function toggleFlag(cell) {
  if (cell.opened) return;
  cell.flagged = !cell.flagged;
  const el = cell.el;
  if (cell.flagged) {
    el.classList.add('flag');
    el.textContent = '🚩';
    flags++;
  } else {
    el.classList.remove('flag');
    el.textContent = '';
    flags--;
  }
  mineCounter.textContent = formatNum(Math.max(mines - flags, 0));
  checkWin();
}

function handleChord(cell) {
  if (!cell.opened || cell.num === 0) return;
  let flaggedNeighbours = 0;
  const neighbours = [];
  for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
    for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
      const newRow = cell.row + deltaRow;
      const newCol = cell.col + deltaCol;
      if (
        newRow >= 0 && newRow < rows &&
        newCol >= 0 && newCol < cols
      ) {
        const neighbourCell = grid[newRow][newCol];
        neighbours.push(neighbourCell);
        if (neighbourCell.flagged) flaggedNeighbours++;
      }
    }
  }
  if (flaggedNeighbours === cell.num) {
    neighbours.forEach(neighbour => {
      if (!neighbour.flagged && !neighbour.opened) openCell(neighbour);
    });
  }
}

function revealAllMines() {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = grid[row][col];
      if (cell.mine && !cell.opened) {
        cell.el.classList.remove('closed');
        cell.el.classList.add('bomb');
        cell.el.textContent = '💣';
      }
    }
  }
}

function gameOver(win) {
  clearInterval(timer);
  started = false;
  if (!win) {
    revealAllMines();
    restartBtn.textContent = '😵';
    setTimeout(() => alert('Поразка! Спробуйте ще раз.'), 80);
  } else {
    restartBtn.textContent = '😎';
    setTimeout(() => alert('Вітаю! Ви виграли.'), 80);
  }
}

function checkWin() {
  if (opened === totalCells - mines) {
    gameOver(true);
  }
}

newGame();

