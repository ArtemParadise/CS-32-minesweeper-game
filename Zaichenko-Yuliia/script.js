// ===== СТАТИКА
const CellState = { CLOSED:"closed", OPEN:"open", FLAG:"flag", MINE:"mine", EXPLODED:"exploded" };
const GameStatus = { READY:"ready", RUNNING:"running", WIN:"win", LOSE:"lose" };
const DIRS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

// ===== ГЛОБАЛЬНЫЙ СТЕЙТ
let rows=10, cols=10, minesCount=10;
let field=[];
let gameStatus=GameStatus.READY;
let flagsPlaced=0;
let firstClick=false;

// ===== ТАЙМЕР
let timerId=null, seconds=0;
const elTimer = document.getElementById("timer");
const elFlags = document.getElementById("flags-left");
function resetTimer(){ clearInterval(timerId); timerId=null; seconds=0; elTimer.textContent="000"; }
function startTimer(){ if (timerId) return; timerId=setInterval(()=>{ seconds++; elTimer.textContent=String(seconds).padStart(3,"0"); },1000); }
function stopTimer(){ clearInterval(timerId); timerId=null; }

// ===== DOM
const gridEl = document.getElementById("grid");
document.addEventListener("contextmenu", e => e.preventDefault()); // блок контекстного меню ПКМ

// ===== УТИЛЫ
const inBounds = (r,c)=> r>=0 && c>=0 && r<rows && c<cols;
const makeCell = ()=>({ hasMine:false, neighborMines:0, state:CellState.CLOSED });

// ===== ГЕНЕРАЦИЯ
function generateEmpty(){
  field = Array.from({length:rows}, ()=> Array.from({length:cols}, makeCell));
}

/* ========= Модель стану гри ========= */
function makeGameState(rows, cols, mines) {
  return {
    rows,
    cols,
    mines,
    status: GameStatus.RUNNING,
    flagsLeft: mines,
    openedSafe: 0,
    board: Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => makeCell(false))
    ),
  };
}

/* ========= Утиліти для роботи з полем ========= */
function inBounds(game, row, col) {
  return row>= 0 && row < game.rows && col >= 0 && col < game.cols;
}

const DIRECTION_OFFSETS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

function neighbors(game, row, col) {
  const neighborCoordinates = [];
  for (const [deltaRow, deltaCol] of DIRECTION_OFFSETS) {
    const newRow = row + deltaRow,
      newCol = col + deltaCol;
    if (inBounds(game, newRow, newCol)) neighborCoordinates.push([newRow, newCol]);
  }
  return neighborCoordinates;
}

/* ========= Розстановка мін і підрахунок сусідів ========= */
function placeMinesRandomly(game) {
  const total = game.rows * game.cols;
  if (game.mines >= total) throw new Error("Занадто багато мін");

  const used = new Set();
  while (used.size < game.mines) {
    const randomIndex = Math.floor(Math.random() * total);
    if (used.has(randomIndex)) continue;
    used.add(randomIndex);
    const row = Math.floor(randomIndex / game.cols);
    const col = randomIndex % game.cols;
    game.board[row][col].hasMine = true;
  }

  for (let row = 0; row < game.rows; row++) {
    for (let col = 0; col < game.cols; col++) {
      if (game.board[row][col].hasMine) {
        game.board[row][col].neighborMines = 0;
        continue;
      }
      let neighborMineCount = 0;
      for (const [newRow, newCol] of neighbors(game, row, col)) {
        if (game.board[newRow][newCol].hasMine) neighborMineCount++;
      }
      game.board[row][col].neighborMines = neighborMineCount;
    }
  }
}

// ===== РЕНДЕР
function render(){
  gridEl.innerHTML = "";
  gridEl.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;

  for (let r=0;r<rows;r++){
    for (let c=0;c<cols;c++){
      const cell = field[r][c];
      const btn = document.createElement("button");
      btn.className = "cell";
      // классы состояния
      btn.classList.toggle("open", cell.state===CellState.OPEN);
      btn.classList.toggle("flag", cell.state===CellState.FLAG);
      btn.classList.toggle("mine", cell.state===CellState.MINE);
      btn.classList.toggle("exploded", cell.state===CellState.EXPLODED);

      // цифра
      btn.textContent = "";
      if (cell.state === CellState.OPEN && cell.neighborMines>0){
        btn.textContent = String(cell.neighborMines);
        btn.classList.add(`n${cell.neighborMines}`);
      }

      // иконки через текст (дублируем к ::after на всякий)
      if (cell.state === CellState.FLAG){ btn.textContent = "🚩"; }
      if (cell.state === CellState.MINE){ btn.textContent = "💣"; }
      if (cell.state === CellState.EXPLODED){ btn.textContent = "💥"; }

      btn.addEventListener("click", () => onLeft(r,c));
      btn.addEventListener("mousedown", (e)=>{ if (e.button===2) onRight(r,c); });


console.log("=== Приклад структури клітинки [0][0] ===");
console.log(game.board[0][0]); 

console.log("=== Двовимірний масив об’єктів (перший рядок) ===");
console.log(game.board[0]); 

printBoardPretty(boardToMineMap(game), "=== Карта мін (💣 | .) ===");
printBoardPretty(boardToNumbers(game), "=== Карта чисел (X = міна) ===");

console.log("=== Карта чисел (console.table) ===");
console.table(boardToNumbers(game));

/* ========= (Не обов’язково) Приклади змін стану ========= */
function toggleFlag(game, row, col) {
  const cell = game.board[row][col];
  if (cell.state === CellState.OPEN) return; 
  if (cell.state === CellState.FLAG) {
    cell.state = CellState.CLOSED;
    game.flagsLeft++;
  } else if (game.flagsLeft > 0) {
    cell.state = CellState.FLAG;
    game.flagsLeft--;
  }
  elFlags.textContent = String(minesCount - flagsPlaced).padStart(3,"0");
}


function openCell(game, row, col) {
  const cell = game.board[row][col];
  if (cell.state !== CellState.CLOSED) return;
  cell.state = CellState.OPEN;


  if (!firstClick){
    placeMinesSafe(r,c);
    firstClick = true;
    gameStatus = GameStatus.RUNNING;
    startTimer();
  }

  if (cell.hasMine){
    cell.state = CellState.EXPLODED;
    revealMines();
    gameStatus = GameStatus.LOSE;
    stopTimer();
    render();
    return;
  }

  game.openedSafe++;
  if (cell.neighborMines === 0) {
    for (const [newRow, newCol] of neighbors(game, row, col)) {
      if (
        game.board[newRow][newCol].state === CellState.CLOSED &&
        !game.board[newRow][newCol].hasMine
      ) {
        openCell(game, newRow, newCol);

      }
    }
  }
}

function revealMines(){
  for (let r=0;r<rows;r++){
    for (let c=0;c<cols;c++){
      const cell=field[r][c];
      if (cell.hasMine && cell.state!==CellState.EXPLODED){
        cell.state = CellState.MINE;
      }
    }
  }
}

function checkWin(){
  for (let r=0;r<rows;r++){
    for (let c=0;c<cols;c++){
      const cell=field[r][c];
      if (!cell.hasMine && cell.state!==CellState.OPEN) return false;
    }
  }
  return true;
}

// ===== НОВАЯ ИГРА
function newGame(r=10,c=10,m=10){
  rows=r; cols=c; minesCount=m;
  resetTimer();
  firstClick=false;
  flagsPlaced=0;
  gameStatus=GameStatus.READY;
  generateEmpty();
  render();
}
document.getElementById("new-game-btn").addEventListener("click", ()=> newGame(10,10,10));

// старт
newGame(10,10,10);
