import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

function TicTacToe() {
  const navigate = useNavigate();
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [gameMode, setGameMode] = useState(null); // 'local' or 'online'
  const [roomId, setRoomId] = useState('');
  const [playerSymbol, setPlayerSymbol] = useState(null);
  const [gameStatus, setGameStatus] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);

  const calculateWinner = useCallback((squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  }, []);

  useEffect(() => {
    const winner = calculateWinner(board);
    if (winner) {
      setGameStatus(`Winner: ${winner}! 🎉`);
    } else if (board.every(cell => cell !== null)) {
      setGameStatus("It's a Draw! 🤝");
    } else {
      setGameStatus(`Current turn: ${isXNext ? 'X' : 'O'}`);
    }
  }, [board, isXNext, calculateWinner]);

  const handleClick = (index) => {
    if (board[index] || calculateWinner(board)) return;
    
    if (gameMode === 'online' && playerSymbol !== (isXNext ? 'X' : 'O')) {
      return; // Not your turn
    }

    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  const startLocalGame = () => {
    setGameMode('local');
    setPlayerSymbol('X');
    resetGame();
  };

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(newRoomId);
    setPlayerSymbol('X');
    setGameMode('online');
    setIsWaiting(true);
    // In a real app, this would connect to a WebSocket server
    // For demo purposes, we'll simulate an opponent joining after 2 seconds
    setTimeout(() => {
      setIsWaiting(false);
      setGameStatus('Opponent joined! Your turn (X)');
    }, 2000);
    resetGame();
  };

  const joinRoom = () => {
    if (!roomId.trim()) return;
    setPlayerSymbol('O');
    setGameMode('online');
    setGameStatus("You are O. Waiting for X's move...");
    resetGame();
  };

  const renderCell = (index) => (
    <button
      key={index}
      className={`tictactoe-cell ${board[index]?.toLowerCase()} ${calculateWinner(board) ? 'disabled' : ''}`}
      onClick={() => handleClick(index)}
    >
      {board[index]}
    </button>
  );

  if (!gameMode) {
    return (
      <div className="game-container">
        <div className="game-header">
          <button className="back-button" onClick={() => navigate('/')}>
            ← Back
          </button>
          <h1 className="game-title">❌⭕ Tic Tac Toe</h1>
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
            <li>Players take turns placing X or O on the grid</li>
            <li>First to get 3 in a row (horizontal, vertical, or diagonal) wins</li>
            <li>If all 9 squares are filled with no winner, it's a draw</li>
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
        <h1 className="game-title">❌⭕ Tic Tac Toe</h1>
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
          
          <div className="tictactoe-board">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => renderCell(index))}
          </div>

          <button className="game-button" onClick={resetGame}>
            🔄 New Game
          </button>
        </>
      )}
    </div>
  );
}

export default TicTacToe;
