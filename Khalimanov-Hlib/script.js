// --- Глобальний стан гри ---
let field = [];      // 2D-масив, що представляє ігрове поле
let rows = 16;       // Поточна кількість рядків
let cols = 16;       // Поточна кількість стовпців
let mines = 40;      // Поточна кількість мін

let gameOver = false;    // Чи гра завершена
let cellsOpened = 0;   // Лічильник відкритих клітинок (для перемоги)
let flagsPlaced = 0;   // Лічильник встановлених прапорців
let timerId = null;    // ID для setInterval
let time = 0;          // Лічильник часу гри в секундах

// --- Отримання DOM-елементів з index.html ---
const difficultySelect = document.getElementById('difficulty');
const customSettings = document.getElementById('customSettings');
const customWidthInput = document.getElementById('customWidth');
const customHeightInput = document.getElementById('customHeight');
const customMinesInput = document.getElementById('customMines');
const newGameBtn = document.getElementById('newGameBtn');

// Нові DOM-елементи для завдань 2, 3, 4
const gameBoard = document.getElementById('gameBoard');
const minesCountEl = document.getElementById('minesCount');
const timerEl = document.getElementById('timer');
const gameStatusEl = document.getElementById('gameStatus');

// --- Ініціалізація гри ---
document.addEventListener('DOMContentLoaded', () => {
  // Додаємо обробники подій до елементів керування
  difficultySelect.addEventListener('change', handleDifficultyChange);
  newGameBtn.addEventListener('click', newGame);

  // Починаємо нову гру з налаштуваннями за замовчуванням
  newGame();
});

/**
 * Обробляє зміну рівня складності.
 */
function handleDifficultyChange() {
  const level = difficultySelect.value;
  if (level === 'custom') {
    customSettings.style.display = 'flex';
  } else {
    customSettings.style.display = 'none';
  }
}

/**
 * Отримує налаштування гри (розмір, міни) з DOM.
 */
function getGameSettings() {
  const level = difficultySelect.value;
  switch (level) {
    case 'beginner':
      return { row: 9, col: 9, mines: 10 };
    case 'intermediate':
      return { row: 16, col: 16, mines: 40 };
    case 'expert':
      return { row: 16, col: 30, mines: 99 };
    case 'custom':
      const r = parseInt(customHeightInput.value) || 16;
      const c = parseInt(customWidthInput.value) || 16;
      let m = parseInt(customMinesInput.value) || 40;

      if (m >= r * c) {
        m = r * c - 1;
        console.warn(`Кількість мін зависока. Зменшено до ${m}`);
      }
      return { row: r, col: c, mines: m };
    default:
      return { row: 16, col: 16, mines: 40 }; // Fallback
  }
}

/**
 * Починає нову гру: скидає стан та генерує нове поле.
 */
function newGame() {
  console.log("--- 🚀 ПОЧАТОК НОВОЇ ГРИ ---");
  stopTimer();

  const settings = getGameSettings();
  rows = settings.row;
  cols = settings.col;
  mines = settings.mines;

  // Скидаємо стан гри
  gameOver = false;
  cellsOpened = 0;
  flagsPlaced = 0;
  time = 0;

  // --- Завдання 2: Динамічне відображення ---
  updateGameStatus('Готовий 😎');
  updateMinesCount();
  updateTimer(); // Скидаємо таймер на 000
  gameBoard.classList.remove('win-animation'); // Знімаємо анімацію перемоги

  // Генеруємо логічне поле
  field = generateField(rows, cols, mines);

  // --- Завдання 1: Рендеринг ігрового поля ---
  renderBoard();

  // Запускаємо таймер
  startTimer();
}

// -------------------------------------------------------------------
// --- ЗАВДАННЯ 1: Рендеринг ігрового поля ---
// -------------------------------------------------------------------
/**
 * Створює та відображає ігрове поле в DOM.
 */
function renderBoard() {
  gameBoard.innerHTML = ''; // Очищуємо попереднє поле

  // Налаштовуємо CSS Grid для нашого поля
  gameBoard.style.display = 'grid';
  // Використовуємо 30px, як задано у styles.css
  gameBoard.style.gridTemplateColumns = `repeat(${cols}, 30px)`;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = field[r][c];
      const cellEl = document.createElement('div');
      cellEl.classList.add('cell');

      // --- Завдання 3: Обробка подій кліків ---

      // Лівий клік
      cellEl.addEventListener('click', () => {
        if (gameOver || cell.isRevealed || cell.isFlagged) return;
        openCell(r, c);
        renderBoard(); // Перемальовуємо поле після зміни стану
      });

      // Правий клік (встановити прапор)
      cellEl.addEventListener('contextmenu', (e) => {
        e.preventDefault(); // Забороняємо стандартне контекстне меню
        if (gameOver || cell.isRevealed) return;
        toggleFlag(r, c);
        renderBoard(); // Перемальовуємо поле після зміни стану
      });

      // --- Візуалізація стану клітинки ---
      if (cell.isRevealed) {
        cellEl.classList.add('revealed');
        if (cell.isMine) {
          cellEl.classList.add('mine');
          cellEl.textContent = '💣';
        } else if (cell.neighbourMines > 0) {
          cellEl.textContent = cell.neighbourMines;
          cellEl.setAttribute('data-count', cell.neighbourMines);
        }
      } else if (cell.isFlagged) {
        cellEl.classList.add('flagged');
        cellEl.textContent = '🚩';
      }

      gameBoard.appendChild(cellEl);
    }
  }
}


// --- Логіка гри ---

function generateField(rows, cols, mines) {
  let newField = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      neighbourMines: 0
    }))
  );

  let minesPlaced = 0;
  while (minesPlaced < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!newField[r][c].isMine) {
      newField[r][c].isMine = true;
      minesPlaced++;
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!newField[r][c].isMine) {
        newField[r][c].neighbourMines = countNeighbourMines(newField, r, c);
      }
    }
  }
  return newField;
}

function countNeighbourMines(field, row, col) {
  let count = 0;
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      const newRow = row + i;
      const newCol = col + j;
      if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
        if (field[newRow][newCol].isMine) {
          count++;
        }
      }
    }
  }
  return count;
}

function openCell(row, col) {
  // Перевірки винесені в обробник кліку
  const cell = field[row][col];

  if (cell.isMine) {
    // --- Завдання 4: Реалізація логіки завершення гри (Програш) ---
    gameOver = true;
    stopTimer();
    updateGameStatus('Програш 💥');
    revealAllMines(); // Показуємо всі міни
    return; // Більше не відкриваємо
  }

  cell.isRevealed = true;
  cellsOpened++;

  if (cell.neighbourMines === 0) {
    // Рекурсивне відкриття сусідів
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        const newRow = row + i;
        const newCol = col + j;
        // Перевірка, чи не вийшли ми за межі + чи не відкрита вже
        if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols && !field[newRow][newCol].isRevealed) {
          openCell(newRow, newCol);
        }
      }
    }
  }

  checkWinCondition();
}

/**
 * Перевіряє, чи досягнута умова перемоги.
 */
function checkWinCondition() {
  const totalNonMines = (rows * cols) - mines;
  if (cellsOpened === totalNonMines) {
    // --- Завдання 4: Реалізація логіки завершення гри (Виграш) ---
    console.log("🎉 ПЕРЕМОГА!");
    gameOver = true;
    stopTimer();
    updateGameStatus('Перемога! 🎉');
    gameBoard.classList.add('win-animation'); // Додаємо анімацію з CSS
  }
}

/**
 * Встановлює/знімає прапорець.
 */
function toggleFlag(row, col) {
  const cell = field[row][col];

  cell.isFlagged = !cell.isFlagged;

  if (cell.isFlagged) {
    flagsPlaced++;
  } else {
    flagsPlaced--;
  }

  // --- Завдання 2: Динамічне відображення (лічильник мін) ---
  updateMinesCount();
}

/**
 * Запускає таймер гри.
 */
function startTimer() {
  if (timerId) {
    clearInterval(timerId);
  }

  timerId = setInterval(() => {
    time++;
    // --- Завдання 2: Динамічне відображення (таймер) ---
    updateTimer();
  }, 1000);
}

/**
 * Зупиняє таймер гри.
 */
function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

// -------------------------------------------------------------------
// --- НОВІ ДОПОМІЖНІ ФУНКЦІЇ ДЛЯ DOM ---
// -------------------------------------------------------------------

/**
 * Оновлює текст лічильника мін (Завдання 2)
 */
function updateMinesCount() {
  minesCountEl.textContent = mines - flagsPlaced;
}

/**
 * Оновлює текст таймера (Завдання 2)
 */
function updateTimer() {
  timerEl.textContent = time.toString().padStart(3, '0');
}

/**
 * Оновлює текст статусу гри (Завдання 2)
 */
function updateGameStatus(status) {
  gameStatusEl.textContent = status;
}

/**
 * Показує всі міни при програші (Завдання 4)
 */
function revealAllMines() {
  // Ми не перемальовуємо дошку тут,
  // ми просто оновлюємо стан нашого 'field'.
  // 'renderBoard()' буде викликаний один раз в обробнику кліку.
  field.forEach(row => {
    row.forEach(cell => {
      if (cell.isMine) {
        cell.isRevealed = true; // Примусово відкриваємо міни
      }
    });
  });
}