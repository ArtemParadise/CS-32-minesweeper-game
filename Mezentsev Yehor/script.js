/*
  Лабораторна робота №3
  Реалізація логіки гри Minesweeper
*/

const CELL_STATE = {
    CLOSED: 'closed',
    OPENED: 'opened',
    FLAGGED: 'flagged'
};

const GAME_STATUS = {
    IN_PROGRESS: 'in-progress',
    WON: 'won',
    LOST: 'lost'
};

// Глобальний об'єкт гри
let gameState = {
    field: [],
    rows: 0,
    cols: 0,
    minesCount: 0,
    status: GAME_STATUS.IN_PROGRESS,
    flagsCount: 0
};

// Змінні для таймера
let timerInterval = null;
let timeElapsed = 0;

/**
 * 1. Генерація ігрового поля
 * Створює двовимірний масив та розставляє міни випадковим чином.
 */
function generateField(rows, cols, mines) {
    gameState.rows = rows;
    gameState.cols = cols;
    gameState.minesCount = mines;
    gameState.status = GAME_STATUS.IN_PROGRESS;
    gameState.flagsCount = 0;
    gameState.field = [];

    // Створення порожніх клітинок
    for (let y = 0; y < rows; y++) {
        const row = [];
        for (let x = 0; x < cols; x++) {
            row.push({
                isMine: false,
                state: CELL_STATE.CLOSED,
                neighborCount: 0,
                x: x,
                y: y
            });
        }
        gameState.field.push(row);
    }

    // Випадкова розстановка мін
    let minesPlaced = 0;
    while (minesPlaced < mines) {
        const randY = Math.floor(Math.random() * rows);
        const randX = Math.floor(Math.random() * cols);

        if (!gameState.field[randY][randX].isMine) {
            gameState.field[randY][randX].isMine = true;
            minesPlaced++;
        }
    }

    // Попередній підрахунок сусідів (опціонально, але зручно для налагодження)
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (!gameState.field[y][x].isMine) {
                gameState.field[y][x].neighborCount = countNeighbourMines(gameState.field, y, x);
            }
        }
    }

    console.log("Поле згенеровано:", gameState.field);
    return gameState.field;
}

/**
 * 2. Підрахунок кількості мін навколо клітинки
 */
function countNeighbourMines(field, row, col) {
    let count = 0;
    // Перевіряємо всі сусідні клітинки (від -1 до +1 по обох осях)
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dy === 0 && dx === 0) continue; // Пропускаємо саму клітинку

            const ny = row + dy;
            const nx = col + dx;

            // Перевірка меж поля
            if (ny >= 0 && ny < gameState.rows && nx >= 0 && nx < gameState.cols) {
                if (field[ny][nx].isMine) {
                    count++;
                }
            }
        }
    }
    return count;
}

/**
 * 3. Відкриття клітинки (з рекурсією)
 */
function openCell(row, col) {
    // Перевірка меж та стану гри
    if (row < 0 || row >= gameState.rows || col < 0 || col >= gameState.cols) return;
    if (gameState.status !== GAME_STATUS.IN_PROGRESS) return;

    const cell = gameState.field[row][col];

    // Якщо клітинка вже відкрита або має прапорець - нічого не робимо
    if (cell.state !== CELL_STATE.CLOSED) return;

    // Якщо це міна -> Програш
    if (cell.isMine) {
        cell.state = CELL_STATE.OPENED; // Показати міну
        gameState.status = GAME_STATUS.LOST;
        stopTimer();
        console.log("БУМ! Ви програли.");
        return;
    }

    // Відкриваємо клітинку
    cell.state = CELL_STATE.OPENED;
    
    // Якщо у клітинки 0 мін навколо -> відкриваємо сусідів (Рекурсія)
    if (cell.neighborCount === 0) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dy !== 0 || dx !== 0) {
                    openCell(row + dy, col + dx);
                }
            }
        }
    }
    
    // Перевірка на перемогу (можна додати пізніше, але логічно тут)
    // checkWinCondition(); 

    console.log(`Відкрито клітинку [${row}, ${col}]. Стан гри: ${gameState.status}`);
}

/**
 * 4. Встановлення/зняття прапорця
 */
function toggleFlag(row, col) {
    if (gameState.status !== GAME_STATUS.IN_PROGRESS) return;
    
    const cell = gameState.field[row][col];

    if (cell.state === CELL_STATE.CLOSED) {
        cell.state = CELL_STATE.FLAGGED;
        gameState.flagsCount++;
        console.log(`Прапорець встановлено на [${row}, ${col}]`);
    } else if (cell.state === CELL_STATE.FLAGGED) {
        cell.state = CELL_STATE.CLOSED;
        gameState.flagsCount--;
        console.log(`Прапорець знято з [${row}, ${col}]`);
    }
}

/**
 * 5. Логіка таймера
 */
function startTimer() {
    stopTimer(); // Скидаємо попередній, якщо був
    timeElapsed = 0;
    console.log("Таймер запущено.");
    
    timerInterval = setInterval(() => {
        timeElapsed++;
        console.log(`Час: ${timeElapsed} сек.`);
        // Тут пізніше буде оновлення DOM
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        console.log(`Таймер зупинено. Всього часу: ${timeElapsed} сек.`);
    }
}

// === ТЕСТОВИЙ ЗАПУСК (для перевірки в консолі) ===
console.log("Лабораторна №3: Логіка завантажена.");
console.log("В консолі: generateField(9, 9, 10)");
console.log("startTimer()");
console.log("openCell(0, 0) або toggleFlag(1, 1)");