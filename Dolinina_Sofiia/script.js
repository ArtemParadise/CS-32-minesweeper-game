const CellState = {
    CLOSED: 'closed',         // Закрита (за замовчуванням)
    OPENED: 'opened',         // Відкрита
    FLAGGED: 'flagged'        // Позначена прапорцем
};

class Cell {
    /**
     * Створює об'єкт клітинки.
     * @param {number} row - Індекс рядка.
     * @param {number} col - Індекс стовпця.
     */
    constructor(row, col) {
        // 2.o: Наявність міни (булеве значення)
        this.isMine = false;

        // 2.o: Кількість сусідніх мін (числовий тип)
        this.neighborMines = 0;

        // 2.o: Стан клітинки
        this.state = CellState.CLOSED;

        this.row = row;
        this.col = col;
    }
}

const GameStatus = {
    IN_PROGRESS: 'in_progress', // У процесі
    WON: 'won',                 // Перемога
    LOST: 'lost'                // Поразка
};

class GameState {
    /**
     * Створює об'єкт стану гри.
     * @param {number} rows - Кількість рядків.
     * @param {number} cols - Кількість стовпців.
     * @param {number} mines - Кількість мін.
     */
    constructor(rows, cols, mines) {
        // 3.o: Розмірність поля
        this.rows = rows;
        this.cols = cols;

        // 3.o: Кількість мін
        this.mines = mines;

        // 3.o: Поточний стан гри
        this.status = GameStatus.IN_PROGRESS;

        // Поле гри (двовимірний масив об'єктів Cell)
        this.board = this.initializeBoard(rows, cols);
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

function initializeTestGame() {
    const ROWS = 4;
    const COLS = 4;
    const MINES = 3;

    console.log(`--- Ініціалізація тестового поля ${ROWS}x${COLS} з ${MINES} мінами ---`);

    const game = new GameState(ROWS, COLS, MINES);
    const board = game.board;

    // 1. Розміщення мін
    board[0][0].isMine = true; // Міна (0, 0)
    board[2][1].isMine = true; // Міна (2, 1)
    board[3][3].isMine = true; // Міна (3, 3)

    // 2. Встановлення сусідніх мін (вручну для тесту)
    board[0][1].neighborMines = 1;
    board[1][0].neighborMines = 1;
    board[1][1].neighborMines = 2;
    board[3][2].neighborMines = 1;

    // 3. Встановлення тестових станів клітинок
    board[1][3].state = CellState.OPENED;  // Відкрита
    board[2][3].state = CellState.FLAGGED; // Прапорець

    // 4. Тестовий програш (для перевірки статусу)
    // game.status = GameStatus.LOST;

    return game;
}

// Запуск ініціалізації
const minesweeperGame = initializeTestGame();

// Виведення стану гри
console.log('\n--- СТАН ГРИ ---');
console.log(`Розмір: ${minesweeperGame.rows}x${minesweeperGame.cols}`);
console.log(`Міни: ${minesweeperGame.mines}`);
console.log(`Статус: ${minesweeperGame.status}`);

// Виведення стану кількох клітинок
console.log('\n--- СТАН КЛІТИНКИ (0, 0) - Міна, Закрита ---');
console.log(minesweeperGame.board[0][0]);

console.log('\n--- СТАН КЛІТИНКИ (1, 1) - Не міна, Сусіди 2, Закрита ---');
console.log(minesweeperGame.board[1][1]);

console.log('\n--- СТАН КЛІТИНКИ (1, 3) - Відкрита ---');
console.log(minesweeperGame.board[1][3]);