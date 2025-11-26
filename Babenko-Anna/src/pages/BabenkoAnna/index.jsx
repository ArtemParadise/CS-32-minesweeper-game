import React, { useState, useEffect, useCallback } from 'react';
import styles from './Minesweeper.module.css';

const CELL_STATE = {
  CLOSED: 'closed',
  OPEN: 'open',
  FLAGGED: 'flagged',
};

const createCell = () => ({
  hasMine: false,
  adjacentMines: 0,
  state: CELL_STATE.CLOSED,
  exploded: false,
});

const getDirections = () => [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1]
];

const countNeighbourMines = (board, row, col, rows, cols) => {
  let count = 0;
  getDirections().forEach(([dr, dc]) => {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].hasMine) {
      count++;
    }
  });
  return count;
};

const generateBoard = (rows, cols, mines) => {
  const board = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => createCell())
  );

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
        board[r][c].adjacentMines = countNeighbourMines(board, r, c, rows, cols);
      }
    }
  }
  return board;
};

const Cell = ({ row, col, data, onClick, onContextMenu }) => {
  let classNames = [styles.cell];
  let content = '';

  if (data.state === CELL_STATE.CLOSED) {
    classNames.push(styles.closed);
  } else if (data.state === CELL_STATE.FLAGGED) {
    classNames.push(styles.flag);
    content = '🚩';
  } else if (data.state === CELL_STATE.OPEN) {
    classNames.push(styles.open);
    if (data.hasMine) {
      content = '💣';
      if (data.exploded) classNames.push(styles.exploded);
      else classNames.push(styles.mine);
    } else if (data.adjacentMines > 0) {
      content = data.adjacentMines;
      classNames.push(styles[`count${data.adjacentMines}`]);
    }
  }

  return (
    <div
      className={classNames.join(' ')}
      onClick={() => onClick(row, col)}
      onContextMenu={(e) => onContextMenu(e, row, col)}
      data-row={row}
      data-col={col}
    >
      {content}
    </div>
  );
};

const Board = ({ board, rows, cols, onCellClick, onCellContextMenu }) => {
  const gridStyle = {
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
  };

  return (
    <div className={styles.board}>
      <div className={styles.grid} style={gridStyle}>
        {board.map((row, rIndex) =>
          row.map((cell, cIndex) => (
            <Cell
              key={`${rIndex}-${cIndex}`}
              row={rIndex}
              col={cIndex}
              data={cell}
              onClick={onCellClick}
              onContextMenu={onCellContextMenu}
            />
          ))
        )}
      </div>
    </div>
  );
};

const GameHeader = ({ flagsLeft, seconds, status, onReset }) => {
  const getStatusEmoji = () => {
    if (status === 'victory') return '😎';
    if (status === 'defeat') return '😵';
    return '🙂';
  };

  return (
    <header className={styles.header}>
      <div className={styles.statusDisplay}>
        🚩 <span>{String(flagsLeft).padStart(2, '0')}</span>
      </div>
      <button className={styles.startButton} onClick={onReset}>
        {getStatusEmoji()}
      </button>
      <div className={styles.statusDisplay}>
        ⏳ <span>{String(seconds).padStart(3, '0')}</span>
      </div>
    </header>
  );
};

export default function BabenkoAnnaMinesweeper() {
  const ROWS = 10;
  const COLS = 10;
  const MINES = 12;

  const [board, setBoard] = useState([]);
  const [status, setStatus] = useState('new');
  const [flagsLeft, setFlagsLeft] = useState(MINES);
  const [seconds, setSeconds] = useState(0);

  const initGame = useCallback(() => {
    const newBoard = generateBoard(ROWS, COLS, MINES);
    setBoard(newBoard);
    setStatus('new');
    setFlagsLeft(MINES);
    setSeconds(0);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    let timerId;
    if (status === 'in-progress') {
      timerId = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [status]);

  const openCell = (currentBoard, r, c) => {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    const cell = currentBoard[r][c];
    if (cell.state !== CELL_STATE.CLOSED) return;

    cell.state = CELL_STATE.OPEN;

    if (cell.adjacentMines === 0 && !cell.hasMine) {
      getDirections().forEach(([dr, dc]) => {
        openCell(currentBoard, r + dr, c + dc);
      });
    }
  };

  const handleCellClick = (r, c) => {
    if (status === 'defeat' || status === 'victory') return;
    if (status === 'new') setStatus('in-progress');

    const newBoard = [...board.map(row => [...row.map(cell => ({...cell}))])];
    const cell = newBoard[r][c];

    if (cell.state === CELL_STATE.FLAGGED) return;

    if (cell.hasMine) {
      cell.state = CELL_STATE.OPEN;
      cell.exploded = true;
      setStatus('defeat');
      newBoard.forEach(row => row.forEach(c => {
        if (c.hasMine) c.state = CELL_STATE.OPEN;
      }));
    } else {
      openCell(newBoard, r, c);
      checkWin(newBoard);
    }

    setBoard(newBoard);
  };

  const handleContextMenu = (e, r, c) => {
    e.preventDefault();
    if (status === 'defeat' || status === 'victory') return;
    if (status === 'new') setStatus('in-progress');

    const newBoard = [...board.map(row => [...row.map(cell => ({...cell}))])];
    const cell = newBoard[r][c];

    if (cell.state === CELL_STATE.CLOSED && flagsLeft > 0) {
      cell.state = CELL_STATE.FLAGGED;
      setFlagsLeft(prev => prev - 1);
    } else if (cell.state === CELL_STATE.FLAGGED) {
      cell.state = CELL_STATE.CLOSED;
      setFlagsLeft(prev => prev + 1);
    }
    setBoard(newBoard);
  };

  const checkWin = (currentBoard) => {
    let closedCount = 0;
    currentBoard.forEach(row => row.forEach(c => {
      if (c.state === CELL_STATE.CLOSED || c.state === CELL_STATE.FLAGGED) closedCount++;
    }));

    if (closedCount === MINES) {
      setStatus('victory');
    }
  };

  return (
    <div className={styles.app}>
      <GameHeader 
        flagsLeft={flagsLeft} 
        seconds={seconds} 
        status={status} 
        onReset={initGame} 
      />
      <Board 
        board={board} 
        rows={ROWS} 
        cols={COLS} 
        onCellClick={handleCellClick}
        onCellContextMenu={handleContextMenu}
      />
    </div>
  );
}