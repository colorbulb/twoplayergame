import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const BOARD_SIZE = 10;
const MINE_COUNT = 15;

function Minesweeper() {
  const navigate = useNavigate();
  const [board, setBoard] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [flagged, setFlagged] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [minesLeft, setMinesLeft] = useState(MINE_COUNT);

  const initializeBoard = useCallback(() => {
    // Create empty board
    const newBoard = Array(BOARD_SIZE).fill(null).map(() => 
      Array(BOARD_SIZE).fill(0)
    );
    
    // Place mines
    let minesPlaced = 0;
    while (minesPlaced < MINE_COUNT) {
      const row = Math.floor(Math.random() * BOARD_SIZE);
      const col = Math.floor(Math.random() * BOARD_SIZE);
      if (newBoard[row][col] !== -1) {
        newBoard[row][col] = -1;
        minesPlaced++;
      }
    }
    
    // Calculate numbers
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (newBoard[i][j] === -1) continue;
        
        let count = 0;
        for (let di = -1; di <= 1; di++) {
          for (let dj = -1; dj <= 1; dj++) {
            const ni = i + di;
            const nj = j + dj;
            if (ni >= 0 && ni < BOARD_SIZE && nj >= 0 && nj < BOARD_SIZE) {
              if (newBoard[ni][nj] === -1) count++;
            }
          }
        }
        newBoard[i][j] = count;
      }
    }
    
    setBoard(newBoard);
    setRevealed(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(false)));
    setFlagged(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(false)));
    setGameOver(false);
    setGameWon(false);
    setMinesLeft(MINE_COUNT);
    setGameStarted(true);
  }, []);

  const revealCell = useCallback((row, col, currentRevealed) => {
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return currentRevealed;
    if (currentRevealed[row][col]) return currentRevealed;
    if (flagged[row][col]) return currentRevealed;
    
    const newRevealed = currentRevealed.map(r => [...r]);
    newRevealed[row][col] = true;
    
    // If cell is empty (0), reveal neighbors
    if (board[row][col] === 0) {
      for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
          if (di !== 0 || dj !== 0) {
            const result = revealCell(row + di, col + dj, newRevealed);
            for (let i = 0; i < BOARD_SIZE; i++) {
              for (let j = 0; j < BOARD_SIZE; j++) {
                newRevealed[i][j] = result[i][j];
              }
            }
          }
        }
      }
    }
    
    return newRevealed;
  }, [board, flagged]);

  const handleClick = (row, col) => {
    if (gameOver || gameWon) return;
    if (flagged[row][col]) return;
    if (revealed[row][col]) return;
    
    if (board[row][col] === -1) {
      // Hit a mine
      const newRevealed = revealed.map(r => [...r]);
      // Reveal all mines
      for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
          if (board[i][j] === -1) {
            newRevealed[i][j] = true;
          }
        }
      }
      setRevealed(newRevealed);
      setGameOver(true);
    } else {
      const newRevealed = revealCell(row, col, revealed);
      setRevealed(newRevealed);
      
      // Check win condition
      let unrevealedSafe = 0;
      for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
          if (!newRevealed[i][j] && board[i][j] !== -1) {
            unrevealedSafe++;
          }
        }
      }
      
      if (unrevealedSafe === 0) {
        setGameWon(true);
      }
    }
  };

  const handleRightClick = (e, row, col) => {
    e.preventDefault();
    if (gameOver || gameWon) return;
    if (revealed[row][col]) return;
    
    const newFlagged = flagged.map(r => [...r]);
    newFlagged[row][col] = !newFlagged[row][col];
    setFlagged(newFlagged);
    setMinesLeft(minesLeft + (newFlagged[row][col] ? -1 : 1));
  };

  const getCellContent = (row, col) => {
    if (flagged[row][col] && !revealed[row][col]) return '🚩';
    if (!revealed[row][col]) return '';
    if (board[row][col] === -1) return '💣';
    if (board[row][col] === 0) return '';
    return board[row][col];
  };

  const getCellClass = (row, col) => {
    let classes = 'minesweeper-cell';
    if (revealed[row][col]) {
      classes += ' revealed';
      if (board[row][col] === -1) {
        classes += ' mine';
      } else if (board[row][col] > 0) {
        classes += ` num-${board[row][col]}`;
      }
    }
    if (flagged[row][col] && !revealed[row][col]) {
      classes += ' flagged';
    }
    return classes;
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1 className="game-title">💣🚩 Minesweeper</h1>
      </div>

      {!gameStarted ? (
        <>
          <div className="game-instructions">
            <h3>How to Play</h3>
            <ul>
              <li>Left-click to reveal a cell</li>
              <li>Right-click to place/remove a flag</li>
              <li>Numbers show how many mines are adjacent</li>
              <li>Reveal all non-mine cells to win</li>
              <li>Hit a mine and it's game over!</li>
            </ul>
          </div>

          <button className="game-button" onClick={initializeBoard}>
            🎮 Start Game
          </button>
        </>
      ) : (
        <>
          <div className="game-status">
            💣 Mines Left: {minesLeft}
          </div>

          <div className="minesweeper-board">
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={getCellClass(rowIndex, colIndex)}
                  onClick={() => handleClick(rowIndex, colIndex)}
                  onContextMenu={(e) => handleRightClick(e, rowIndex, colIndex)}
                >
                  {getCellContent(rowIndex, colIndex)}
                </div>
              ))
            )}
          </div>

          {gameWon && (
            <div style={{ marginTop: '20px' }}>
              <h2>🎉 You Win!</h2>
              <p>Congratulations! You cleared all the mines!</p>
            </div>
          )}

          {gameOver && !gameWon && (
            <div style={{ marginTop: '20px' }}>
              <h2>💥 Game Over!</h2>
              <p>You hit a mine!</p>
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
            <button className="game-button" onClick={initializeBoard}>
              🔄 New Game
            </button>
          </div>

          <p style={{ marginTop: '20px', color: '#a0aec0', fontSize: '0.9rem' }}>
            Tip: On mobile, long-press to place a flag
          </p>
        </>
      )}
    </div>
  );
}

export default Minesweeper;
