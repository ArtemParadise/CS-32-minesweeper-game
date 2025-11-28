/*
  Лабораторна робота №4
  Інтеграція логіки Minesweeper з DOM
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

// Конфігурація гри
const CONFIG = {
    rows: 9,
    cols: 9,
    mines: 10
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

// === DOM Елементи ===
const ui = {
    board: document.getElementById('game-board'),
    minesCounter: document.getElementById('mines-count'),
    timer: document.getElementById('timer'),
    restartBtn: document.getElementById('restart-btn')
};

/**
 * Ініціалізація гри при завантаженні сторінки
 */
document.addEventListener('DOMContentLoaded', () => {
    startNewGame();

    // Обробник на кнопку рестарту
    ui.restartBtn.addEventListener('click', startNewGame);

    // Делегування подій для клітинок (Лівий клік)
    ui.board.addEventListener('click', (e) => {
        const cellDiv = e.target.closest('.cell');
        if (!cellDiv) return;

        const x = parseInt(cellDiv.dataset.x);
        const y = parseInt(cellDiv.dataset.y);

        handleLeftClick(y, x);
    });

    // Делегування подій для клітинок (Правий клік - Прапорець)
    ui.board.addEventListener('contextmenu', (e) => {
        e.preventDefault(); // Блокуємо контекстне меню браузера
        const cellDiv = e.target.closest('.cell');
        if (!cellDiv) return;

        const x = parseInt(cellDiv.dataset.x);
        const y = parseInt(cellDiv.dataset.y);

        handleRightClick(y, x);
    });
});

/**
 * Запуск нової гри
 */
function startNewGame() {
    stopTimer();
    timeElapsed = 0;
    updateTimerDisplay();
    
    // Скидаємо смайлик
    ui.restartBtn.textContent = '🙂';

    // Генеруємо логічне поле
    generateField(CONFIG.rows, CONFIG.cols, CONFIG.mines);
    
    // Малюємо поле в HTML
    renderBoard();
    updateMinesCounter();
    
    startTimer();
}

/**
 * 1. Генерація ігрового поля (Логіка)
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

    // Підрахунок сусідів
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (!gameState.field[y][x].isMine) {
                gameState.field[y][x].neighborCount = countNeighbourMines(gameState.field, y, x);
            }
        }
    }
}

/**
 * 2. Рендеринг поля (Відображення)
 */
function renderBoard() {
    ui.board.innerHTML = ''; // Очищення попереднього поля
    
    // Налаштування CSS Grid під розмір поля
    ui.board.style.gridTemplateColumns = `repeat(${gameState.cols}, 20px)`;

    for (let y = 0; y < gameState.rows; y++) {
        for (let x = 0; x < gameState.cols; x++) {
            const cellData = gameState.field[y][x];
            const cellDiv = document.createElement('div');
            
            cellDiv.classList.add('cell');
            cellDiv.dataset.x = x;
            cellDiv.dataset.y = y;

            // Додаємо класи відповідно до стану
            if (cellData.state === CELL_STATE.CLOSED) {
                cellDiv.classList.add('closed');
            } else if (cellData.state === CELL_STATE.FLAGGED) {
                cellDiv.classList.add('flagged');
                cellDiv.textContent = '🚩'; // Прапорець
            } else if (cellData.state === CELL_STATE.OPENED) {
                cellDiv.classList.add('opened');
                if (cellData.isMine) {
                    cellDiv.classList.add('mine-triggered');
                    cellDiv.textContent = '💥';
                } else if (cellData.neighborCount > 0) {
                    cellDiv.classList.add(`num${cellData.neighborCount}`);
                    cellDiv.textContent = cellData.neighborCount;
                }
            }

            ui.board.appendChild(cellDiv);
        }
    }
}

/**
 * Допоміжна функція підрахунку мін
 */
function countNeighbourMines(field, row, col) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dy === 0 && dx === 0) continue;
            const ny = row + dy;
            const nx = col + dx;
            if (ny >= 0 && ny < gameState.rows && nx >= 0 && nx < gameState.cols) {
                if (field[ny][nx].isMine) count++;
            }
        }
    }
    return count;
}

/**
 * 3. Обробка Лівого Кліку (Відкриття)
 */
function handleLeftClick(row, col) {
    if (gameState.status !== GAME_STATUS.IN_PROGRESS) return;
    
    const cell = gameState.field[row][col];
    
    // Не можна відкрити прапорець
    if (cell.state === CELL_STATE.FLAGGED) return;

    // Логіка відкриття
    openCellRecursive(row, col);
    
    // Перевірка на перемогу
    checkWinCondition();
    
    // Оновлюємо вигляд
    renderBoard();

    // Якщо програли
    if (gameState.status === GAME_STATUS.LOST) {
        gameOver(false);
    }
}

/**
 * Рекурсивне відкриття клітинок
 */
function openCellRecursive(row, col) {
    if (row < 0 || row >= gameState.rows || col < 0 || col >= gameState.cols) return;
    const cell = gameState.field[row][col];
    
    if (cell.state !== CELL_STATE.CLOSED) return;

    cell.state = CELL_STATE.OPENED;

    if (cell.isMine) {
        gameState.status = GAME_STATUS.LOST;
        return;
    }

    // Якщо пуста клітинка, відкриваємо сусідів
    if (cell.neighborCount === 0) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dy !== 0 || dx !== 0) {
                    openCellRecursive(row + dy, col + dx);
                }
            }
        }
    }
}

/**
 * 4. Обробка Правого Кліку (Прапорець)
 */
function handleRightClick(row, col) {
    if (gameState.status !== GAME_STATUS.IN_PROGRESS) return;

    const cell = gameState.field[row][col];

    if (cell.state === CELL_STATE.CLOSED) {
        if (gameState.flagsCount < gameState.minesCount) {
            cell.state = CELL_STATE.FLAGGED;
            gameState.flagsCount++;
        }
    } else if (cell.state === CELL_STATE.FLAGGED) {
        cell.state = CELL_STATE.CLOSED;
        gameState.flagsCount--;
    }

    updateMinesCounter();
    
    // Оновлюємо лише одну клітинку візуально (оптимізація), або все поле
    renderBoard(); 
}

/**
 * 5. Логіка завершення гри
 */
function checkWinCondition() {
    if (gameState.status === GAME_STATUS.LOST) return;

    let openedCount = 0;
    const totalCells = gameState.rows * gameState.cols;
    const safeCells = totalCells - gameState.minesCount;

    for (let y = 0; y < gameState.rows; y++) {
        for (let x = 0; x < gameState.cols; x++) {
            if (gameState.field[y][x].state === CELL_STATE.OPENED && !gameState.field[y][x].isMine) {
                openedCount++;
            }
        }
    }

    if (openedCount === safeCells) {
        gameState.status = GAME_STATUS.WON;
        gameOver(true);
    }
}

function gameOver(isWin) {
    stopTimer();
    ui.restartBtn.textContent = isWin ? '😎' : '😵'; // Змінюємо смайлик
    
    if (!isWin) {
        // Показати всі міни при програші
        revealAllMines();
        renderBoard();
    } else {
        alert("Вітаємо! Ви виграли!");
    }
}

function revealAllMines() {
    for (let y = 0; y < gameState.rows; y++) {
        for (let x = 0; x < gameState.cols; x++) {
            const cell = gameState.field[y][x];
            if (cell.isMine) {
                cell.state = CELL_STATE.OPENED;
            }
        }
    }
}

/**
 * 6. Таймер та Лічильники
 */
function updateMinesCounter() {
    const remaining = gameState.minesCount - gameState.flagsCount;
    // Форматування числа (наприклад, 005)
    ui.minesCounter.textContent = remaining.toString().padStart(3, '0');
}

function startTimer() {
    stopTimer();
    timeElapsed = 0;
    timerInterval = setInterval(() => {
        timeElapsed++;
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimerDisplay() {
    // Обмежуємо 999 секундами 
    const displayTime = Math.min(timeElapsed, 999);
    ui.timer.textContent = displayTime.toString().padStart(3, '0');
}