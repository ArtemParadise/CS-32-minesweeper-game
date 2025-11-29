const GAME_STATUS = Object.freeze({
  PENDING: "pending",
  PLAYING: "playing",
  WON: "won",
  LOST: "lost",
});

const gameState = {
  rows: 9, // Кількість рядків
  cols: 9, // Кількість колонок
  minesCount: 10, // Кількість мін
  status: GAME_STATUS.PENDING, // Етапи гри: 'pending' (очікування), 'playing', 'won', 'lost'
  board: [],
};

function createCell() {
  return {
    isMine: false, // Чи є тут міна (true/false)
    neighborCount: 0, // Кількість мін навколо (0-8)
    isOpen: false, // Чи відкрита клітинка (true/false)
    isFlagged: false, // Чи стоїть прапорець (true/false)
  };
}

function initGame() {
  gameState.board = [];

  for (let y = 0; y < gameState.rows; y++) {
    const row = [];

    for (let x = 0; x < gameState.cols; x++) {
      const cell = createCell();
      row.push(cell);
    }

    gameState.board.push(row);
  }

  gameState.board[0][0].isMine = true;

  gameState.board[4][4].isMine = true;

  gameState.board[0][1].neighborCount = 1;

  gameState.board[1][1].isOpen = true;

  console.log("Гра ініціалізована! Стан об'єкта gameState:", gameState);
  console.table(gameState.board);
}

initGame();
