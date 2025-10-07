// --- Структура стану гри ---
// Описує загальний стан гри, включаючи розміри поля, кількість мін
// та поточний статус (у процесі, перемога, поразка).
const gameState = {
  boardDimensions: { width: 0, height: 0 }, // Розмірність поля [cite: 47]
  mineCount: 0,                           // Кількість мін [cite: 48]
  status: 'ready',                        // Поточний стан гри: 'ready', 'playing', 'win', 'lose' [cite: 49]
};


/**
 * --- Структура клітинки (Cell Object) --- [cite: 52]
 * Кожна клітинка на ігровому полі є об'єктом з такими властивостями:
 * * @property {boolean} isMine - Вказує, чи є в клітинці міна. [cite: 43]
 * @property {number} neighborCount - Кількість сусідніх мін. [cite: 44]
 * @property {string} state - Стан клітинки: 'closed', 'open', 'flagged'. [cite: 45]
 */
function createCell() {
  return {
    isMine: false,
    neighborCount: 0,
    state: 'closed', // Можливі стани: 'closed', 'open', 'flagged'
  };
}

// Клас для гри Minesweeper
class Minesweeper {
  constructor() {
    this.board = []; // Ігрове поле у вигляді двовимірного масиву [cite: 41]
    this.gameBoard = document.getElementById('gameBoard');
    this.minesCountElement = document.getElementById('minesCount');
    this.timerElement = document.getElementById('timer');
    this.gameStatusElement = document.getElementById('gameStatus');
    this.difficultySelect = document.getElementById('difficulty');
    this.customSettings = document.getElementById('customSettings');
    this.newGameBtn = document.getElementById('newGameBtn');

    this.timer = 0;
    this.timerInterval = null;
    this.flaggedCount = 0;

    this.difficulties = {
      beginner: { width: 9, height: 9, mines: 10 },
      intermediate: { width: 16, height: 16, mines: 40 },
      expert: { width: 16, height: 30, mines: 99 }
    };

    this.currentDifficulty = 'intermediate';
    this.initializeEventListeners();
    this.initializeGame();
  }

  initializeEventListeners() {
    this.difficultySelect.addEventListener('change', (e) => {
      this.currentDifficulty = e.target.value;
      this.customSettings.style.display = e.target.value === 'custom' ? 'flex' : 'none';
      this.initializeGame();
    });

    this.newGameBtn.addEventListener('click', () => this.initializeGame());

    this.customSettings.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', () => {
        if (this.currentDifficulty === 'custom') {
          this.initializeGame();
        }
      });
    });
  }

  initializeGame() {
    this.clearTimer();
    this.timer = 0;
    this.flaggedCount = 0;

    const settings = this.getGameSettings();

    // Оновлюємо глобальний стан гри
    gameState.boardDimensions = { width: settings.width, height: settings.height };
    gameState.mineCount = settings.mines;
    gameState.status = 'ready';

    this.createBoard();
    this.renderBoard();
    this.updateDisplay();

    this.gameStatusElement.textContent = 'Готовий';
    this.gameStatusElement.className = 'stat-value';
  }

  getGameSettings() {
    if (this.currentDifficulty === 'custom') {
      const width = parseInt(document.getElementById('customWidth').value) || 16;
      const height = parseInt(document.getElementById('customHeight').value) || 16;
      const mines = parseInt(document.getElementById('customMines').value) || 40;
      const maxMines = Math.floor((width * height) * 0.8);
      return { width, height, mines: Math.min(mines, maxMines) };
    }
    return this.difficulties[this.currentDifficulty];
  }

  // --- Побудова структури ігрового поля --- [cite: 53]
  createBoard() {
    this.board = [];
    const { width, height } = gameState.boardDimensions;

    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        row.push(createCell()); // Створюємо клітинку з властивостями
      }
      this.board.push(row);
    }
  }

  placeMines(firstClickX, firstClickY) {
    let minesPlaced = 0;
    const { width, height } = gameState.boardDimensions;

    while (minesPlaced < gameState.mineCount) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);

      if (!this.board[y][x].isMine && !(Math.abs(x - firstClickX) <= 1 && Math.abs(y - firstClickY) <= 1)) {
        this.board[y][x].isMine = true;
        minesPlaced++;
      }
    }

    this.calculateNeighborCounts();
  }

  calculateNeighborCounts() {
    const { width, height } = gameState.boardDimensions;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!this.board[y][x].isMine) {
          this.board[y][x].neighborCount = this.countNeighborMines(x, y);
        }
      }
    }
  }

  countNeighborMines(x, y) {
    let count = 0;
    const { width, height } = gameState.boardDimensions;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const newX = x + dx;
        const newY = y + dy;
        if (newX >= 0 && newX < width && newY >= 0 && newY < height && this.board[newY][newX].isMine) {
          count++;
        }
      }
    }
    return count;
  }

  renderBoard() {
    const { width, height } = gameState.boardDimensions;
    this.gameBoard.innerHTML = '';
    this.gameBoard.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
    this.gameBoard.style.display = 'grid';
    this.gameBoard.style.gap = '1px';

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.x = x;
        cell.dataset.y = y;

        cell.addEventListener('click', (e) => this.handleCellClick(e, x, y));
        cell.addEventListener('contextmenu', (e) => this.handleRightClick(e, x, y));

        this.gameBoard.appendChild(cell);
      }
    }
  }

  handleCellClick(event, x, y) {
    event.preventDefault();

    if (gameState.status === 'win' || gameState.status === 'lose' || this.board[y][x].state !== 'closed') {
      return;
    }

    if (gameState.status === 'ready') {
      this.startGame(x, y);
    }

    this.revealCell(x, y);
    this.updateDisplay();
    this.checkWinCondition();
  }

  handleRightClick(event, x, y) {
    event.preventDefault();
    if (gameState.status === 'win' || gameState.status === 'lose' || this.board[y][x].state === 'open') {
      return;
    }
    this.toggleFlag(x, y);
    this.updateDisplay();
  }

  startGame(firstClickX, firstClickY) {
    gameState.status = 'playing';
    this.placeMines(firstClickX, firstClickY);
    this.startTimer();
    this.gameStatusElement.textContent = 'Граємо';
  }

  revealCell(x, y) {
    const cell = this.board[y][x];
    if (cell.state !== 'closed') return;

    cell.state = 'open';

    if (cell.isMine) {
      this.endGame(false);
      return;
    }

    if (cell.neighborCount === 0) {
      const { width, height } = gameState.boardDimensions;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const newX = x + dx;
          const newY = y + dy;
          if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
            this.revealCell(newX, newY);
          }
        }
      }
    }
    this.updateCellDisplay(x, y);
  }

  toggleFlag(x, y) {
    const cell = this.board[y][x];
    if (cell.state === 'closed') {
      cell.state = 'flagged';
      this.flaggedCount++;
    } else if (cell.state === 'flagged') {
      cell.state = 'closed';
      this.flaggedCount--;
    }
    this.updateCellDisplay(x, y);
  }

  updateCellDisplay(x, y) {
    const { width } = gameState.boardDimensions;
    const cellElement = this.gameBoard.children[y * width + x];
    const cell = this.board[y][x];

    cellElement.className = 'cell';
    cellElement.textContent = '';

    if (cell.state === 'flagged') {
      cellElement.classList.add('flagged');
      cellElement.textContent = '🚩';
    } else if (cell.state === 'open') {
      cellElement.classList.add('revealed');
      if (cell.isMine) {
        cellElement.classList.add('mine');
        cellElement.textContent = '💣';
      } else if (cell.neighborCount > 0) {
        cellElement.textContent = cell.neighborCount;
        cellElement.dataset.count = cell.neighborCount;
      }
    }
  }

  checkWinCondition() {
    const { width, height } = gameState.boardDimensions;
    let revealedCount = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (this.board[y][x].state === 'open' && !this.board[y][x].isMine) {
          revealedCount++;
        }
      }
    }

    if (revealedCount === (width * height - gameState.mineCount)) {
      this.endGame(true);
    }
  }

  endGame(won) {
    this.clearTimer();
    if (won) {
      gameState.status = 'win';
      this.gameStatusElement.textContent = 'Перемога! 🎉';
      this.gameStatusElement.className = 'stat-value win-animation';
    } else {
      gameState.status = 'lose';
      this.gameStatusElement.textContent = 'Поразка 💥';
      this.revealAllMines();
    }
  }

  revealAllMines() {
    const { width, height } = gameState.boardDimensions;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (this.board[y][x].isMine) {
          this.board[y][x].state = 'open';
          this.updateCellDisplay(x,y);
        }
      }
    }
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timer++;
      this.updateDisplay();
    }, 1000);
  }

  clearTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }

  updateDisplay() {
    this.minesCountElement.textContent = gameState.mineCount - this.flaggedCount;
    this.timerElement.textContent = this.timer.toString().padStart(3, '0');
  }
}

// Ініціалізація гри при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
  new Minesweeper();

  // --- Ініціалізація прикладу ігрового поля з тестовими значеннями ---
  console.log("Приклад ініціалізації ігрового поля (5x5):");
  const testBoard = [];
  for (let i = 0; i < 5; i++) {
    const row = [];
    for (let j = 0; j < 5; j++) {
      const cell = createCell();
      // Приклад тестових значень
      if ((i + j) % 3 === 0) {
        cell.isMine = true;
      }
      cell.neighborCount = (i + j) % 4;
      row.push(cell);
    }
    testBoard.push(row);
  }
  console.log("Тестова структура поля:", testBoard);
  console.log("Поточний стан гри:", gameState);
});