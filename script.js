const CellState = Object.freeze({
    CLOSED: 'closed',
    OPEN: 'open',
    FLAGGED: 'flagged',
});

function createCell() {
    return {
        hasMine: false,
        adjacentMines: 0,
        state: CellState.CLOSED,
    };
}

function createBoard(rows, cols) {
    return Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => createCell())
    );
}

function calculateAdjacentMines(board) {
    const rows = board.length;
    const cols = board[0].length;
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
                if (
                    nr >= 0 &&
                    nr < rows &&
                    nc >= 0 &&
                    nc < cols &&
                    board[nr][nc].hasMine
                ) {
                    count++;
                }
            }
            board[r][c].adjacentMines = count;
        }
    }
}

function createGameState(rows, cols, minePositions) {
    const board = createBoard(rows, cols);
    minePositions.forEach(([r, c]) => {
        board[r][c].hasMine = true;
    });
    calculateAdjacentMines(board);

    return {
        rows,
        cols,
        mineCount: minePositions.length,
        status: 'in-progress', 
        board,
    };
}


const testMinePositions = [
    [0, 1],
    [2, 2],
];

const gameState = createGameState(3, 3, testMinePositions);

gameState.board[0][0].state = CellState.OPEN;

console.log('Game state object:', gameState);

function printBoard(gameState) {
    const symbols = {
        closed: '⬜',
        flagged: '🚩',
        open: '⬛'
    };

    console.log('\n--- Board Visualization ---');
    const visual = gameState.board.map(row => 
        row.map(cell => {
            if (cell.state === CellState.CLOSED) return symbols.closed;
            if (cell.state === CellState.FLAGGED) return symbols.flagged;
            if (cell.hasMine) return '💣';
            return cell.adjacentMines > 0 ? cell.adjacentMines : symbols.open;
        }).join(' ')
    ).join('\n');

    console.log(visual);
}

printBoard(gameState);