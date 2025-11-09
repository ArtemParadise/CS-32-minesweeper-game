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
// Ми прив'яжемо логіку до кнопок, щоб можна було почати гру
const difficultySelect = document.getElementById('difficulty');
const customSettings = document.getElementById('customSettings');
const customWidthInput = document.getElementById('customWidth');
const customHeightInput = document.getElementById('customHeight');
const customMinesInput = document.getElementById('customMines');
const newGameBtn = document.getElementById('newGameBtn');

// --- Ініціалізація гри ---
// Цей код виконається, коли сторінка (DOM) завантажиться
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM завантажено. Налаштування логіки гри.");

  // Додаємо обробники подій до елементів керування
  difficultySelect.addEventListener('change', handleDifficultyChange);
  newGameBtn.addEventListener('click', newGame);

  // Починаємо нову гру з налаштуваннями за замовчуванням
  newGame();
});

/**
 * Обробляє зміну рівня складності, показуючи/ховаючи кастомні налаштування.
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
      return { r: 9, c: 9, m: 10 };
    case 'intermediate':
      return { r: 16, c: 16, m: 40 };
    case 'expert':
      return { r: 16, c: 30, m: 99 };
    case 'custom':
      const r = parseInt(customHeightInput.value) || 16;
      const c = parseInt(customWidthInput.value) || 16;
      let m = parseInt(customMinesInput.value) || 40;

      // Валідація: мін не може бути більше, ніж клітинок (мінус одна)
      if (m >= r * c) {
        m = r * c - 1;
        console.warn(`Кількість мін зависока. Зменшено до ${m}`);
      }
      return { r, c, m };
    default:
      return { r: 16, c: 16, m: 40 }; // Fallback
  }
}

/**
 * Починає нову гру: скидає стан та генерує нове поле.
 */
function newGame() {
  console.log("--- 🚀 ПОЧАТОК НОВОЇ ГРИ ---");
  stopTimer(); // Завдання 5

  // Отримуємо налаштування
  const settings = getGameSettings();
  rows = settings.r;
  cols = settings.c;
  mines = settings.m;

  // Скидаємо стан гри
  gameOver = false;
  cellsOpened = 0;
  flagsPlaced = 0;
  time = 0;

  console.log(`Налаштування: ${rows}x${cols}, ${mines} мін`);
  console.log("UI Update (simulated): Status -> 'Граємо'");
  console.log(`UI Update (simulated): Mines -> ${mines - flagsPlaced}`);

  // --- Завдання 1: Генерація ігрового поля ---
  console.log("Завдання 1: Генерація поля...");
  field = generateField(rows, cols, mines);

  // Очікуваний результат 1:
  console.log("Очікуваний результат (Завдання 1): Поле згенеровано.");
  // Для візуалізації відповіді виводимо "карту" в консоль
  const solutionGrid = field.map(row =>
    row.map(cell => cell.isMine ? '💣' : cell.neighbourMines)
  );
  console.log("Карта розв'язку (для перевірки):");
  console.table(solutionGrid);

  // --- Завдання 5: Логіка таймера ---
  startTimer();
}

// -------------------------------------------------------------------
// --- ЗАВДАННЯ 1: Генерація ігрового поля ---
// -------------------------------------------------------------------
/**
 * @param {number} rows - Кількість рядків
 * @param {number} cols - Кількість стовпців
 * @param {number} mines - Кількість мін
 * @returns {Array<Array<Object>>} - Двовимірний масив (поле)
 */
function generateField(rows, cols, mines) {
  // 1. Створюємо пусте поле
  let newField = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      neighbourMines: 0
    }))
  );

  // 2. Розставляємо міни
  let minesPlaced = 0;
  while (minesPlaced < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);

    if (!newField[r][c].isMine) {
      newField[r][c].isMine = true;
      minesPlaced++;
    }
  }

  // 3. Розраховуємо сусідні міни (використовуючи Завдання 2)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!newField[r][c].isMine) {
        // --- Завдання 2: Підрахунок мін (використання) ---
        newField[r][c].neighbourMines = countNeighbourMines(newField, r, c);
      }
    }
  }

  return newField;
}

// -------------------------------------------------------------------
// --- ЗАВДАННЯ 2: Підрахунок кількості мін навколо клітинки ---
// -------------------------------------------------------------------
/**
 * @param {Array<Array<Object>>} field - Ігрове поле
 * @param {number} row - Рядок клітинки
 * @param {number} col - Стовпець клітинки
 * @returns {number} - Кількість мін навколо
 */
function countNeighbourMines(field, row, col) {
  let count = 0;

  // Перебираємо 8 сусідніх клітинок + саму себе
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue; // Пропускаємо саму себе

      const newRow = row + i;
      const newCol = col + j;

      // Перевірка, чи не вийшли ми за межі поля
      if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
        if (field[newRow][newCol].isMine) {
          count++;
        }
      }
    }
  }
  return count;
}

// -------------------------------------------------------------------
// --- ЗАВДАННЯ 3: Відкриття клітинки ---
// -------------------------------------------------------------------
/**
 * @param {number} row - Рядок
 * @param {number} col - Стовпець
 */
function openCell(row, col) {
  console.log(`Спроба відкрити клітинку (${row}, ${col})`);

  // Перевірка виходу за межі поля
  if (row < 0 || row >= rows || col < 0 || col >= cols) {
    return;
  }

  const cell = field[row][col];

  // Не можна відкрити, якщо гра закінчена, клітинка відкрита або з прапорцем
  if (gameOver || cell.isRevealed || cell.isFlagged) {
    console.log("...Відкриття неможливе (гра завершена, відкрито або прапорець).");
    return;
  }

  // Відкриваємо клітинку
  cell.isRevealed = true;

  // --- Логіка стану гри ---
  if (cell.isMine) {
    // а) якщо клітинка з міною → стан гри = програш
    console.error("💥 БУМ! Гру програно.");
    gameOver = true;
    stopTimer();
    console.log("UI Update (simulated): Status -> 'Програш'");
    // (Тут буде логіка показу всіх мін)
  } else {
    // б) якщо клітинка без міни → клітинка відкривається
    cellsOpened++;
    console.log(`...Клітинку відкрито. Сусідніх мін: ${cell.neighbourMines}`);

    // ...а у випадку 0 рекурсивно відкриваються сусідні
    if (cell.neighbourMines === 0) {
      console.log("...Це нуль. Рекурсивне відкриття сусідів...");
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue;
          openCell(row + i, col + j); // Рекурсивний виклик
        }
      }
    }

    // Перевірка на перемогу
    checkWinCondition();
  }

  // Очікуваний результат 3: (див. у консолі після виклику)
}

/**
 * Перевіряє, чи досягнута умова перемоги.
 */
function checkWinCondition() {
  const totalNonMines = (rows * cols) - mines;
  if (cellsOpened === totalNonMines) {
    console.log("🎉 ПЕРЕМОГА! Всі безпечні клітинки відкрито.");
    gameOver = true;
    stopTimer();
    console.log("UI Update (simulated): Status -> 'Перемога!'");
  }
}

// -------------------------------------------------------------------
// --- ЗАВДАННЯ 4: Встановлення/зняття прапорця ---
// -------------------------------------------------------------------
/**
 * @param {number} row - Рядок
 * @param {number} col - Стовпець
 */
function toggleFlag(row, col) {
  console.log(`Спроба поставити/зняти прапор на (${row}, ${col})`);

  // Перевірка виходу за межі поля
  if (row < 0 || row >= rows || col < 0 || col >= cols) {
    return;
  }

  const cell = field[row][col];

  // Не можна ставити прапор, якщо гра закінчена або клітинка відкрита
  if (gameOver || cell.isRevealed) {
    console.log("...Неможливо (гра завершена або клітинку відкрито).");
    return;
  }

  // Перемикаємо стан прапорця
  cell.isFlagged = !cell.isFlagged;

  if (cell.isFlagged) {
    flagsPlaced++;
  } else {
    flagsPlaced--;
  }

  // Очікуваний результат 4:
  console.log(`...Стан isFlagged: ${cell.isFlagged}.`);
  console.log(`UI Update (simulated): Mines -> ${mines - flagsPlaced}`);
}

// -------------------------------------------------------------------
// --- ЗАВДАННЯ 5: Логіка таймера ---
// -------------------------------------------------------------------

/**
 * Запускає таймер гри.
 */
function startTimer() {
  // Зупиняємо попередній таймер, якщо він є
  if (timerId) {
    clearInterval(timerId);
  }

  time = 0;
  console.log("Таймер запущено.");
  console.log(`Time: ${time}`); // Початковий вивід

  timerId = setInterval(() => {
    time++;
    // Очікуваний результат 5:
    const formattedTime = time.toString().padStart(3, '0');
    console.log(`Time: ${formattedTime}`);
    // (Тут буде оновлення DOM: document.getElementById('timer').textContent = formattedTime;)
  }, 1000);
}

/**
 * Зупиняє таймер гри.
 */
function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
    console.log(`Таймер зупинено на ${time} сек.`);
  }
}