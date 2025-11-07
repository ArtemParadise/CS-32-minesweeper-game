// script.js

let board = [];
let rows = 10, cols = 10, mines = 10;
let flagsLeft = mines;
let timer = 0;
let timerInterval;

const gameBoard = document.getElementById('gameBoard');
const startBtn = document.getElementById('startBtn');
const timerDisplay = document.getElementById('timer');
const flagsDisplay = document.getElementById('flags');

function startGame() {
  clearInterval(timerInterval);
  timer = 0;
  timerDisplay.textContent = `Час: ${timer}`;
  flagsLeft = mines;
  flagsDisplay.textContent = `Флаги: ${flagsLeft}`;
  board = generateBoard(rows, cols, mines);
  renderBoard();
  timerInterval = setInterval(() => {
    timer++;
    timerDisplay.textContent = `Час: ${timer}`;
  }, 1000);
}

function generateBoard(rows, cols, mines) {
  const board = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      value: 0,
      open: false,
      flag: false,
      mine: false,
    }))
  );

  // Розміщення мін
  let placed = 0;
  while (placed < mines) {
    const x = Math.floor(Math.random() * cols);
    const y = Math.floor(Math.random() * rows);
    if (!board[y][x].mine) {
      board[y][x].mine = true;
      placed++;
    }
  }

  // Обчислення значень
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (board[y][x].mine) continue;
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < rows && nx >= 0 && nx < cols && board[ny][nx].mine) {
            count++;
          }
        }
      }
      board[y][x].value = count;
    }
  }

  return board;
}

function openCell(board, x, y) {
  const cell = board[y][x];
  if (cell.open || cell.flag) return;
  cell.open = true;
  if (cell.value === 0 && !cell.mine) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const ny = y + dy, nx = x + dx;
        if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
          openCell(board, nx, ny);
        }
      }
    }
  }
}

function toggleFlag(board, x, y) {
  const cell = board[y][x];
  if (cell.open) return;
  cell.flag = !cell.flag;
}

function checkWin(board) {
  return board.flat().every(cell =>
    (cell.mine && !cell.open) || (!cell.mine && cell.open)
  );
}

function checkLoss(board) {
  return board.flat().some(cell => cell.mine && cell.open);
}

function renderBoard() {
  gameBoard.innerHTML = '';
  gameBoard.style.gridTemplateColumns = `repeat(${cols}, 30px)`;
  board.forEach((row, y) => {
    row.forEach((cell, x) => {
      const div = document.createElement('div');
      div.classList.add('cell');
      div.dataset.x = x;
      div.dataset.y = y;
      if (cell.open) div.classList.add('open');
      if (cell.flag) div.classList.add('flag');
      div.textContent = cell.open && cell.value > 0 ? cell.value : '';
      gameBoard.appendChild(div);
    });
  });
}

gameBoard.addEventListener('mousedown', (e) => {
  const x = +e.target.dataset.x;
  const y = +e.target.dataset.y;
  if (!Number.isInteger(x) || !Number.isInteger(y)) return;

  if (e.button === 0) {
    openCell(board, x, y);
    renderBoard();
    if (checkLoss(board)) {
      clearInterval(timerInterval);
      alert('Поразка!');
    } else if (checkWin(board)) {
      clearInterval(timerInterval);
      alert('Перемога!');
    }
  } else if (e.button === 2) {
    e.preventDefault();
    toggleFlag(board, x, y);
    flagsLeft = mines - board.flat().filter(c => c.flag).length;
    flagsDisplay.textContent = `Флаги: ${flagsLeft}`;
    renderBoard();
  }
});

startBtn.addEventListener('click', startGame);