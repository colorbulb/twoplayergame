import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const ROWS = 6;
const COLS = 7;

function ConnectFour() {
  const navigate = useNavigate();
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState('red');
  const [gameMode, setGameMode] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [playerColor, setPlayerColor] = useState(null);
  const [gameStatus, setGameStatus] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [winner, setWinner] = useState(null);

  function createEmptyBoard() {
    return Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
  }

  const checkWinner = useCallback((board, row, col, player) => {
    const directions = [
      [[0, 1], [0, -1]], // horizontal
      [[1, 0], [-1, 0]], // vertical
      [[1, 1], [-1, -1]], // diagonal
      [[1, -1], [-1, 1]] // anti-diagonal
    ];

    for (const [[dr1, dc1], [dr2, dc2]] of directions) {
      let count = 1;
      
      // Check first direction
      let r = row + dr1, c = col + dc1;
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
        count++;
        r += dr1;
        c += dc1;
      }
      
      // Check opposite direction
      r = row + dr2;
      c = col + dc2;
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
        count++;
        r += dr2;
        c += dc2;
      }
      
      if (count >= 4) return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (winner) {
      setGameStatus(`${winner.charAt(0).toUpperCase() + winner.slice(1)} wins! 🎉`);
    } else if (board[0].every(cell => cell !== null)) {
      setGameStatus("It's a Draw! 🤝");
    } else {
      setGameStatus(`${currentPlayer === 'red' ? '🔴 Red' : '🟡 Yellow'}'s turn`);
    }
  }, [board, currentPlayer, winner]);

  const dropDisc = (col) => {
    if (winner) return;
    
    if (gameMode === 'online' && playerColor !== currentPlayer) {
      return; // Not your turn
    }

    // Find the lowest empty row in the column
    for (let row = ROWS - 1; row >= 0; row--) {
      if (!board[row][col]) {
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = currentPlayer;
        setBoard(newBoard);
        
        if (checkWinner(newBoard, row, col, currentPlayer)) {
          setWinner(currentPlayer);
        } else {
          setCurrentPlayer(currentPlayer === 'red' ? 'yellow' : 'red');
        }
        return;
      }
    }
  };

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setCurrentPlayer('red');
    setWinner(null);
  };

  const startLocalGame = () => {
    setGameMode('local');
    setPlayerColor('red');
    resetGame();
  };

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(newRoomId);
    setPlayerColor('red');
    setGameMode('online');
    setIsWaiting(true);
    setTimeout(() => {
      setIsWaiting(false);
      setGameStatus('Opponent joined! Your turn (Red)');
    }, 2000);
    resetGame();
  };

  const joinRoom = () => {
    if (!roomId.trim()) return;
    setPlayerColor('yellow');
    setGameMode('online');
    setGameStatus("You are Yellow. Waiting for Red's move...");
    resetGame();
  };

  if (!gameMode) {
    return (
      <div className="game-container">
        <div className="game-header">
          <button className="back-button" onClick={() => navigate('/')}>
            ← Back
          </button>
          <h1 className="game-title">🔴🟡 Connect Four</h1>
        </div>

        <div className="room-container">
          <h2>Choose Game Mode</h2>
          
          <button className="game-button" onClick={startLocalGame}>
            🎮 Local 2-Player
          </button>
          
          <div style={{ margin: '30px 0' }}>
            <h3>Or Play Online</h3>
            <button className="game-button" onClick={createRoom}>
              🏠 Create Room
            </button>
            
            <div style={{ marginTop: '20px' }}>
              <input
                type="text"
                className="room-input"
                placeholder="Enter Room Code"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              />
              <button className="game-button secondary" onClick={joinRoom}>
                🚪 Join Room
              </button>
            </div>
          </div>
        </div>

        <div className="game-instructions">
          <h3>How to Play</h3>
          <ul>
            <li>Players take turns dropping discs into columns</li>
            <li>Discs fall to the lowest available space</li>
            <li>Connect 4 discs in a row (horizontal, vertical, or diagonal) to win</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <button className="back-button" onClick={() => setGameMode(null)}>
          ← Back
        </button>
        <h1 className="game-title">🔴🟡 Connect Four</h1>
      </div>

      {gameMode === 'online' && roomId && (
        <div className="game-status">
          Room Code: <strong>{roomId}</strong>
        </div>
      )}

      {isWaiting ? (
        <p className="waiting-message">Waiting for opponent to join...</p>
      ) : (
        <>
          <div className="game-status">{gameStatus}</div>
          
          <div className="connect-four-board">
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`connect-four-cell ${cell || ''} ${winner ? 'disabled' : ''}`}
                  onClick={() => dropDisc(colIndex)}
                />
              ))
            )}
          </div>

          <button className="game-button" onClick={resetGame}>
            🔄 New Game
          </button>
        </>
      )}
    </div>
  );
}

export default ConnectFour;
