// Клас для гри Minesweeper
class Minesweeper {
    constructor() {
        this.board = [];
        this.gameBoard = document.getElementById('gameBoard');
        this.minesCountElement = document.getElementById('minesCount');
        this.timerElement = document.getElementById('timer');
        this.gameStatusElement = document.getElementById('gameStatus');
        this.difficultySelect = document.getElementById('difficulty');
        this.customSettings = document.getElementById('customSettings');
        this.newGameBtn = document.getElementById('newGameBtn');
        
        this.gameStarted = false;
        this.gameOver = false;
        this.timer = 0;
        this.timerInterval = null;
        
        this.difficulties = {
            beginner: { width: 9, height: 9, mines: 10 },
            intermediate: { width: 16, height: 16, mines: 40 },
            expert: { width: 16, height: 30, mines: 99 }
        };
        
        this.currentDifficulty = 'intermediate';
        this.initializeEventListeners();
        this.initializeGame();
    }
    
    initializeEventListeners() {
        this.difficultySelect.addEventListener('change', (e) => {
            this.currentDifficulty = e.target.value;
            if (e.target.value === 'custom') {
                this.customSettings.style.display = 'flex';
            } else {
                this.customSettings.style.display = 'none';
            }
            this.initializeGame();
        });
        
        this.newGameBtn.addEventListener('click', () => {
            this.initializeGame();
        });
        
        // Обробка користувацьких налаштувань
        const customInputs = this.customSettings.querySelectorAll('input');
        customInputs.forEach(input => {
            input.addEventListener('change', () => {
                if (this.currentDifficulty === 'custom') {
                    this.initializeGame();
                }
            });
        });
    }
    
    initializeGame() {
        this.gameStarted = false;
        this.gameOver = false;
        this.timer = 0;
        this.clearTimer();
        
        const settings = this.getGameSettings();
        this.width = settings.width;
        this.height = settings.height;
        this.mines = settings.mines;
        this.flaggedCount = 0;
        
        this.createBoard();
        this.renderBoard();
        this.updateDisplay();
        
        this.gameStatusElement.textContent = 'Готовий';
        this.gameStatusElement.className = 'stat-value';
    }
    
    getGameSettings() {
        if (this.currentDifficulty === 'custom') {
            const width = parseInt(document.getElementById('customWidth').value) || 16;
            const height = parseInt(document.getElementById('customHeight').value) || 16;
            const mines = parseInt(document.getElementById('customMines').value) || 40;
            
            // Обмеження для безпеки
            const maxMines = Math.floor((width * height) * 0.8);
            const safeMines = Math.min(mines, maxMines);
            
            return { width, height, mines: safeMines };
        }
        return this.difficulties[this.currentDifficulty];
    }
    
    createBoard() {
        this.board = [];
        for (let y = 0; y < this.height; y++) {
            this.board[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.board[y][x] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborCount: 0
                };
            }
        }
    }
    
    placeMines(firstClickX, firstClickY) {
        let minesPlaced = 0;
        while (minesPlaced < this.mines) {
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);
            
            // Не ставимо міну на перший клік та навколо нього
            if (!this.board[y][x].isMine && 
                !(Math.abs(x - firstClickX) <= 1 && Math.abs(y - firstClickY) <= 1)) {
                this.board[y][x].isMine = true;
                minesPlaced++;
            }
        }
        
        this.calculateNeighborCounts();
    }
    
    calculateNeighborCounts() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (!this.board[y][x].isMine) {
                    this.board[y][x].neighborCount = this.countNeighborMines(x, y);
                }
            }
        }
    }
    
    countNeighborMines(x, y) {
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const newX = x + dx;
                const newY = y + dy;
                if (newX >= 0 && newX < this.width && 
                    newY >= 0 && newY < this.height && 
                    this.board[newY][newX].isMine) {
                    count++;
                }
            }
        }
        return count;
    }
    
    renderBoard() {
        this.gameBoard.innerHTML = '';
        this.gameBoard.style.gridTemplateColumns = `repeat(${this.width}, 1fr)`;
        this.gameBoard.style.display = 'grid';
        this.gameBoard.style.gap = '1px';
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                cell.addEventListener('click', (e) => this.handleCellClick(e, x, y));
                cell.addEventListener('contextmenu', (e) => this.handleRightClick(e, x, y));
                
                this.gameBoard.appendChild(cell);
            }
        }
    }
    
    handleCellClick(event, x, y) {
        event.preventDefault();
        
        if (this.gameOver || this.board[y][x].isRevealed || this.board[y][x].isFlagged) {
            return;
        }
        
        if (!this.gameStarted) {
            this.startGame(x, y);
        }
        
        this.revealCell(x, y);
        this.updateDisplay();
        this.checkWinCondition();
    }
    
    handleRightClick(event, x, y) {
        event.preventDefault();
        
        if (this.gameOver || this.board[y][x].isRevealed) {
            return;
        }
        
        this.toggleFlag(x, y);
        this.updateDisplay();
    }
    
    startGame(firstClickX, firstClickY) {
        this.gameStarted = true;
        this.placeMines(firstClickX, firstClickY);
        this.startTimer();
        this.gameStatusElement.textContent = 'Граємо';
        this.gameStatusElement.className = 'stat-value';
    }
    
    revealCell(x, y) {
        if (this.board[y][x].isRevealed || this.board[y][x].isFlagged) {
            return;
        }
        
        this.board[y][x].isRevealed = true;
        const cellElement = this.getCellElement(x, y);
        cellElement.classList.add('revealed');
        
        if (this.board[y][x].isMine) {
            this.gameOver = true;
            this.endGame(false);
            return;
        }
        
        if (this.board[y][x].neighborCount === 0) {
            // Автоматично відкриваємо сусідні клітинки
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const newX = x + dx;
                    const newY = y + dy;
                    if (newX >= 0 && newX < this.width && 
                        newY >= 0 && newY < this.height) {
                        this.revealCell(newX, newY);
                    }
                }
            }
        }
        
        this.updateCellDisplay(x, y);
    }
    
    toggleFlag(x, y) {
        if (this.board[y][x].isFlagged) {
            this.board[y][x].isFlagged = false;
            this.flaggedCount--;
        } else {
            this.board[y][x].isFlagged = true;
            this.flaggedCount++;
        }
        
        this.updateCellDisplay(x, y);
    }
    
    updateCellDisplay(x, y) {
        const cellElement = this.getCellElement(x, y);
        const cell = this.board[y][x];
        
        cellElement.className = 'cell';
        cellElement.textContent = '';
        
        if (cell.isFlagged) {
            cellElement.classList.add('flagged');
            cellElement.textContent = '🚩';
        } else if (cell.isRevealed) {
            cellElement.classList.add('revealed');
            if (cell.isMine) {
                cellElement.classList.add('mine');
                cellElement.textContent = '💣';
            } else if (cell.neighborCount > 0) {
                cellElement.textContent = cell.neighborCount;
                cellElement.dataset.count = cell.neighborCount;
            }
        }
    }
    
    getCellElement(x, y) {
        return this.gameBoard.children[y * this.width + x];
    }
    
    checkWinCondition() {
        let revealedCount = 0;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.board[y][x].isRevealed && !this.board[y][x].isMine) {
                    revealedCount++;
                }
            }
        }
        
        const totalSafeCells = this.width * this.height - this.mines;
        if (revealedCount === totalSafeCells) {
            this.endGame(true);
        }
    }
    
    endGame(won) {
        this.gameOver = true;
        this.clearTimer();
        
        if (won) {
            this.gameStatusElement.textContent = 'Перемога! 🎉';
            this.gameStatusElement.className = 'stat-value win-animation';
            this.revealAllMines(true);
        } else {
            this.gameStatusElement.textContent = 'Поразка 💥';
            this.gameStatusElement.className = 'stat-value';
            this.revealAllMines(false);
        }
    }
    
    revealAllMines(won) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.board[y][x].isMine) {
                    this.board[y][x].isRevealed = true;
                    const cellElement = this.getCellElement(x, y);
                    cellElement.classList.add('revealed', 'mine');
                    if (!won) {
                        cellElement.classList.add('exploded');
                    }
                    cellElement.textContent = '💣';
                }
            }
        }
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateDisplay();
        }, 1000);
    }
    
    clearTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    updateDisplay() {
        this.minesCountElement.textContent = this.mines - this.flaggedCount;
        this.timerElement.textContent = this.timer.toString().padStart(3, '0');
    }
}

// Ініціалізація гри при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    new Minesweeper();
});
