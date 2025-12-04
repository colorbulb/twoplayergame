import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../../contexts/GameContext';
import RoomModal from '../../common/RoomModal';
import '../../common/RoomModal.css';

function TicTacToe() {
  const navigate = useNavigate();
  const { 
    currentRoom, 
    playerRole, 
    subscribeToRoom, 
    updateGameState, 
    endGame, 
    leaveRoom 
  } = useGame();
  
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [gameMode, setGameMode] = useState(null); // 'local' or 'online'
  const [roomId, setRoomId] = useState('');
  const [playerSymbol, setPlayerSymbol] = useState(null);
  const [gameStatus, setGameStatus] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);

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

  // Subscribe to room updates for online play
  useEffect(() => {
    if (gameMode === 'online' && roomId) {
      const unsubscribe = subscribeToRoom('tictactoe', roomId, (roomData) => {
        if (roomData.gameState) {
          // Ensure board is a valid array
          const boardData = roomData.gameState.board;
          const validBoard = Array.isArray(boardData) && boardData.length === 9 
            ? boardData 
            : Array(9).fill(null);
          setBoard(validBoard);
          setIsXNext(roomData.currentTurn === 'host');
        }
        
        if (roomData.guest && isWaiting) {
          setIsWaiting(false);
          setGameStatus(`${roomData.guest.name} joined! Game on!`);
        }
        
        if (roomData.status === 'finished') {
          const winner = roomData.winner;
          if (winner === 'draw') {
            setGameStatus("It's a Draw! 🤝");
          } else {
            setGameStatus(`${winner} wins! 🎉`);
          }
        }
      });
      
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [gameMode, roomId, subscribeToRoom, isWaiting]);

  useEffect(() => {
    const winner = calculateWinner(board);
    if (winner) {
      setGameStatus(`Winner: ${winner}! 🎉`);
      if (gameMode === 'online' && roomId) {
        endGame('tictactoe', roomId, winner);
      }
    } else if (board.every(cell => cell !== null)) {
      setGameStatus("It's a Draw! 🤝");
      if (gameMode === 'online' && roomId) {
        endGame('tictactoe', roomId, 'draw');
      }
    } else if (gameMode === 'local') {
      setGameStatus(`Current turn: ${isXNext ? 'X' : 'O'}`);
    } else if (gameMode === 'online' && currentRoom) {
      const isMyTurn = (playerRole === 'host' && isXNext) || (playerRole === 'guest' && !isXNext);
      setGameStatus(isMyTurn ? 'Your turn!' : "Opponent's turn...");
    }
  }, [board, isXNext, calculateWinner, gameMode, roomId, playerRole, currentRoom, endGame]);

  const handleClick = async (index) => {
    if (board[index] || calculateWinner(board)) return;
    
    if (gameMode === 'online') {
      const isMyTurn = (playerRole === 'host' && isXNext) || (playerRole === 'guest' && !isXNext);
      if (!isMyTurn) return;
    }

    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);

    if (gameMode === 'online' && roomId) {
      const nextTurn = isXNext ? 'guest' : 'host';
      await updateGameState('tictactoe', roomId, { board: newBoard }, nextTurn);
    }
  };

  const resetGame = async () => {
    const newBoard = Array(9).fill(null);
    setBoard(newBoard);
    setIsXNext(true);
    
    if (gameMode === 'online' && roomId) {
      await updateGameState('tictactoe', roomId, { board: newBoard }, 'host');
    }
  };

  const startLocalGame = () => {
    setGameMode('local');
    setPlayerSymbol('X');
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  const handleOnlineGame = () => {
    setShowRoomModal(true);
  };

  const handleGameStart = (newRoomId, role) => {
    setRoomId(newRoomId);
    setPlayerRole(role);
    setPlayerSymbol(role === 'host' ? 'X' : 'O');
    setGameMode('online');
    setIsWaiting(role === 'host');
    setShowRoomModal(false);
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  const handleLeaveGame = async () => {
    if (gameMode === 'online' && roomId) {
      await leaveRoom('tictactoe', roomId);
    }
    setGameMode(null);
    setRoomId('');
    setPlayerSymbol(null);
    setIsWaiting(false);
  };

  const setPlayerRole = (role) => {
    // This is handled by the context but we need local state too
  };

  const renderCell = (index) => (
    <button
      key={index}
      className={`tictactoe-cell ${board[index] ? board[index].toLowerCase() : ''} ${calculateWinner(board) ? 'disabled' : ''}`}
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
          
          <button className="game-button" onClick={handleOnlineGame} style={{ marginTop: '15px' }}>
            🌐 Play Online
          </button>
        </div>

        <div className="game-instructions">
          <h3>How to Play</h3>
          <ul>
            <li>Players take turns placing X or O on the grid</li>
            <li>First to get 3 in a row (horizontal, vertical, or diagonal) wins</li>
            <li>If all 9 squares are filled with no winner, it's a draw</li>
          </ul>
        </div>

        <RoomModal
          isOpen={showRoomModal}
          onClose={() => setShowRoomModal(false)}
          gameType="tictactoe"
          gameName="Tic Tac Toe"
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
        <h1 className="game-title">❌⭕ Tic Tac Toe</h1>
      </div>

      {gameMode === 'online' && roomId && (
        <div className="game-status">
          Room Code: <strong>{roomId.substring(0, 8)}</strong>
          {playerSymbol && <span> | You are: <strong>{playerSymbol}</strong></span>}
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
