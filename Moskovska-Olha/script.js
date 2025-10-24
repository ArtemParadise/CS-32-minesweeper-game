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

document.addEventListener('contextmenu', function (event) {
    event.preventDefault();
});

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
    checkGameState(game);
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
const counterElement = document.querySelector('.counter');

function toggleFlag(game, row, col) {
    if(game.board[row][col].state !== CellState.CLOSED) return;
    game.board[row][col].state = CellState.FLAGGED;
    const minesLeft = game.minesCount-1;
    if(minesLeft < 0)
    {
        counterElement.textContent = "🤡";
    }
    else
    {
        counterElement.textContent = minesLeft;
        game.minesCount = minesLeft;
    }
    checkGameState(game);
}

let timerHandler = null;
const timerElement = document.querySelector('.timer');

function startTimer() {
    let timer = 0;
    timerHandler = setInterval(() => {
        timerElement.textContent = timer;
        timer++;
    }, 1000);
    return timerHandler;
}

function stopTimer(timerHandler) {
    console.log("Timer stopped");
    clearInterval(timerHandler);
}

const boardElement = document.querySelector('.board');
const newGameButton = document.querySelector('.new-game');
let game = null;


function renderBoard(game) {
    boardElement.innerHTML = '';
    boardElement.style.gridTemplateColumns = `repeat(${game.cols}, 1fr)`;

    const board = game.board;
    const rows = board.length;
    const cols = board[0].length;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cell = board[row][col];
            const cellElement = document.createElement("div");
            cellElement.classList.add("cell");
            cellElement.dataset.row = row;
            cellElement.dataset.col = col;
            
            switch (cell.state) {
                case CellState.OPENED:
                    cellElement.classList.add('open');
                    if (cell.hasMine) {
                        cellElement.classList.add('mine-hit');
                        cellElement.textContent = '💥';
                    } else if (cell.adjacentMines > 0) {
                        cellElement.textContent = cell.adjacentMines;
                        cellElement.classList.add(`n${cell.adjacentMines}`);
                    }
                    break;
                case CellState.FLAGGED:
                    cellElement.classList.add('flag');
                    cellElement.textContent = '🚩';
                    break;
                case CellState.CLOSED:
                    cellElement.classList.add('closed');
                    break;
            }

            if (game.state === GameState.LOST && cell.hasMine && cell.state !== CellState.OPENED) {
                cellElement.classList.remove('closed', 'flag');
                cellElement.classList.add('mine');
                cellElement.textContent = '💣';
            }

            boardElement.appendChild(cellElement);
        }
    }
}

function checkGameState(game) {
    const board = game.board;
    const rows = board.length;
    const cols = board[0].length;
    let hasUnflaggedMine = false;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cell = board[row][col];
            if (cell.state === CellState.OPENED && cell.hasMine) {
                game.state = GameState.LOST;
                counterElement.textContent = "💣Lost💣";
                stopTimer(timerHandler);
                return;
            }
            else if (cell.state !== CellState.FLAGGED && cell.hasMine) {
                hasUnflaggedMine = true;
            }
        }
    }
    if (!hasUnflaggedMine && game.minesCount >= 0) {
        counterElement.textContent = "✨Won✨";
        game.state = GameState.WON;
        stopTimer(timerHandler);
        renderBoard(game);
    }
}


function handleLeftClick(event) {
    const cellElement = event.target.closest('.cell');
    if (!cellElement) return;

    const row = parseInt(cellElement.dataset.row);
    const col = parseInt(cellElement.dataset.col);
    openCell(game, row, col);
    renderBoard(game);
}

function handleRightClick(event) {
    const cellElement = event.target.closest('.cell');
    if (!cellElement) return;

    const row = parseInt(cellElement.dataset.row);
    const col = parseInt(cellElement.dataset.col);
    toggleFlag(game, row, col);
    renderBoard(game);
}

function handleNewGame() {
    if(timerHandler) stopTimer(timerHandler);
    const initialMinesCount = 10;
    counterElement.textContent = initialMinesCount;
    game = createGame(16, 10, initialMinesCount);
    renderBoard(game);
    startTimer();
}

newGameButton.addEventListener('click', handleNewGame);
boardElement.addEventListener('click', handleLeftClick);
boardElement.addEventListener('contextmenu', handleRightClick);
handleNewGame();
