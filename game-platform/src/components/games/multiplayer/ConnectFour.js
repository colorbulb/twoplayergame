import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../../contexts/GameContext';
import RoomModal from '../../common/RoomModal';
import '../../common/RoomModal.css';

const ROWS = 6;
const COLS = 7;

function ConnectFour() {
  const navigate = useNavigate();
  const { 
    currentRoom, 
    playerRole, 
    subscribeToRoom, 
    updateGameState, 
    endGame, 
    leaveRoom 
  } = useGame();
  
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState('red');
  const [gameMode, setGameMode] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [playerColor, setPlayerColor] = useState(null);
  const [gameStatus, setGameStatus] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [winner, setWinner] = useState(null);
  const [showRoomModal, setShowRoomModal] = useState(false);

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

  // Helper function to validate the board structure
  const isValidBoard = (board) => {
    if (!Array.isArray(board) || board.length !== ROWS) return false;
    return board.every(row => Array.isArray(row) && row.length === COLS);
  };

  useEffect(() => {
    if (gameMode === 'online' && roomId) {
      const unsubscribe = subscribeToRoom('connectfour', roomId, (roomData) => {
        if (roomData.gameState) {
          // Ensure board is a valid 2D array
          const boardData = roomData.gameState.board;
          const validBoard = isValidBoard(boardData) ? boardData : createEmptyBoard();
          setBoard(validBoard);
          setCurrentPlayer(roomData.currentTurn === 'host' ? 'red' : 'yellow');
          if (roomData.gameState.winner) {
            setWinner(roomData.gameState.winner);
          }
        }
        
        if (roomData.guest && isWaiting) {
          setIsWaiting(false);
          setGameStatus(`${roomData.guest.name} joined! Game on!`);
        }
      });
      
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [gameMode, roomId, subscribeToRoom, isWaiting]);

  useEffect(() => {
    if (winner) {
      setGameStatus(`${winner.charAt(0).toUpperCase() + winner.slice(1)} wins! 🎉`);
      if (gameMode === 'online' && roomId) {
        endGame('connectfour', roomId, winner);
      }
    } else if (board[0].every(cell => cell !== null)) {
      setGameStatus("It's a Draw! 🤝");
    } else if (gameMode === 'local') {
      setGameStatus(`${currentPlayer === 'red' ? '🔴 Red' : '🟡 Yellow'}'s turn`);
    } else if (gameMode === 'online' && currentRoom) {
      const isMyTurn = (playerRole === 'host' && currentPlayer === 'red') || (playerRole === 'guest' && currentPlayer === 'yellow');
      setGameStatus(isMyTurn ? 'Your turn!' : "Opponent's turn...");
    }
  }, [board, currentPlayer, winner, gameMode, roomId, playerRole, currentRoom, endGame]);

  const dropDisc = async (col) => {
    if (winner) return;
    
    if (gameMode === 'online') {
      const isMyTurn = (playerRole === 'host' && currentPlayer === 'red') || (playerRole === 'guest' && currentPlayer === 'yellow');
      if (!isMyTurn) return;
    }

    // Find the lowest empty row in the column
    for (let row = ROWS - 1; row >= 0; row--) {
      if (!board[row][col]) {
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = currentPlayer;
        setBoard(newBoard);
        
        const hasWinner = checkWinner(newBoard, row, col, currentPlayer);
        if (hasWinner) {
          setWinner(currentPlayer);
          if (gameMode === 'online' && roomId) {
            await updateGameState('connectfour', roomId, { board: newBoard, winner: currentPlayer }, playerRole === 'host' ? 'guest' : 'host');
          }
        } else {
          setCurrentPlayer(currentPlayer === 'red' ? 'yellow' : 'red');
          if (gameMode === 'online' && roomId) {
            await updateGameState('connectfour', roomId, { board: newBoard }, playerRole === 'host' ? 'guest' : 'host');
          }
        }
        return;
      }
    }
  };

  const resetGame = async () => {
    const newBoard = createEmptyBoard();
    setBoard(newBoard);
    setCurrentPlayer('red');
    setWinner(null);
    
    if (gameMode === 'online' && roomId) {
      await updateGameState('connectfour', roomId, { board: newBoard, winner: null }, 'host');
    }
  };

  const startLocalGame = () => {
    setGameMode('local');
    setPlayerColor('red');
    setBoard(createEmptyBoard());
    setCurrentPlayer('red');
    setWinner(null);
  };

  const handleOnlineGame = () => {
    setShowRoomModal(true);
  };

  const handleGameStart = (newRoomId, role) => {
    setRoomId(newRoomId);
    setPlayerColor(role === 'host' ? 'red' : 'yellow');
    setGameMode('online');
    setIsWaiting(role === 'host');
    setShowRoomModal(false);
    setBoard(createEmptyBoard());
    setCurrentPlayer('red');
    setWinner(null);
  };

  const handleLeaveGame = async () => {
    if (gameMode === 'online' && roomId) {
      await leaveRoom('connectfour', roomId);
    }
    setGameMode(null);
    setRoomId('');
    setPlayerColor(null);
    setIsWaiting(false);
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
          
          <button className="game-button" onClick={handleOnlineGame} style={{ marginTop: '15px' }}>
            🌐 Play Online
          </button>
        </div>

        <div className="game-instructions">
          <h3>How to Play</h3>
          <ul>
            <li>Players take turns dropping discs into columns</li>
            <li>Discs fall to the lowest available space</li>
            <li>Connect 4 discs in a row (horizontal, vertical, or diagonal) to win</li>
          </ul>
        </div>

        <RoomModal
          isOpen={showRoomModal}
          onClose={() => setShowRoomModal(false)}
          gameType="connectfour"
          gameName="Connect Four"
          onGameStart={handleGameStart}
        />
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <button className="back-button" onClick={handleLeaveGame}>
          ← Back
        </button>
        <h1 className="game-title">🔴🟡 Connect Four</h1>
      </div>

      {gameMode === 'online' && roomId && (
        <div className="game-status">
          Room Code: <strong>{roomId.substring(0, 8)}</strong>
          {playerColor && <span> | You are: <strong style={{ color: playerColor === 'red' ? '#ef4444' : '#fbbf24' }}>{playerColor.charAt(0).toUpperCase() + playerColor.slice(1)}</strong></span>}
        </div>
      )}

      {isWaiting ? (
        <div style={{ textAlign: 'center' }}>
          <p className="waiting-message">Waiting for opponent to join...</p>
          <p style={{ color: '#a0aec0' }}>Share your room code with a friend!</p>
        </div>
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
