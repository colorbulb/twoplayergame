import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const GRID_SIZE = 9;
const BOX_SIZE = 3;

function Sudoku() {
  const navigate = useNavigate();
  const [grid, setGrid] = useState(createEmptyGrid());
  const [initialGrid, setInitialGrid] = useState(createEmptyGrid());
  const [selectedCell, setSelectedCell] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [isComplete, setIsComplete] = useState(false);
  const [errors, setErrors] = useState([]);

  function createEmptyGrid() {
    return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
  }

  const isValidPlacement = useCallback((grid, row, col, num) => {
    // Check row
    for (let c = 0; c < GRID_SIZE; c++) {
      if (c !== col && grid[row][c] === num) return false;
    }
    
    // Check column
    for (let r = 0; r < GRID_SIZE; r++) {
      if (r !== row && grid[r][col] === num) return false;
    }
    
    // Check 3x3 box
    const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
    const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
    for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
      for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
        if ((r !== row || c !== col) && grid[r][c] === num) return false;
      }
    }
    
    return true;
  }, []);

  // Helper function to shuffle an array (Fisher-Yates algorithm)
  const shuffleArray = useCallback((array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  const solveSudoku = useCallback((grid) => {
    const newGrid = grid.map(row => [...row]);
    // Pre-shuffle numbers once for initial randomization
    const baseNums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    
    const solve = () => {
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (newGrid[row][col] === 0) {
            // Use base shuffled array with rotation based on position for variety
            const offset = (row + col) % 9;
            const nums = [...baseNums.slice(offset), ...baseNums.slice(0, offset)];
            
            for (const num of nums) {
              if (isValidPlacement(newGrid, row, col, num)) {
                newGrid[row][col] = num;
                if (solve()) return true;
                newGrid[row][col] = 0;
              }
            }
            return false;
          }
        }
      }
      return true;
    };
    
    solve();
    return newGrid;
  }, [isValidPlacement, shuffleArray]);

  const generatePuzzle = useCallback((difficultyLevel) => {
    // Create a solved grid
    const solved = solveSudoku(createEmptyGrid());
    
    // Remove numbers based on difficulty
    const cellsToRemove = {
      easy: 35,
      medium: 45,
      hard: 55
    }[difficultyLevel] || 45;
    
    const puzzle = solved.map(row => [...row]);
    const positions = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        positions.push([r, c]);
      }
    }
    
    // Shuffle positions
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    
    // Remove cells
    for (let i = 0; i < cellsToRemove && i < positions.length; i++) {
      const [r, c] = positions[i];
      puzzle[r][c] = 0;
    }
    
    return puzzle;
  }, [solveSudoku]);

  const startGame = () => {
    const puzzle = generatePuzzle(difficulty);
    setGrid(puzzle.map(row => [...row]));
    setInitialGrid(puzzle.map(row => [...row]));
    setSelectedCell(null);
    setErrors([]);
    setIsComplete(false);
    setGameStarted(true);
  };

  const handleCellClick = (row, col) => {
    if (initialGrid[row][col] !== 0) return; // Can't modify initial cells
    setSelectedCell({ row, col });
  };

  const handleNumberInput = (num) => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    if (initialGrid[row][col] !== 0) return;
    
    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = num;
    setGrid(newGrid);
    
    // Check for errors
    const newErrors = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (newGrid[r][c] !== 0 && !isValidPlacement(newGrid, r, c, newGrid[r][c])) {
          newErrors.push(`${r}-${c}`);
        }
      }
    }
    setErrors(newErrors);
    
    // Check if complete
    const isFilled = newGrid.every(row => row.every(cell => cell !== 0));
    if (isFilled && newErrors.length === 0) {
      setIsComplete(true);
    }
  };

  const handleClear = () => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    if (initialGrid[row][col] !== 0) return;
    
    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = 0;
    setGrid(newGrid);
    
    // Recalculate errors
    const newErrors = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (newGrid[r][c] !== 0 && !isValidPlacement(newGrid, r, c, newGrid[r][c])) {
          newErrors.push(`${r}-${c}`);
        }
      }
    }
    setErrors(newErrors);
  };

  const isError = (row, col) => errors.includes(`${row}-${col}`);
  const isInitial = (row, col) => initialGrid[row][col] !== 0;
  const isSelected = (row, col) => selectedCell?.row === row && selectedCell?.col === col;
  const isSameNumber = (row, col) => {
    if (!selectedCell || grid[selectedCell.row][selectedCell.col] === 0) return false;
    return grid[row][col] === grid[selectedCell.row][selectedCell.col] && grid[row][col] !== 0;
  };

  const getBoxBorder = (row, col) => {
    const classes = [];
    if (row % BOX_SIZE === 0) classes.push('box-top');
    if (col % BOX_SIZE === 0) classes.push('box-left');
    if (row === GRID_SIZE - 1) classes.push('box-bottom');
    if (col === GRID_SIZE - 1) classes.push('box-right');
    return classes.join(' ');
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1 className="game-title">🔢📝 Sudoku</h1>
      </div>

      {!gameStarted ? (
        <>
          <div className="game-instructions">
            <h3>How to Play</h3>
            <ul>
              <li>Fill in the 9×9 grid with digits 1-9</li>
              <li>Each row must contain all digits 1-9</li>
              <li>Each column must contain all digits 1-9</li>
              <li>Each 3×3 box must contain all digits 1-9</li>
            </ul>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#00d4ff' }}>Select Difficulty</h3>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '15px' }}>
              {['easy', 'medium', 'hard'].map((d) => (
                <button
                  key={d}
                  className={`game-button ${difficulty === d ? '' : 'secondary'}`}
                  onClick={() => setDifficulty(d)}
                  style={{ minWidth: '100px' }}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button className="game-button" onClick={startGame}>
            🎮 Start Game
          </button>
        </>
      ) : (
        <>
          {isComplete && (
            <div className="game-status" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
              🎉 Congratulations! Puzzle Complete!
            </div>
          )}

          <div className="sudoku-board">
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`sudoku-cell ${getBoxBorder(rowIndex, colIndex)} ${isInitial(rowIndex, colIndex) ? 'initial' : ''} ${isSelected(rowIndex, colIndex) ? 'selected' : ''} ${isError(rowIndex, colIndex) ? 'error' : ''} ${isSameNumber(rowIndex, colIndex) ? 'same-number' : ''}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  {cell !== 0 ? cell : ''}
                </div>
              ))
            )}
          </div>

          <div className="sudoku-controls">
            <div className="sudoku-numbers">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  className="sudoku-number-btn"
                  onClick={() => handleNumberInput(num)}
                  disabled={!selectedCell}
                >
                  {num}
                </button>
              ))}
            </div>
            <button
              className="game-button secondary"
              onClick={handleClear}
              disabled={!selectedCell}
              style={{ marginTop: '10px' }}
            >
              🗑️ Clear Cell
            </button>
          </div>

          <div style={{ marginTop: '20px' }}>
            <button className="game-button" onClick={startGame}>
              🔄 New Game
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Sudoku;
