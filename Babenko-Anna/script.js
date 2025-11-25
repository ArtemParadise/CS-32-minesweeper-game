const CellState = Object.freeze({
    CLOSED: 'closed',
    OPEN: 'open',
    FLAGGED: 'flagged',
});

let gameState = {
    board: [],
    rows: 10,
    cols: 10,
    minesCount: 15,
    flagsLeft: 15,
    status: 'new', 
    timerId: null,
    secondsElapsed: 0
};

function createCell() {
    return { hasMine: false, adjacentMines: 0, state: CellState.CLOSED };
}

function countNeighbourMines(field, row, col) {
    const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    let count = 0;
    for (const [dr, dc] of directions) {
        const nr = row + dr, nc = col + dc;
        if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols && field[nr][nc].hasMine) {
            count++;
        }
    }
    return count;
}

function generateField(rows, cols, mines) {
    const board = Array.from({ length: rows }, () => Array.from({ length: cols }, () => createCell()));
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
    return board;
}

const els = {
    grid: document.getElementById('grid'),
    boardContainer: document.getElementById('board-container'),
    timer: document.getElementById('timer'),
    flags: document.getElementById('flag-count'),
    btn: document.getElementById('start-btn')
};

els.btn.addEventListener('click', initGame);

function initGame() {
    stopTimer();
    
    gameState.rows = 10;
    gameState.cols = 10;
    gameState.minesCount = 15;
    gameState.flagsLeft = gameState.minesCount;
    gameState.status = 'in-progress';
    gameState.secondsElapsed = 0;
    
    updateTimerDisplay();
    updateFlagDisplay();
    els.btn.innerText = 'Нова гра';

    els.boardContainer.style.setProperty('--rows', gameState.rows);
    els.boardContainer.style.setProperty('--cols', gameState.cols);

    gameState.board = generateField(gameState.rows, gameState.cols, gameState.minesCount);
    
    startTimer();
    renderBoard();
}

function renderBoard() {
    els.grid.innerHTML = ''; 

    gameState.board.forEach((row, rIndex) => {
        row.forEach((cell, cIndex) => {
            const btn = document.createElement('button');
            btn.className = 'cell';
            
            if (cell.state === CellState.CLOSED) {
                btn.dataset.state = 'closed';
            } 
            else if (cell.state === CellState.FLAGGED) {
                btn.dataset.state = 'flag';
                btn.innerText = '🚩';
            } 
            else if (cell.state === CellState.OPEN) {
                if (cell.hasMine) {
                    btn.dataset.state = (gameState.status === 'defeat' && cell.exploded) ? 'exploded' : 'mine';
                    btn.innerText = '💣';
                } else {
                    btn.dataset.state = 'open';
                    if (cell.adjacentMines > 0) {
                        btn.dataset.count = cell.adjacentMines;
                        btn.innerText = cell.adjacentMines;
                    }
                }
            }

            btn.onclick = () => handleLeftClick(rIndex, cIndex);
            btn.oncontextmenu = (e) => {
                e.preventDefault();
                handleRightClick(rIndex, cIndex);
            };

            els.grid.appendChild(btn);
        });
    });
}

function handleLeftClick(row, col) {
    if (gameState.status !== 'in-progress') return;
    const cell = gameState.board[row][col];
    
    if (cell.state === CellState.FLAGGED || cell.state === CellState.OPEN) return;

    if (cell.hasMine) {
        cell.state = CellState.OPEN;
        cell.exploded = true; 
        gameState.status = 'defeat';
        els.btn.innerText = 'Поразка 💀';
        revealAllMines();
        stopTimer();
    } else {
        openCellRecursive(row, col);
        checkWinCondition();
    }
    renderBoard();
}

function openCellRecursive(row, col) {
    if (row < 0 || row >= gameState.rows || col < 0 || col >= gameState.cols) return;
    const cell = gameState.board[row][col];
    
    if (cell.state !== CellState.CLOSED) return;

    cell.state = CellState.OPEN;

    if (cell.adjacentMines === 0) {
        const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
        for (const [dr, dc] of directions) openCellRecursive(row + dr, col + dc);
    }
}

function handleRightClick(row, col) {
    if (gameState.status !== 'in-progress') return;

    const cell = gameState.board[row][col];

    if (cell.state === CellState.CLOSED && gameState.flagsLeft > 0) {
        cell.state = CellState.FLAGGED;
        gameState.flagsLeft--;
    } else if (cell.state === CellState.FLAGGED) {
        cell.state = CellState.CLOSED;
        gameState.flagsLeft++;
    }
    
    updateFlagDisplay();
    renderBoard();
}

function checkWinCondition() {
    let closedCells = 0;
    gameState.board.forEach(row => row.forEach(cell => {
        if (cell.state === CellState.CLOSED || cell.state === CellState.FLAGGED) closedCells++;
    }));

    if (closedCells === gameState.minesCount) {
        gameState.status = 'victory';
        els.btn.innerText = 'Перемога! 🎉';
        stopTimer();
    }
}

function revealAllMines() {
    gameState.board.forEach(row => row.forEach(cell => {
        if (cell.hasMine) cell.state = CellState.OPEN;
    }));
}

function startTimer() {
    if (gameState.timerId) clearInterval(gameState.timerId);
    gameState.timerId = setInterval(() => {
        gameState.secondsElapsed++;
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    if (gameState.timerId) {
        clearInterval(gameState.timerId);
        gameState.timerId = null;
    }
}

function updateTimerDisplay() {
    els.timer.innerText = String(gameState.secondsElapsed).padStart(3, '0');
}

function updateFlagDisplay() {
    els.flags.innerText = String(gameState.flagsLeft).padStart(3, '0');
}

initGame();