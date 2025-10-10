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

    for (let row = 0; row < rows; row++) {
        const row = [];
        for (let col = 0; col < cols; col++) {
            row.push(createCell());
        }
        board.push(row);
    }

    let placedMines = 0;
    while (placedMines < minesCount) {
        const randomRow = Math.floor(Math.random() * rows);
        const randomCol = Math.floor(Math.random() * cols);

        if (!board[randomRow][randomCol].hasMine) {
            board[randomRow][randomCol].hasMine = true;
            placedMines++;
        }
    }

    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1],
    ];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (board[row][col].hasMine) continue;

            let count = 0;
            for (const [directionRow, directionCol] of directions) {
                const neighborRow = row + directionRow;
                const neighborCol = col + directionCol;

                if (neighborRow >= 0 && neighborRow < rows && neighborCol >= 0 && neighborCol < cols) {
                    if (board[neighborRow][neighborCol].hasMine) count++;
                }
            }
            board[row][col].adjacentMines = count;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (board[row][col].hasMine) continue;

            board[row][col].adjacentMines = countAdjacentMines(board, row, col);
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
        for (const [dirRow, dirCol] of directions) {
            const neighborRow = row + dirRow;
            const neighborCol = col + dirCol;

            if (neighborRow >= 0 && neighborRow < rows && neighborCol >= 0 && neighborCol < cols) {
                openCell(game, neighborRow, neighborCol);
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

const testGame = createGame(5, 5, 5);

console.log(testGame);
