import React from 'react';
import styles from './Cell.module.css';

const Cell = ({ row, col, value, isOpen, isFlagged, onClick, onRightClick }) => {
  const handleClick = () => {
    if (!isOpen && !isFlagged) {
      onClick(row, col);
    }
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    if (!isOpen) {
      onRightClick(row, col);
    }
  };

  const getCellContent = () => {
    if (!isOpen) {
      if (isFlagged) {
        return '🚩';
      }
      return '';
    }

    if (value === 'mine') {
      return '💣';
    }

    if (value > 0) {
      return value;
    }

    return '';
  };

  const getCellClasses = () => {
    const classes = [styles.cell];
    
    if (isOpen) {
      classes.push(styles.open);
      if (value === 'mine') {
        classes.push(styles.mine);
      } else if (value > 0) {
        classes.push(styles[`number${value}`]);
      }
    } else if (isFlagged) {
      classes.push(styles.flagged);
    }

    return classes.join(' ');
  };

  return (
    <div
      className={getCellClasses()}
      onClick={handleClick}
      onContextMenu={handleRightClick}
      data-value={isOpen && value > 0 ? value : undefined}
    >
      {getCellContent()}
    </div>
  );
};

export default Cell;

