// ====================================================================
// СТРУКТУРИ ДАНИХ
// ====================================================================

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
        this.flagsUsed = 0;
        this.status = GameStatus.IN_PROGRESS;
        this.board = this.initializeBoard(rows, cols);
        this.timerInterval = null;
        this.timeElapsed = 0;
        this.firstClick = true;
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

let game;
const DEFAULT_ROWS = 10;
const DEFAULT_COLS = 10;
const DEFAULT_MINES = 15;

// ====================================================================
// ЛОГІКА ТАЙМЕРА
// ====================================================================

function startTimer() {
    if (!game) return;
    if (game.timerInterval) return;

    const timeElement = document.getElementById('time-count');

    game.timerInterval = setInterval(() => {
        game.timeElapsed++;
        timeElement.textContent = String(game.timeElapsed).padStart(3, '0');
    }, 1000);
}

// ВИПРАВЛЕНО — додано перевірку `if (!game) return;`
function stopTimer() {
    if (!game) return;
    if (game.timerInterval) {
        clearInterval(game.timerInterval);
        game.timerInterval = null;
    }
}

// ====================================================================
// АЛГОРИТМИ ГРИ
// ====================================================================

function generateField(rows, cols, mines) {
    game = new GameState(rows, cols, mines);
    const board = game.board;

    const allPositions = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            allPositions.push({ r, c });
        }
    }

    for (let i = 0; i < mines; i++) {
        const randomIndex = Math.floor(Math.random() * allPositions.length);
        const { r, c } = allPositions.splice(randomIndex, 1)[0];
        board[r][c].isMine = true;
    }

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (!board[r][c].isMine) {
                board[r][c].neighborMines = countNeighbourMines(board, r, c);
            }
        }
    }
}

function countNeighbourMines(field, row, col) {
    let mineCount = 0;
    const rows = field.length;
    const cols = field[0].length;

    for (let r_offset = -1; r_offset <= 1; r_offset++) {
        for (let c_offset = -1; c_offset <= 1; c_offset++) {
            if (r_offset === 0 && c_offset === 0) continue;

            const newRow = row + r_offset;
            const newCol = col + c_offset;

            if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                if (field[newRow][newCol].isMine) {
                    mineCount++;
                }
            }
        }
    }
    return mineCount;
}

function openCell(row, col) {
    if (game.status !== GameStatus.IN_PROGRESS) return;

    if (game.firstClick) {
        startTimer();
        game.firstClick = false;
    }

    const cell = game.board[row][col];

    if (cell.state === CellState.OPENED || cell.state === CellState.FLAGGED) {
        return;
    }

    if (cell.isMine) {
        cell.state = CellState.OPENED;
        game.status = GameStatus.LOST;
        stopTimer();
        revealAllMines();
        updateHeaderUI();
        updateCellUI(cell);
        showMessage('Ви підірвались! 😵');
        return;
    }

    cell.state = CellState.OPENED;
    updateCellUI(cell);

    checkWinCondition();

    if (cell.neighborMines === 0) {
        for (let r_offset = -1; r_offset <= 1; r_offset++) {
            for (let c_offset = -1; c_offset <= 1; c_offset++) {
                if (r_offset === 0 && c_offset === 0) continue;

                const newRow = row + r_offset;
                const newCol = col + c_offset;

                if (newRow >= 0 && newRow < game.rows && newCol >= 0 && newCol < game.cols) {
                    const neighborCell = game.board[newRow][newCol];
                    if (neighborCell.state === CellState.CLOSED) {
                        openCell(newRow, newCol);
                    }
                }
            }
        }
    }
}

function toggleFlag(row, col) {
    if (game.status !== GameStatus.IN_PROGRESS) return;

    const cell = game.board[row][col];

    if (cell.state === CellState.OPENED) return;

    if (cell.state === CellState.FLAGGED) {
        cell.state = CellState.CLOSED;
        game.flagsUsed--;
    } else if (game.flagsUsed < game.mines) {
        cell.state = CellState.FLAGGED;
        game.flagsUsed++;
    }

    updateCellUI(cell);
    updateHeaderUI();
}

function checkWinCondition() {
    let closedNonMines = 0;

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
        revealAllMines();
        updateHeaderUI();
        showMessage(`Перемога! 🎉 Ваш час: ${game.timeElapsed} с.`);
    }
}

function revealAllMines() {
    for (let r = 0; r < game.rows; r++) {
        for (let c = 0; c < game.cols; c++) {
            const cell = game.board[r][c];

            if (cell.isMine && cell.state !== CellState.OPENED) {
                cell.state = CellState.OPENED;
                updateCellUI(cell, false, true);
            } else if (!cell.isMine && cell.state === CellState.FLAGGED) {
                updateCellUI(cell, true);
            }
        }
    }
}

// ====================================================================
// UI / РЕНДЕРИНГ
// ====================================================================

function renderField() {
    const boardElement = document.getElementById('game-board');
    boardElement.innerHTML = '';

    boardElement.style.gridTemplateColumns = `repeat(${game.cols}, var(--cell-size))`;

    for (let r = 0; r < game.rows; r++) {
        for (let c = 0; c < game.cols; c++) {
            const cellElement = document.createElement('div');
            cellElement.classList.add('cell');

            cellElement.dataset.row = r;
            cellElement.dataset.col = c;

            cellElement.addEventListener('click', handleLeftClick);
            cellElement.addEventListener('contextmenu', handleRightClick);

            boardElement.appendChild(cellElement);

            updateCellUI(game.board[r][c]);
        }
    }
}

function updateCellUI(cell, isWrongFlag = false, isMineRevealed = false) {
    const boardElement = document.getElementById('game-board');
    const cellElements = boardElement.children;
    const index = cell.row * game.cols + cell.col;
    const element = cellElements[index];

    if (!element) return;

    element.className = 'cell';
    element.textContent = '';

    element.classList.add(cell.state);

    if (cell.state === CellState.OPENED) {
        if (cell.isMine) {
            element.classList.add(isMineRevealed ? 'mine-revealed' : 'mine-hit');
            element.textContent = '💣';
        } else if (cell.neighborMines > 0) {
            element.classList.add(`number-${cell.neighborMines}`);
            element.textContent = cell.neighborMines;
        } else {
            element.classList.add('empty');
        }
    } else if (cell.state === CellState.FLAGGED) {
        element.textContent = '🚩';

        if (isWrongFlag) {
            element.classList.add('wrong-flag');
            element.textContent = '❌';
        }
    }
}

function updateHeaderUI() {
    const flagCountElement = document.getElementById('flag-count');
    const remainingFlags = game.mines - game.flagsUsed;
    flagCountElement.textContent = String(remainingFlags).padStart(3, '0');

    const resetButton = document.getElementById('reset-button');
    let emoji = '😊';
    if (game.status === GameStatus.WON) emoji = '😎';
    if (game.status === GameStatus.LOST) emoji = '😵';
    resetButton.textContent = emoji;
}

function showMessage(text) {
    const overlay = document.getElementById('message-overlay');
    document.getElementById('final-message').textContent = text;
    overlay.classList.remove('hidden');
}

function hideMessage() {
    document.getElementById('message-overlay').classList.add('hidden');
}

// ====================================================================
// ОБРОБКА ПОДІЙ
// ====================================================================

function handleLeftClick(event) {
    if (game.status !== GameStatus.IN_PROGRESS) return;

    const row = parseInt(event.currentTarget.dataset.row);
    const col = parseInt(event.currentTarget.dataset.col);

    openCell(row, col);
}

function handleRightClick(event) {
    event.preventDefault();
    if (game.status !== GameStatus.IN_PROGRESS) return;

    const row = parseInt(event.currentTarget.dataset.row);
    const col = parseInt(event.currentTarget.dataset.col);

    toggleFlag(row, col);
}

function handleResetClick() {
    startGame();
    hideMessage();
}

// ====================================================================
// ІНІЦІАЛІЗАЦІЯ ГРИ
// ====================================================================

function startGame() {
    stopTimer();

    document.getElementById('time-count').textContent = '000';

    generateField(DEFAULT_ROWS, DEFAULT_COLS, DEFAULT_MINES);

    renderField();

    updateHeaderUI();

    game.firstClick = true;

    document.getElementById('reset-button').onclick = handleResetClick;
    document.getElementById('play-again-button').onclick = handleResetClick;
}

document.addEventListener('DOMContentLoaded', startGame);
