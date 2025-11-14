const board = document.getElementById('game-board');
const flagsDisplay = document.getElementById('flags');
const timerDisplay = document.getElementById('timer');
const restartBtn = document.getElementById('restart-btn');

const rows = 10;
const cols = 10;
const minesCount = 10;

let boardData = [];
let flags = minesCount;
let timer;
let seconds = 0;
let gameOver = false;

// Створення гри
function initGame() {
    clearInterval(timer);
    seconds = 0;
    timerDisplay.textContent = seconds;
    flags = minesCount;
    flagsDisplay.textContent = flags;
    gameOver = false;
    boardData = [];
    board.innerHTML = '';

    // Генерація клітинок
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell', 'closed');
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.addEventListener('click', leftClick);
            cell.addEventListener('contextmenu', rightClick);
            board.appendChild(cell);
            row.push({ mine: false, element: cell, open: false, flagged: false, neighborMines: 0 });
        }
        boardData.push(row);
    }

    placeMines();
    calculateNeighbors();
    startTimer();
}

// Розстановка мін
function placeMines() {
    let placed = 0;
    while (placed < minesCount) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);
        if (!boardData[r][c].mine) {
            boardData[r][c].mine = true;
            placed++;
        }
    }
}

// Обчислення сусідніх мін
function calculateNeighbors() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (boardData[r][c].mine) continue;
            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                        if (boardData[nr][nc].mine) count++;
                    }
                }
            }
            boardData[r][c].neighborMines = count;
        }
    }
}

// Лівий клік
function leftClick(e) {
    if (gameOver) return;
    const r = parseInt(this.dataset.row);
    const c = parseInt(this.dataset.col);
    openCell(r, c);
}

// Правий клік (флаг)
function rightClick(e) {
    e.preventDefault();
    if (gameOver) return;
    const r = parseInt(this.dataset.row);
    const c = parseInt(this.dataset.col);
    const cellData = boardData[r][c];
    if (cellData.open) return;

    if (cellData.flagged) {
        cellData.flagged = false;
        cellData.element.classList.remove('flag');
        flags++;
    } else if (flags > 0) {
        cellData.flagged = true;
        cellData.element.classList.add('flag');
        flags--;
    }
    flagsDisplay.textContent = flags;
}

// Відкриття клітинки
function openCell(r, c) {
    const cellData = boardData[r][c];
    if (cellData.open || cellData.flagged) return;

    cellData.open = true;
    cellData.element.classList.remove('closed');
    cellData.element.classList.add('open');

    if (cellData.mine) {
        cellData.element.classList.add('clicked-mine');
        gameOver = true;
        revealMines();
        alert("Гра завершена! Ти натрапила на міну.");
        return;
    }

    if (cellData.neighborMines > 0) {
        cellData.element.textContent = cellData.neighborMines;
    } else {
        // Рекурсивно відкриваємо сусідні пусті клітинки
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    openCell(nr, nc);
                }
            }
        }
    }

    checkWin();
}

// Показати всі міни
function revealMines() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cellData = boardData[r][c];
            if (cellData.mine && !cellData.open) {
                cellData.element.classList.add('mine');
            }
        }
    }
}

// Перевірка на перемогу
function checkWin() {
    let opened = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (boardData[r][c].open) opened++;
        }
    }
    if (opened === rows * cols - minesCount) {
        gameOver = true;
        alert("Вітаю! Ти виграла!");
        revealMines();
    }
}

// Таймер
function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => {
        seconds++;
        timerDisplay.textContent = seconds;
    }, 1000);
}

// Старт гри
restartBtn.addEventListener('click', initGame);

// Ініціалізація
initGame();
