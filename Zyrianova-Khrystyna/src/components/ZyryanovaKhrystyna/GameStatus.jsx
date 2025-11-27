import React from 'react';
import styles from './Minesweeper.module.css';

const GameStatus = ({ gameStatus }) => {
  if (gameStatus === 'playing') {
    return null;
  }

  return (
    <div className={styles.status}>
      {gameStatus === 'won' ? 'Вітаю! Ти виграла!' : 'Гра завершена! Ти натрапила на міну.'}
    </div>
  );
};

export default GameStatus;

