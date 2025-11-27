import React from 'react';
import Cell from './Cell';
import styles from './Minesweeper.module.css';

const Board = ({ board, onCellClick, onRightClick }) => {
  return (
    <div className={styles.board}>
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <Cell
            key={`${rowIndex}-${colIndex}`}
            row={rowIndex}
            col={colIndex}
            value={cell.value}
            isOpen={cell.isOpen}
            isFlagged={cell.isFlagged}
            onClick={onCellClick}
            onRightClick={onRightClick}
          />
        ))
      )}
    </div>
  );
};

export default Board;

