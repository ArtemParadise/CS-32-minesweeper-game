const CellState = Object.freeze({
    CLOSED: 'closed',
    OPEN: 'open',
    FLAGGED: 'flagged',
});

let gameState = {
    board: [],
    rows: 0,
    cols: 0,
    minesCount: 0,
    status: 'new', 
    timerId: null,
    secondsElapsed: 0
};

function createCell() {
    return {
        hasMine: false,
        adjacentMines: 0,
        state: CellState.CLOSED,
    };
}

function countNeighbourMines(field, row, col) {
    const rows = field.length;
    const cols = field[0].length;
    let count = 0;

    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [dr, dc] of directions) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            if (field[nr][nc].hasMine) {
                count++;
            }
        }
    }
    return count;
}

function generateField(rows, cols, mines) {
    const board = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => createCell())
    );

    let minesPlaced = 0;
    while (minesPlaced < mines) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);

        if (!board[r][c].hasMine) {
            board[r][c].hasMine = true;
            minesPlaced++;
        }
    }

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (!board[r][c].hasMine) {
                board[r][c].adjacentMines = countNeighbourMines(board, r, c);
            }
        }
    }

    gameState.board = board;
    gameState.rows = rows;
    gameState.cols = cols;
    gameState.minesCount = mines;
    gameState.status = 'in-progress';
    gameState.secondsElapsed = 0;

    console.log(`[Game] Поле згенеровано ${rows}x${cols}, мін: ${mines}`);
    return board;
}

function startTimer() {
    if (gameState.timerId) return;
    gameState.secondsElapsed = 0;
    console.log('[Timer] Таймер запущено');
    gameState.timerId = setInterval(() => {
        gameState.secondsElapsed++;
        console.log(`⏱ Час: ${gameState.secondsElapsed} сек.`);
    }, 1000);
}

function stopTimer() {
    if (gameState.timerId) {
        clearInterval(gameState.timerId);
        gameState.timerId = null;
        console.log(`[Timer] Стоп. Всього часу: ${gameState.secondsElapsed} с.`);
    }
}

function openCell(row, col) {
    if (gameState.status !== 'in-progress') return;
    
    if (row < 0 || row >= gameState.rows || col < 0 || col >= gameState.cols) return;

    const cell = gameState.board[row][col];

    if (cell.state !== CellState.CLOSED) return; 

    if (cell.hasMine) {
        cell.state = CellState.OPEN;
        gameState.status = 'defeat';
        stopTimer();
        console.log('💥 БУМ! Ви програли.');
        return;
    }

    cell.state = CellState.OPEN;

    if (cell.adjacentMines === 0) {
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        for (const [dr, dc] of directions) {
            openCell(row + dr, col + dc);
        }
    }
}

function toggleFlag(row, col) {
    if (gameState.status !== 'in-progress') return;
    const cell = gameState.board[row][col];

    if (cell.state === CellState.CLOSED) {
        cell.state = CellState.FLAGGED;
        console.log(`🚩 Прапорець: [${row}, ${col}]`);
    } else if (cell.state === CellState.FLAGGED) {
        cell.state = CellState.CLOSED;
        console.log(`🏳️ Прапорець знято: [${row}, ${col}]`);
    }
}

function printBoard() {
    const symbols = {
        closed: '⬜',
        flagged: '🚩',
        mine: '💣',
        empty: '⬛'
    };
    
    console.log(`\n--- Board State (${gameState.status}) ---`);
    const visual = gameState.board.map(row => 
        row.map(cell => {
            if (cell.state === CellState.CLOSED) return symbols.closed;
            if (cell.state === CellState.FLAGGED) return symbols.flagged;
            if (cell.hasMine) return symbols.mine;
            return cell.adjacentMines > 0 ? cell.adjacentMines : symbols.empty;
        }).join(' ')
    ).join('\n');
    console.log(visual);
}

// ==========================================
// ТЕСТОВИЙ СЦЕНАРІЙ (DEMO)
// ==========================================

console.log('=== СТАРТ ТЕСТУ ===');

// 1. Генеруємо поле
generateField(5, 5, 4);

// 2. Запускаємо таймер
startTimer();

// 3. Ставимо прапорець
toggleFlag(0, 0);

// 4. Відкриваємо клітинку
console.log('\n>> Клік по [2, 2]');
openCell(2, 2);
printBoard();

// 5. Ставимо ще один прапорець і відкриваємо
toggleFlag(2, 0);
console.log('\n>> Клік по [3, 0]');
openCell(3, 0);
printBoard();

// 6. Зупиняємо тест через 3 секунди
setTimeout(() => {
    stopTimer();
    console.log('=== ТЕСТ ЗАВЕРШЕНО ===');
}, 3100);
