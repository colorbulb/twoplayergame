import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const BOARD_SIZE = 20;
const INITIAL_SPEED = 150;
const MIN_SPEED = 50;
const SPEED_DECREASE = 10;
const SCORE_THRESHOLD = 50;

function Snake() {
  const navigate = useNavigate();
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [direction, setDirection] = useState('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(
    parseInt(localStorage.getItem('snakeHighScore')) || 0
  );
  const [isPaused, setIsPaused] = useState(false);

  const generateFood = useCallback(() => {
    const isPositionOnSnake = (pos) => {
      return snake.some(segment => segment.x === pos.x && segment.y === pos.y);
    };
    
    let position = {
      x: Math.floor(Math.random() * BOARD_SIZE),
      y: Math.floor(Math.random() * BOARD_SIZE)
    };
    
    while (isPositionOnSnake(position)) {
      position = {
        x: Math.floor(Math.random() * BOARD_SIZE),
        y: Math.floor(Math.random() * BOARD_SIZE)
      };
    }
    return position;
  }, [snake]);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood({ x: 15, y: 15 });
    setDirection('RIGHT');
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
  };

  const startGame = () => {
    resetGame();
    setGameStarted(true);
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!gameStarted || gameOver) return;
      
      switch (e.key) {
        case 'ArrowUp':
          if (direction !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
          if (direction !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
          if (direction !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
          if (direction !== 'LEFT') setDirection('RIGHT');
          break;
        case ' ':
          setIsPaused(prev => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, gameStarted, gameOver]);

  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

    const moveSnake = () => {
      const head = { ...snake[0] };

      switch (direction) {
        case 'UP':
          head.y -= 1;
          break;
        case 'DOWN':
          head.y += 1;
          break;
        case 'LEFT':
          head.x -= 1;
          break;
        case 'RIGHT':
          head.x += 1;
          break;
        default:
          break;
      }

      // Check wall collision
      if (head.x < 0 || head.x >= BOARD_SIZE || head.y < 0 || head.y >= BOARD_SIZE) {
        setGameOver(true);
        if (score > highScore) {
          setHighScore(score);
          localStorage.setItem('snakeHighScore', score.toString());
        }
        return;
      }

      // Check self collision
      if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        if (score > highScore) {
          setHighScore(score);
          localStorage.setItem('snakeHighScore', score.toString());
        }
        return;
      }

      const newSnake = [head, ...snake];

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => prev + 10);
        setFood(generateFood());
      } else {
        newSnake.pop();
      }

      setSnake(newSnake);
    };

    const speed = Math.max(MIN_SPEED, INITIAL_SPEED - Math.floor(score / SCORE_THRESHOLD) * SPEED_DECREASE);
    const gameInterval = setInterval(moveSnake, speed);
    return () => clearInterval(gameInterval);
  }, [snake, direction, food, gameStarted, gameOver, isPaused, score, highScore, generateFood]);

  const renderBoard = () => {
    const cells = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        const isSnake = snake.some(segment => segment.x === x && segment.y === y);
        const isFood = food.x === x && food.y === y;
        cells.push(
          <div
            key={`${x}-${y}`}
            className={`snake-cell ${isSnake ? 'snake' : ''} ${isFood ? 'food' : ''}`}
          />
        );
      }
    }
    return cells;
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1 className="game-title">🐍🍎 Snake</h1>
      </div>

      {!gameStarted ? (
        <>
          <div className="game-instructions">
            <h3>How to Play</h3>
            <ul>
              <li>Use Arrow Keys to control the snake</li>
              <li>Eat the red food to grow and score points</li>
              <li>Don't hit the walls or yourself!</li>
              <li>Press Space to pause</li>
            </ul>
          </div>

          {highScore > 0 && (
            <div className="game-status">
              🏆 High Score: {highScore}
            </div>
          )}

          <button className="game-button" onClick={startGame}>
            🎮 Start Game
          </button>
        </>
      ) : (
        <>
          <div className="game-status">
            Score: {score} | High Score: {highScore}
            {isPaused && <span style={{ color: '#fbbf24' }}> (PAUSED)</span>}
          </div>

          <div className="snake-board">
            {renderBoard()}
          </div>

          {gameOver && (
            <div style={{ marginTop: '20px' }}>
              <h2>💀 Game Over!</h2>
              <p>Final Score: {score}</p>
              {score === highScore && score > 0 && <p>🏆 New High Score!</p>}
              <button className="game-button" onClick={startGame}>
                🔄 Play Again
              </button>
            </div>
          )}

          {!gameOver && (
            <div style={{ marginTop: '20px' }}>
              <button 
                className="game-button secondary"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? '▶️ Resume' : '⏸️ Pause'}
              </button>
            </div>
          )}

          {/* Mobile Controls */}
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <button 
              className="game-button secondary" 
              style={{ padding: '15px 30px' }}
              onClick={() => direction !== 'DOWN' && setDirection('UP')}
            >
              ⬆️
            </button>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="game-button secondary" 
                style={{ padding: '15px 30px' }}
                onClick={() => direction !== 'RIGHT' && setDirection('LEFT')}
              >
                ⬅️
              </button>
              <button 
                className="game-button secondary" 
                style={{ padding: '15px 30px' }}
                onClick={() => direction !== 'LEFT' && setDirection('RIGHT')}
              >
                ➡️
              </button>
            </div>
            <button 
              className="game-button secondary" 
              style={{ padding: '15px 30px' }}
              onClick={() => direction !== 'UP' && setDirection('DOWN')}
            >
              ⬇️
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Snake;
