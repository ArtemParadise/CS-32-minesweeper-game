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
  for (let directionRow = -1; directionRow <= 1; directionRow++) {
    for (let directionCol = -1; directionCol <= 1; directionCol++) {
      if (directionRow === 0 && directionCol === 0) continue;
      const neighbourRow = row + directionRow;
      const neighbourCol = col + directionCol;
      if (neighbourRow >= 0 && neighbourRow < rows && neighbourCol >= 0 && neighbourCol < cols) {
        if (field[neighbourRow][neighbourCol].hasMine) count++;
      }
    }
  }
  return count;
}


function checkWin(game) {
  let opened = 0;
  const totalCells = game.rows * game.cols;
  const safeCells = totalCells - game.minesCount;

  for (let r = 0; r < game.rows; r++) {
    for (let c = 0; c < game.cols; c++) {
      if (game.field[r][c].state === "open" && !game.field[r][c].hasMine) {
        opened++;
      }
    }
  }

  if (opened === safeCells) {
    game.status = "win";
    stopTimer();
    setTimeout(() => {
      console.log("🏆 ВИГРАШ! Усі безпечні клітинки відкрито!");
      alert("Ти виграв. Всі безпечні клітинки відкрито. Для нової гри нажми кнопку PLAY.");
  }, 50); // 50 мс зазвичай достатньо
  }
}

function openCell(game, row, col) {
  if (timerId === null) startTimer();
  const cell = game.field[row][col];
  if (cell.state !== "closed" || game.status !== "in_progress") return;
  if (cell.hasMine) {
    cell.state = "open";
    game.status = "lose";
    stopTimer(); // зупиняємо таймер після програшу
    // 🔹 Відкрити всі міни
    for (let r = 0; r < game.rows; r++) {
      for (let c = 0; c < game.cols; c++) {
        const currentCell = game.field[r][c];
        if (currentCell.hasMine) {
          currentCell.state = "open";
        }
      }
    }
    
    setTimeout(() => {
      console.log("💥 Гравець програв!");
      alert("Ти програв. Для нової гри нажми кнопку PLAY.");
    }, 50);

    return;
  }
  cell.state = "open";
  if (cell.adjacentMines === 0) {
    for (let directionRow = -1; directionRow <= 1; directionRow++) {
      for (let directionCol = -1; directionCol <= 1; directionCol++) {
        if (directionRow === 0 && directionCol === 0) continue;
        const neighbourRow = row + directionRow;
        const neighbourCol = col + directionCol;
        if (neighbourRow >= 0 && neighbourRow < game.rows && neighbourCol >= 0 && neighbourCol < game.cols) {
          openCell(game, neighbourRow, neighbourCol);
        }
      }
    }
  }
  // 🔹 Перевірка на виграш після відкриття клітинки
  if (checkWin(game)) {
    game.status = "win";
    stopTimer();
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






// === ФУНКЦІЯ РЕНДЕРИНГУ ІГРОВОГО ПОЛЯ ===
function renderGameField(game) {
  const grid = document.querySelector('.grid');
  if (!grid || !game) return;

  // Очищуємо попереднє поле
  grid.innerHTML = '';
  
  // Проходимо по всіх клітинках ігрового поля
  for (let r = 0; r < game.rows; r++) {
    for (let c = 0; c < game.cols; c++) {
      // Створюємо HTML елемент клітинки
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      
      // Отримуємо дані клітинки з ігрового стану
      const gameCell = game.field[r][c];
      
      // Визначаємо стан клітинки та додаємо відповідні класи
      if (gameCell.state === "open") {
        cell.classList.add('open');
        if (gameCell.hasMine) {
          // Якщо це міна - показуємо символ міни
          cell.classList.add('mine');
          cell.innerHTML = '💣';
        } else if (gameCell.adjacentMines > 0) {
          // Якщо є сусідні міни - показуємо їх кількість
          cell.classList.add(`num-${gameCell.adjacentMines}`);
          cell.textContent = gameCell.adjacentMines;
        }
      } else if (gameCell.state === "flagged") {
        // Якщо клітинка позначена прапорцем
        cell.classList.add('flag');
        cell.innerHTML = '🚩';
      } else {
        // Якщо клітинка закрита
        cell.classList.add('closed');
      }
      
      // Додаємо клітинку до сітки
      grid.appendChild(cell);
    }
  }
}


// === ГЛОБАЛЬНА ЗМІННА ГРИ ===
let game = null;

// === ФУНКЦІЯ ДЛЯ ПОЧАТКУ НОВОЇ ГРИ ===
function startNewGame() {
  game = createGameState(9, 9, 5);        // створюємо ігровий стан
  game.field = generateField(game.rows, game.cols, game.minesCount); // генеруємо поле
  // Обнуляємо лічильник прапорців
  flagsLeft = game.minesCount;
  updateFlagsCount();
  renderGameField(game);               // рендеримо поле

  stopTimer();

  // Обнуляємо таймер на панелі
  const timerElement = document.getElementById('timer');
  if (timerElement) timerElement.textContent = String(0).padStart(3, '0');

  console.log("🎮 Нова гра розпочата!");
  console.log("Стан гри:", game);
}

// === СТАРТ ГРИ ПО КНОПЦІ PLAY ===
document.addEventListener('DOMContentLoaded', function() {
  // Знаходимо кнопку за класом (не за ID!)
  const playButton = document.querySelector('.play-btn');
  
  if (playButton) {
    playButton.addEventListener("click", startNewGame);
  }

  // === ОБРОБКА КЛІКІВ ===
  
  // Лівий клік (відкрити клітинку)
  document.querySelector('.grid').addEventListener('click', (e) => {
    const cell = e.target;
    if (!cell.classList.contains('cell') || !game) return;

    // Якщо гра вже завершена — не реагуємо
  if (game.status !== "in_progress") return;

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    openCell(game, row, col); // відкриваємо клітинку
    renderGameField(game);    // перемальовуємо після змін
  });

  // Правий клік (поставити/зняти прапорець)
  document.querySelector('.grid').addEventListener('contextmenu', (e) => {
    e.preventDefault(); // відміняємо стандартне контекстне меню

    const cell = e.target;
    if (!cell.classList.contains('cell') || !game) return;

    // Блокуємо, якщо гра завершена
  if (game.status !== "in_progress") return;

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    toggleFlag(game, row, col); // ставимо або знімаємо прапорець
    renderGameField(game);      // перемальовуємо після змін
  });
});

let flagsLeft = 5; //  кількість мін на полі

function updateFlagsCount() {
  const flagsElement = document.getElementById('flags-count');
  if (flagsElement) {
    // Виводимо три цифри з ведучими нулями
    flagsElement.textContent = String(flagsLeft).padStart(3, '0');
  }
}

function toggleFlag(game, row, col) {
  const cell = game.field[row][col];

  if (cell.state === "closed" && flagsLeft > 0) {
    cell.state = "flagged";
    flagsLeft--;
  } else if (cell.state === "flagged") {
    cell.state = "closed";
    flagsLeft++;
  }

  updateFlagsCount(); // оновлюємо лічильник прапорців
  console.log(
    `toggleFlag: cell [${row},${col}] now is "${cell.state}", flagsLeft=${flagsLeft}`
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

    const timerElement = document.getElementById('timer'); // беремо елемент всередині інтервалу
    if (timerElement) {
      timerElement.textContent = String(seconds).padStart(3, '0');
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
  console.log("⏹️ Таймер зупинено на", seconds, "сек");
}