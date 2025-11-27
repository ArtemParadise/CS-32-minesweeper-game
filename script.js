const CellState = {
    CLOSED: 'closed',
    OPENED: 'opened',
    FLAGGED: 'flagged'
};

class Cell {
    constructor(row, col) {
        this.isMine = false;
        this.neighborMines = 0;
        this.state = CellState.CLOSED;
        this.row = row;
        this.col = col;
    }
}

const GameStatus = {
    IN_PROGRESS: 'in_progress',
    WON: 'won',
    LOST: 'lost'
};

class GameState {
    constructor(rows, cols, mines) {
        this.rows = rows;
        this.cols = cols;
        this.mines = mines;
        this.status = GameStatus.IN_PROGRESS;
        this.board = this.initializeBoard(rows, cols);
        this.timerInterval = null; // Для логіки таймера
        this.timeElapsed = 0;      // Секунди від початку гри
    }

    initializeBoard(rows, cols) {
        const board = [];
        for (let r = 0; r < rows; r++) {
            board[r] = [];
            for (let c = 0; c < cols; c++) {
                board[r][c] = new Cell(r, c);
            }
        }
        return board;
    }
}

// Глобальна змінна для збереження стану гри
let game;

/**
 * Генерація ігрового поля з випадковим розташуванням мін.
 * Повертає двовимірний масив (board) з розміщеними мінами.
 * * @param {number} rows - Кількість рядків.
 * @param {number} cols - Кількість стовпців.
 * @param {number} mines - Кількість мін.
 * @returns {Cell[][]} - Двовимірний масив клітинок.
 */
function generateField(rows, cols, mines) {
    // Ініціалізуємо стан гри
    game = new GameState(rows, cols, mines);
    const board = game.board;

    // Створюємо список усіх можливих позицій
    const allPositions = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            allPositions.push({ r, c });
        }
    }

    // Випадковий вибір позицій для мін
    for (let i = 0; i < mines; i++) {
        // Обираємо випадковий індекс
        const randomIndex = Math.floor(Math.random() * allPositions.length);
        const { r, c } = allPositions.splice(randomIndex, 1)[0]; // Видаляємо обрану позицію

        // Встановлюємо міну
        board[r][c].isMine = true;
    }

    // Після розміщення мін, підраховуємо сусідні міни для всіх клітинок
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (!board[r][c].isMine) {
                board[r][c].neighborMines = countNeighbourMines(board, r, c);
            }
        }
    }

    // Очікуваний результат: виклик функції → у консолі відображається масив із розташованими мінами.
    console.log(`\n--- 1. Генерація Поля (${rows}x${cols}, ${mines} мін) ---`);
    console.table(board.map(row => row.map(cell => cell.isMine ? '💣' : cell.neighborMines)));

    return board;
}

/**
 * Підраховує кількість мін навколо заданої клітинки.
 * * @param {Cell[][]} field - Двовимірний масив клітинок.
 * @param {number} row - Рядок клітинки.
 * @param {number} col - Стовпець клітинки.
 * @returns {number} - Кількість сусідніх мін (0-8).
 */
function countNeighbourMines(field, row, col) {
    let mineCount = 0;
    const rows = field.length;
    const cols = field[0].length;

    // Перебираємо всі 8 сусідніх клітинок
    for (let r_offset = -1; r_offset <= 1; r_offset++) {
        for (let c_offset = -1; c_offset <= 1; c_offset++) {
            // Пропускаємо саму клітинку
            if (r_offset === 0 && c_offset === 0) continue;

            const newRow = row + r_offset;
            const newCol = col + c_offset;

            // Перевіряємо, чи клітинка знаходиться в межах поля
            if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                if (field[newRow][newCol].isMine) {
                    mineCount++;
                }
            }
        }
    }
    return mineCount;
}

/**
 * Відкриває клітинку та оновлює стан гри.
 * * @param {number} row - Рядок клітинки.
 * @param {number} col - Стовпець клітинки.
 */
function openCell(row, col) {
    if (game.status !== GameStatus.IN_PROGRESS) return;

    const cell = game.board[row][col];

    // Якщо клітинка вже відкрита або має прапорець, нічого не робимо
    if (cell.state === CellState.OPENED || cell.state === CellState.FLAGGED) {
        return;
    }

    // o: якщо клітинка з міною → стан гри = програш;
    if (cell.isMine) {
        cell.state = CellState.OPENED; // Відкриваємо міну
        game.status = GameStatus.LOST;
        stopTimer();
        console.log(`\n--- 3. Відкриття Клітинки (${row}, ${col}) ---`);
        console.log("GAME OVER! Ви натиснули на міну.");
        return;
    }

    // o: якщо клітинка без міни → клітинка відкривається
    cell.state = CellState.OPENED;

    // Перевірка на перемогу після відкриття клітинки
    checkWinCondition();

    // o: у випадку 0 рекурсивно відкриваються сусідні клітинки.
    if (cell.neighborMines === 0) {
        for (let r_offset = -1; r_offset <= 1; r_offset++) {
            for (let c_offset = -1; c_offset <= 1; c_offset++) {
                if (r_offset === 0 && c_offset === 0) continue;

                const newRow = row + r_offset;
                const newCol = col + c_offset;

                if (newRow >= 0 && newRow < game.rows && newCol >= 0 && newCol < game.cols) {
                    // Рекурсивний виклик, тільки якщо сусідня клітинка закрита і не має прапорця
                    const neighborCell = game.board[newRow][newCol];
                    if (neighborCell.state === CellState.CLOSED) {
                        openCell(newRow, newCol);
                    }
                }
            }
        }
    }
}

/**
 * Перевіряє умову перемоги: всі не-міни відкриті.
 */
function checkWinCondition() {
    let closedNonMines = 0;
    const totalCells = game.rows * game.cols;

    for (let r = 0; r < game.rows; r++) {
        for (let c = 0; c < game.cols; c++) {
            const cell = game.board[r][c];
            if (cell.state === CellState.CLOSED && !cell.isMine) {
                closedNonMines++;
            }
        }
    }

    if (closedNonMines === 0 && game.status === GameStatus.IN_PROGRESS) {
        game.status = GameStatus.WON;
        stopTimer();
        console.log("CONGRATULATIONS! Ви виграли гру.");
    }
}

/**
 * Змінює стан клітинки між CLOSED та FLAGGED.
 * * @param {number} row - Рядок клітинки.
 * @param {number} col - Стовпець клітинки.
 */
function toggleFlag(row, col) {
    if (game.status !== GameStatus.IN_PROGRESS) return;

    const cell = game.board[row][col];

    // Можна ставити прапорець лише на закриті клітинки
    if (cell.state === CellState.OPENED) {
        return;
    }

    if (cell.state === CellState.FLAGGED) {
        cell.state = CellState.CLOSED; // Знімаємо прапорець
        console.log(`\n--- 4. Зняття Прапорця (${row}, ${col}) ---`);
    } else {
        cell.state = CellState.FLAGGED; // Встановлюємо прапорець
        console.log(`\n--- 4. Встановлення Прапорця (${row}, ${col}) ---`);
    }

    // Очікуваний результат: після виклику у консолі видно зміну стану
    console.log(`Новий стан клітинки (${row}, ${col}): ${cell.state}`);
}

/**
 * Запускає таймер гри.
 */
function startTimer() {
    if (game.timerInterval) return; // Запобігаємо повторному запуску

    console.log('\n--- 5. Логіка Таймера ---');
    console.log("Таймер запущено.");

    game.timerInterval = setInterval(() => {
        game.timeElapsed++;
        // Очікуваний результат: у консолі відображаються секунди
        console.log(`Час гри: ${game.timeElapsed} секунд`);
    }, 1000);
}

/**
 * Зупиняє таймер гри.
 */
function stopTimer() {
    if (game.timerInterval) {
        clearInterval(game.timerInterval);
        game.timerInterval = null;
        // Очікуваний результат: зупинка після виклику stopTimer().
        console.log(`Таймер зупинено на ${game.timeElapsed} секунді.`);
    }
}

// 1. Тест Генерації поля
generateField(5, 5, 5); // Створюємо поле 5x5 з 5 мінами.

// 2. Тест Підрахунку мін (на полі, щойно згенерованому)
// Знаходимо клітинку без міни (першу, яку знайдемо)
let testRow, testCol;
for(let r=0; r<game.rows; r++) {
    for(let c=0; c<game.cols; c++) {
        if (!game.board[r][c].isMine) {
            testRow = r;
            testCol = c;
            break;
        }
    }
    if (testRow !== undefined) break;
}

if (testRow !== undefined) {
    // Очікуваний результат: у консолі відображається правильне число.
    console.log(`\n--- 2. Підрахунок Сусідніх Мін ---`);
    console.log(`Клітинка (${testRow}, ${testCol}) має сусідніх мін: ${game.board[testRow][testCol].neighborMines}`);
} else {
    console.log("Не вдалося знайти клітинку без міни для тесту підрахунку.");
}

// 5. Тест Таймера
startTimer(); // Запуск таймера

// 4. Тест Встановлення/Зняття Прапорця
toggleFlag(0, 0); // Встановлюємо прапорець на (0, 0)
toggleFlag(0, 0); // Знімаємо прапорець з (0, 0)

// 3. Тест Відкриття Клітинки
openCell(testRow, testCol); // Відкриваємо безпечну клітинку

// 3. Тест Відкриття Клітинки (Програш) - використовуємо клітинку, яка точно є міною
let mineRow, mineCol;
for(let r=0; r<game.rows; r++) {
    for(let c=0; c<game.cols; c++) {
        if (game.board[r][c].isMine) {
            mineRow = r;
            mineCol = c;
            break;
        }
    }
    if (mineRow !== undefined) break;
}

if (mineRow !== undefined) {
    openCell(mineRow, mineCol); // Натискаємо на міну
    // Очікуваний результат: у консолі відображається змінений стан гри = LOST та зупинка таймера.
    console.log(`Поточний стан гри після програшу: ${game.status}`);
}