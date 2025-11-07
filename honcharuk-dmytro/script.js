const CellState = { CLOSED: "closed", OPEN: "open", FLAG: "flag" };
const GameStatus = { RUNNING: "running", WIN: "win", LOSE: "lose" };

// Создание клетки
function makeCell(hasMine = false) {
  return {
    hasMine,
    neighborMines: 0,
    state: CellState.CLOSED,
  };
}
// Генерация пол
function placeMines({ field, mines, rows, cols }) {
  let placedMines = 0;

  while (placedMines < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);

    if (!field[r][c].hasMine) {
      field[r][c].hasMine = true;
      placedMines++;
    }
  }
}
function generateField(rows, cols, mines) {
  const field = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      hasMine: false,
      state: "closed",
      count: 0,
    }))
  );

  placeMines({ field, mines, rows, cols });

  field.forEach((row, r) => {
    row.forEach((cell, c) => {
      const directions = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ];
      let count = 0;
      directions.forEach(([dr, dc]) => {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nc >= 0 && nr < rows && nc < cols) {
          if (field[nr][nc].hasMine) count++;
        }
      });
      cell.neighborMines = count;
    });
  });

  return field;
}
//   console.log(generateField(8, 8, 10));
console.log("script2.js");
const newGameBtn = document.getElementById("new-game-btn");
newGameBtn.onclick = function () {
  const game = generateField(8, 8, 10);
  console.log("game2", game);
};

// Обновление поля в DOM
function updateBoard(field) {
  const grid = document.querySelector(".grid");
  grid.innerHTML = "";
  field.forEach((row, r) => {
    row.forEach((cell, c) => {
      const button = document.createElement("button");
      button.classList.add("cell");
      button.dataset.state = cell.state;
      button.dataset.count = cell.neighborMines;
      if (cell.state === "open") {
        button.textContent = cell.neighborMines === 0 ? "" : cell.neighborMines;
      } else if (cell.state === "flag") {
        button.textContent = "🚩";
      } else if (cell.state === "mine") {
        button.textContent = "💣";
      }
      button.addEventListener("click", () => openCell(field, r, c));
      button.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        toggleFlag(field, r, c);
      });
      grid.appendChild(button);
    });
  });
}
// Открытие клетки
function openCell(field, row, col) {
  const cell = field[row][col];
  if (cell.state === "open" || cell.state === "flagged") return;
  if (cell.hasMine) {
    console.log("Проигрыш, клетка с миной!");
    return;
  }
  cell.state = "open";
  if (cell.neighborMines === 0) {
    const directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];
    directions.forEach(([dr, dc]) => {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nc >= 0 && nr < field.length && nc < field[0].length) {
        openCell(field, nr, nc);
      }
    });
  }
  updateBoard(field);
}
// Флаг
function toggleFlag(field, row, col) {
  const cell = field[row][col];
  if (cell.state === "open") return;
  cell.state = cell.state === "flagged" ? "closed" : "flagged";
  updateBoard(field);
}
// Таймер
let timer;
let seconds = 0;
function startTimer() {
  timer = setInterval(() => {
    seconds++;
    document.getElementById("timer").textContent = seconds
      .toString()
      .padStart(3, "0");
  }, 1000);
}
function stopTimer() {
  clearInterval(timer);
}
// Новая игра
document.getElementById("new-game-btn").addEventListener("click", () => {
  const game = generateField(8, 8, 10);
  console.log("game-", game);
  updateBoard(game);
  seconds = 0;
  startTimer();
});
console.log("script.js");
