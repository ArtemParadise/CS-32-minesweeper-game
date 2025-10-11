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

function placeMinesSafe(fr,fc){
  const safe = new Set([`${fr}:${fc}`]);
  for (const [dr,dc] of DIRS){
    const nr=fr+dr, nc=fc+dc;
    if (inBounds(nr,nc)) safe.add(`${nr}:${nc}`);
  }
  let placed=0;
  while (placed < minesCount){
    const r=Math.floor(Math.random()*rows), c=Math.floor(Math.random()*cols);
    const key=`${r}:${c}`;
    if (safe.has(key) || field[r][c].hasMine) continue;
    field[r][c].hasMine = true;
    placed++;
  }
  // подсчёт соседей
  for (let r=0;r<rows;r++){
    for (let c=0;c<cols;c++){
      let cnt=0;
      for (const [dr,dc] of DIRS){ const nr=r+dr, nc=c+dc; if (inBounds(nr,nc) && field[nr][nc].hasMine) cnt++; }
      field[r][c].neighborMines = cnt;
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

      gridEl.appendChild(btn);
    }
  }
  elFlags.textContent = String(minesCount - flagsPlaced).padStart(3,"0");
}

// ===== ЛОГИКА
function onLeft(r,c){
  if (gameStatus===GameStatus.WIN || gameStatus===GameStatus.LOSE) return;
  const cell = field[r][c];
  if (cell.state===CellState.FLAG || cell.state===CellState.OPEN) return;

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

  openFlood(r,c);
  if (checkWin()){ gameStatus=GameStatus.WIN; stopTimer(); }
  render();
}

function onRight(r,c){
  if (!firstClick) return;
  const cell = field[r][c];
  if (cell.state===CellState.OPEN) return;

  if (cell.state===CellState.FLAG){
    cell.state = CellState.CLOSED;
    flagsPlaced = Math.max(0, flagsPlaced-1);
  } else if (flagsPlaced < minesCount){
    cell.state = CellState.FLAG;
    flagsPlaced++;
  }
  render();
}

function openFlood(sr,sc){
  const stack=[[sr,sc]];
  while (stack.length){
    const [r,c]=stack.pop();
    const cell=field[r][c];
    if (cell.state===CellState.OPEN || cell.state===CellState.FLAG) continue;
    cell.state = CellState.OPEN;

    if (cell.neighborMines===0){
      for (const [dr,dc] of DIRS){
        const nr=r+dr, nc=c+dc;
        if (inBounds(nr,nc) && field[nr][nc].state!==CellState.OPEN){
          stack.push([nr,nc]);
        }
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
