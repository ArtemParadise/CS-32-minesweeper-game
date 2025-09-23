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

    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1],
    ];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c].hasMine) continue;

            let count = 0;
            for (const [dr, dc] of directions) {
                const nr = r + dr;
                const nc = c + dc;

                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    if (board[nr][nc].hasMine) count++;
                }
            }
            board[r][c].adjacentMines = count;
        }
    }

    return board;
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

const testGame = createGame(5, 5, 5);

console.log(testGame);
