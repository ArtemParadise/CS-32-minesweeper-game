const CellState = {
    CLOSED: "closed",
    OPENED: "opened",
    FLAGGED: "flagged",
};

const GameState = {
    IN_PROGRESS: "inProgress",
    WON: "won",
    LOST: "lost",
};

function createCell(hasMine = false, adjacentMines = 0, state = CellState.CLOSED) {
    return {
        hasMine,     
        adjacentMines, 
        state,          
    };
}

const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1],
];

function getAdjacentCells(board, row, col) {
    const cells = [];
    const rows = board.length;
    const cols = board[0].length;
    for (const [dr, dc] of directions) {
        const nr = row + dr;
        const nc = col + dc;

        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            cells.push(board[nr][nc]);
        }
    }
    return cells;
}

function countAdjacentMines(board, row, col) {
    let count = 0;
    const rows = board.length;
    const cols = board[0].length;
    const adjacentCells = getAdjacentCells(board, row, col);
    adjacentCells.forEach(cell => {
        if (cell.hasMine) count++;
    });
    return count;
}

function createBoard(rows, cols, minesCount) {
    const board = [];

    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            row.push(createCell());
        }
        board.push(row);
    }

    let placedMines = 0;
    while (placedMines < minesCount) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);

        if (!board[r][c].hasMine) {
            board[r][c].hasMine = true;
            placedMines++;
        }
    }

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c].hasMine) continue;

            board[r][c].adjacentMines = countAdjacentMines(board, r, c);
        }
    }

    return board;
}

function openCell(game, row, col) {
    if(game.board[row][col].state !== CellState.CLOSED) return;
    game.board[row][col].state = CellState.OPENED;
    if(game.board[row][col].hasMine)
    {
        game.state = GameState.LOST;
        return;
    }
    if(game.board[row][col].adjacentMines === 0)
    {
        const rows = game.board.length;
        const cols = game.board[0].length;
        for (const [dr, dc] of directions) {
            const nr = row + dr;
            const nc = col + dc;

            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                openCell(game, nr, nc);
            }
        }
    }
}

function createGame(rows, cols, minesCount) {
    return {
        rows,
        cols,
        minesCount,
        state: GameState.IN_PROGRESS,
        board: createBoard(rows, cols, minesCount),
    };
}

function toggleFlag(game, row, col) {
    if(game.board[row][col].state !== CellState.CLOSED) return;
    game.board[row][col].state = CellState.FLAGGED;
}

function startTimer() {
    let timerHandler = null;
    let timer = 0;
    timerHandler = setInterval(() => {
        console.log(timer);
        timer++;
    }, 1000);
    return timerHandler;
}

function stopTimer(timerHandler) {
    console.log("Timer stopped");
    clearInterval(timerHandler);
}

const testGame = createGame(5, 5, 5);
openCell(testGame, 0, 0);
console.log(testGame);
openCell(testGame, 1, 2);
toggleFlag(testGame, 2, 2);
console.log(testGame);
const timerHandler = startTimer();
setTimeout(() => {
    stopTimer(timerHandler);
}, 1000);
