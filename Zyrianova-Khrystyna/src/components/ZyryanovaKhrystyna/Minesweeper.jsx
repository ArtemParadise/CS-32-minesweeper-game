import React, { useState, useEffect, useCallback } from 'react';
import Board from './Board';
import Timer from './Timer';
import GameStatus from './GameStatus';
import styles from './Minesweeper.module.css';

const ROWS = 10;
const COLS = 10;
const MINES_COUNT = 10;

const Minesweeper = () => {
  const [board, setBoard] = useState([]);
  const [isFirstClick, setIsFirstClick] = useState(true);
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing' | 'won' | 'lost'
  const [flagsCount, setFlagsCount] = useState(MINES_COUNT);
  const [isRunning, setIsRunning] = useState(false);
  const [timerReset, setTimerReset] = useState(false);

  // Генерація порожньої дошки
  const generateEmptyBoard = useCallback(() => {
    const newBoard = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        row.push({
          mine: false,
          isOpen: false,
          isFlagged: false,
          value: 0, // 0-8 або 'mine'
        });
      }
      newBoard.push(row);
    }
    return newBoard;
  }, []);

  // Розміщення мін безпечним способом (після першого кліку)
  const placeMinesSafe = useCallback((excludeRow, excludeCol, currentBoard) => {
    const newBoard = currentBoard.map(row => row.map(cell => ({ ...cell })));
    const forbidden = new Set();

    // Забороняємо саму клітинку first click і її сусідів
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const rr = excludeRow + dr;
        const cc = excludeCol + dc;
        if (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS) {
          forbidden.add(`${rr}-${cc}`);
        }
      }
    }

    let placed = 0;
    while (placed < MINES_COUNT) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);
      const key = `${r}-${c}`;
      if (forbidden.has(key)) continue;
      if (!newBoard[r][c].mine) {
        newBoard[r][c].mine = true;
        newBoard[r][c].value = 'mine';
        placed++;
      }
    }

    return newBoard;
  }, []);

  // Підрахунок сусідніх мін
  const countAdjacentMines = useCallback((row, col, currentBoard) => {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          if (currentBoard[nr][nc].mine) {
            count++;
          }
        }
      }
    }
    return count;
  }, []);

  // Обчислення значень для всіх клітинок
  const calculateNeighbors = useCallback((currentBoard) => {
    const newBoard = currentBoard.map(row => row.map(cell => ({ ...cell })));
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!newBoard[r][c].mine) {
          newBoard[r][c].value = countAdjacentMines(r, c, newBoard);
        }
      }
    }
    return newBoard;
  }, [countAdjacentMines]);

  // Рекурсивне відкриття порожніх клітинок
  const floodFillOpen = useCallback((row, col, currentBoard) => {
    const newBoard = currentBoard.map(row => row.map(cell => ({ ...cell })));
    const stack = [[row, col]];

    while (stack.length > 0) {
      const [r, c] = stack.pop();
      
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
      if (newBoard[r][c].isOpen || newBoard[r][c].isFlagged) continue;
      if (newBoard[r][c].mine) continue;

      newBoard[r][c].isOpen = true;

      if (newBoard[r][c].value === 0) {
        // Додаємо сусідів до стеку
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
              if (!newBoard[nr][nc].isOpen && !newBoard[nr][nc].isFlagged) {
                stack.push([nr, nc]);
              }
            }
          }
        }
      }
    }

    return newBoard;
  }, []);

  // Відкриття клітинки
  const openCell = useCallback((row, col) => {
    if (gameStatus !== 'playing') return;

    setBoard((currentBoard) => {
      const cell = currentBoard[row][col];
      
      if (cell.isOpen || cell.isFlagged) {
        return currentBoard;
      }

      let newBoard = currentBoard.map(row => row.map(cell => ({ ...cell })));

      // Перший клік: розміщуємо міни та обчислюємо сусідів
      if (isFirstClick) {
        newBoard = placeMinesSafe(row, col, newBoard);
        newBoard = calculateNeighbors(newBoard);
        setIsFirstClick(false);
        setIsRunning(true);
      }

      // Перевірка на міну
      if (newBoard[row][col].mine) {
        newBoard[row][col].isOpen = true;
        // Показуємо всі міни
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            if (newBoard[r][c].mine && !newBoard[r][c].isOpen) {
              newBoard[r][c].isOpen = true;
            }
          }
        }
        setTimeout(() => {
          setGameStatus('lost');
          setIsRunning(false);
        }, 0);
      } else {
        // Відкриваємо клітинку
        if (newBoard[row][col].value === 0) {
          newBoard = floodFillOpen(row, col, newBoard);
        } else {
          newBoard[row][col].isOpen = true;
        }

        // Перевірка на перемогу
        let opened = 0;
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            if (newBoard[r][c].isOpen) {
              opened++;
            }
          }
        }
        if (opened === ROWS * COLS - MINES_COUNT) {
          setTimeout(() => {
            setGameStatus('won');
            setIsRunning(false);
          }, 0);
          // Показуємо всі міни
          for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
              if (newBoard[r][c].mine) {
                newBoard[r][c].isOpen = true;
              }
            }
          }
        }
      }

      return newBoard;
    });
  }, [gameStatus, isFirstClick, placeMinesSafe, calculateNeighbors, floodFillOpen]);


  // Перемикання прапорця
  const toggleFlag = useCallback((row, col) => {
    if (gameStatus !== 'playing') return;

    setBoard((currentBoard) => {
      const cell = currentBoard[row][col];
      
      if (cell.isOpen) {
        return currentBoard;
      }

      const newBoard = currentBoard.map(row => row.map(cell => ({ ...cell })));
      
      if (!newBoard[row][col].isFlagged && flagsCount > 0) {
        newBoard[row][col].isFlagged = true;
        setFlagsCount(prev => prev - 1);
      } else if (newBoard[row][col].isFlagged) {
        newBoard[row][col].isFlagged = false;
        setFlagsCount(prev => prev + 1);
      }

      return newBoard;
    });
  }, [gameStatus, flagsCount]);

  // Перезапуск гри
  const restartGame = useCallback(() => {
    setBoard(generateEmptyBoard());
    setIsFirstClick(true);
    setGameStatus('playing');
    setFlagsCount(MINES_COUNT);
    setIsRunning(false);
    setTimerReset(true);
    setTimeout(() => setTimerReset(false), 0);
  }, [generateEmptyBoard]);

  // Ініціалізація дошки
  useEffect(() => {
    setBoard(generateEmptyBoard());
  }, [generateEmptyBoard]);

  return (
    <div className={styles.container}>
      <div className={styles.gameInfo}>
        <div className={styles.flagsCounter}>
          Флаги: <span>{flagsCount}</span>
        </div>
        <button className={styles.restartButton} onClick={restartGame}>
          Старт
        </button>
        <div className={styles.timer}>
          Час: <Timer isRunning={isRunning} reset={timerReset} /> с
        </div>
      </div>

      <GameStatus gameStatus={gameStatus} />
      
      <Board
        board={board}
        onCellClick={openCell}
        onRightClick={toggleFlag}
      />
    </div>
  );
};

export default Minesweeper;

