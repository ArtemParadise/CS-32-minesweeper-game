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
      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
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
  
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (this.board[r][c].hasMine) continue;
  
          let count = 0;
          for (const [dr, dc] of directions) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
              if (this.board[nr][nc].hasMine) count++;
            }
          }
          this.board[r][c].adjacentMines = count;
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
  