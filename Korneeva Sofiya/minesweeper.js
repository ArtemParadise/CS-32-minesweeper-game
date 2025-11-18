// ---- Можливі стани клітинки ----
const CellState = {
  CLOSED: "closed",
  OPEN: "open",
  FLAGGED: "flagged"
};

// ---- Клас клітинки ----
class Cell {
  constructor() {
    this.hasMine = false;          // чи є міна
    this.adjacentMines = 0;        // кількість сусідніх мін
    this.state = CellState.CLOSED; // стан клітинки
  }
}

// ---- Можливі стани гри ----
const GameStatus = {
  IN_PROGRESS: "in_progress",
  WON: "won",
  LOST: "lost"
};

// ---- Клас гри ----
class MinesweeperGame {
  constructor(rows, cols, mines) {
    this.rows = rows;
    this.cols = cols;
    this.totalMines = mines;
    this.status = GameStatus.IN_PROGRESS;

    this.board = this.createBoard(rows, cols);
    this.placeTestMines();
    this.calculateAdjacentMines();
  }

  // створення порожнього поля
  createBoard(rows, cols) {
    const board = [];
    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      const row = [];
      for (let colIndex = 0; colIndex < cols; colIndex++) {
        row.push(new Cell());
      }
      board.push(row);
    }
    return board;
  }

  // тестові міни (можна замінити на випадкове розташування)
  placeTestMines() {
    this.board[0][1].hasMine = true;
    this.board[2][2].hasMine = true;
    this.board[3][0].hasMine = true;
  }

  // підрахунок мін навколо клітинок
  calculateAdjacentMines() {
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [ 0, -1],          [ 0, 1],
      [ 1, -1], [ 1, 0], [ 1, 1]
    ];

    for (let rowIndex = 0; rowIndex < this.rows; rowIndex++) {
      for (let colIndex = 0; colIndex < this.cols; colIndex++) {
        if (this.board[rowIndex][colIndex].hasMine) continue;

        let count = 0;
        for (const [deltaRow, deltaCol] of directions) {
          const neighborRow = rowIndex + deltaRow;
          const neighborCol = colIndex + deltaCol;
          if (
            neighborRow >= 0 && neighborRow < this.rows &&
            neighborCol >= 0 && neighborCol < this.cols
          ) {
            if (this.board[neighborRow][neighborCol].hasMine) count++;
          }
        }
        this.board[rowIndex][colIndex].adjacentMines = count;
      }
    }
  }
}

// ---- Тестовий запуск ----
const game = new MinesweeperGame(4, 4, 3);

// Вивід у <pre>
const output = document.getElementById("output");
output.textContent = game.board
  .map(row => row.map(cell => cell.hasMine ? "💣" : cell.adjacentMines).join(" "))
  .join("\n");
 
