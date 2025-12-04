import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const GRID_SIZE = 4;
const SWIPE_THRESHOLD = 30;

function Game2048() {
  const navigate = useNavigate();
  const [grid, setGrid] = useState(createEmptyGrid());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(
    parseInt(localStorage.getItem('2048BestScore')) || 0
  );
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const touchStartRef = useRef({ x: 0, y: 0 });

  function createEmptyGrid() {
    return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
  }

  const addRandomTile = useCallback((currentGrid) => {
    const emptyCells = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (currentGrid[i][j] === 0) {
          emptyCells.push({ row: i, col: j });
        }
      }
    }
    
    if (emptyCells.length === 0) return currentGrid;
    
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newGrid = currentGrid.map(row => [...row]);
    newGrid[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;
    return newGrid;
  }, []);

  const initializeGame = useCallback(() => {
    let newGrid = createEmptyGrid();
    newGrid = addRandomTile(newGrid);
    newGrid = addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
    setWon(false);
    setGameStarted(true);
  }, [addRandomTile]);

  const checkGameOver = useCallback((currentGrid) => {
    // Check for empty cells
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (currentGrid[i][j] === 0) return false;
      }
    }
    
    // Check for possible merges
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const current = currentGrid[i][j];
        if (j < GRID_SIZE - 1 && current === currentGrid[i][j + 1]) return false;
        if (i < GRID_SIZE - 1 && current === currentGrid[i + 1][j]) return false;
      }
    }
    
    return true;
  }, []);

  const moveLeft = useCallback((currentGrid) => {
    const newGrid = currentGrid.map(row => [...row]);
    let newScore = 0;
    let moved = false;
    
    for (let i = 0; i < GRID_SIZE; i++) {
      let row = newGrid[i].filter(cell => cell !== 0);
      
      for (let j = 0; j < row.length - 1; j++) {
        if (row[j] === row[j + 1]) {
          row[j] *= 2;
          newScore += row[j];
          if (row[j] === 2048) setWon(true);
          row[j + 1] = 0;
        }
      }
      
      row = row.filter(cell => cell !== 0);
      while (row.length < GRID_SIZE) row.push(0);
      
      if (newGrid[i].join(',') !== row.join(',')) moved = true;
      newGrid[i] = row;
    }
    
    return { grid: newGrid, score: newScore, moved };
  }, []);

  const rotateGrid = useCallback((currentGrid) => {
    const newGrid = createEmptyGrid();
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        newGrid[j][GRID_SIZE - 1 - i] = currentGrid[i][j];
      }
    }
    return newGrid;
  }, []);

  const move = useCallback((direction) => {
    if (gameOver) return;
    
    let currentGrid = grid.map(row => [...row]);
    let rotations = 0;
    
    switch (direction) {
      case 'left':
        rotations = 0;
        break;
      case 'up':
        rotations = 3;
        break;
      case 'right':
        rotations = 2;
        break;
      case 'down':
        rotations = 1;
        break;
      default:
        return;
    }
    
    // Rotate to perform left move
    for (let i = 0; i < rotations; i++) {
      currentGrid = rotateGrid(currentGrid);
    }
    
    const result = moveLeft(currentGrid);
    currentGrid = result.grid;
    
    // Rotate back
    for (let i = 0; i < (4 - rotations) % 4; i++) {
      currentGrid = rotateGrid(currentGrid);
    }
    
    if (result.moved) {
      currentGrid = addRandomTile(currentGrid);
      setGrid(currentGrid);
      setScore(prev => {
        const newScore = prev + result.score;
        if (newScore > bestScore) {
          setBestScore(newScore);
          localStorage.setItem('2048BestScore', newScore.toString());
        }
        return newScore;
      });
      
      if (checkGameOver(currentGrid)) {
        setGameOver(true);
      }
    }
  }, [grid, gameOver, moveLeft, addRandomTile, checkGameOver, bestScore, rotateGrid]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!gameStarted || gameOver) return;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          move('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          move('down');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          move('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          move('right');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [move, gameStarted, gameOver]);

  // Touch/swipe event handlers
  const handleTouchStart = useCallback((e) => {
    if (!gameStarted || gameOver) return;
    const touch = e.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, [gameStarted, gameOver]);

  const handleTouchMove = useCallback((e) => {
    if (!gameStarted || gameOver) return;
    // Prevent scrolling while swiping on the game board
    e.preventDefault();
  }, [gameStarted, gameOver]);

  const handleTouchEnd = useCallback((e) => {
    if (!gameStarted || gameOver) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    if (Math.max(absDeltaX, absDeltaY) < SWIPE_THRESHOLD) return;
    
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (deltaX > 0) {
        move('right');
      } else {
        move('left');
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        move('down');
      } else {
        move('up');
      }
    }
  }, [move, gameStarted, gameOver]);

  // Prevent body scrolling when game is active
  useEffect(() => {
    if (gameStarted && !gameOver) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [gameStarted, gameOver]);

  const getTileClass = (value) => {
    if (value === 0) return 'empty';
    return `tile-${Math.min(value, 2048)}`;
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1 className="game-title">🔢🎯 2048</h1>
      </div>

      {!gameStarted ? (
        <>
          <div className="game-instructions">
            <h3>How to Play</h3>
            <ul>
              <li>Swipe or use Arrow Keys to slide tiles</li>
              <li>Tiles with the same number merge when they touch</li>
              <li>Add them up to reach 2048!</li>
              <li>Game ends when no more moves are possible</li>
            </ul>
          </div>

          {bestScore > 0 && (
            <div className="game-status">
              🏆 Best Score: {bestScore}
            </div>
          )}

          <button className="game-button" onClick={initializeGame}>
            🎮 Start Game
          </button>
        </>
      ) : (
        <>
          <div className="game-status">
            Score: {score} | Best: {bestScore}
          </div>

          <div 
            className="game-2048-board"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none' }}
          >
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`game-2048-cell ${getTileClass(cell)}`}
                >
                  {cell !== 0 ? cell : ''}
                </div>
              ))
            )}
          </div>

          {won && !gameOver && (
            <div style={{ marginTop: '20px' }}>
              <h2>🎉 You Win!</h2>
              <p>You reached 2048! Keep playing for a higher score!</p>
            </div>
          )}

          {gameOver && (
            <div style={{ marginTop: '20px' }}>
              <h2>😢 Game Over!</h2>
              <p>Final Score: {score}</p>
              {score === bestScore && <p>🏆 New Best Score!</p>}
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
            <button className="game-button" onClick={initializeGame}>
              🔄 New Game
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Game2048;
