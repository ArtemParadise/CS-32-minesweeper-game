/*
  Завдання 1: Структура для збереження ігрового поля (Двовимірний масив)
  Завдання 2: Властивості клітинки (isMine, neighborCount, state)
  Завдання 3: Структура стану гри (розмірність, міни, статус)
*/

// Константи для станів, щоб уникнути "магічних рядків" і помилок
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

/**
 * Створює об'єкт клітинки з початковими значеннями.
 * Виконує пункт 2 ТЗ.
 */
function createCell() {
    return {
        isMine: false,          // наявність міни (булеве)
        neighborCount: 0,       // кількість сусідніх мін (число)
        state: CELL_STATE.CLOSED // стан клітинки
    };
}

/**
 * Ініціалізує стан гри та ігрове поле.
 * Виконує пункти 1, 3 та 4 ТЗ.
 */
function initializeGame(rows, cols, minesCount) {
    // 3. Структура стану гри
    const gameState = {
        rows: rows,
        cols: cols,
        minesCount: minesCount,
        status: GAME_STATUS.IN_PROGRESS,
        board: [] // 1. Двовимірний масив
    };

    // Генерація двовимірного масиву об'єктів (пункт 4)
    for (let y = 0; y < rows; y++) {
        const row = [];
        for (let x = 0; x < cols; x++) {
            row.push(createCell());
        }
        gameState.board.push(row);
    }

    // --- Додамо тестові дані для демонстрації (згідно п. 4) ---
    // Встановимо міну в центрі (наприклад, 5-й рядок, 2-й елемент, як на скріншоті)
    if (gameState.board[4] && gameState.board[4][1]) {
        gameState.board[4][1].isMine = true;
    }

    // Встановимо кілька відкритих клітинок та прапорців для прикладу
    gameState.board[0][0].state = CELL_STATE.OPENED;
    gameState.board[0][0].neighborCount = 1;

    gameState.board[5][5].state = CELL_STATE.FLAGGED; // Прапорець

    return gameState;
}

// Запуск ініціалізації
const myGame = initializeGame(9, 9, 10);

// Вивід у консоль для перевірки структури
console.log("Початковий стан гри:", myGame);
console.log("Приклад клітинки з міною:", myGame.board[4][1]);
console.log("Приклад відкритої клітинки:", myGame.board[0][0]);