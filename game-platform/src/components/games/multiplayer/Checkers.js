import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../../contexts/GameContext';
import RoomModal from '../../common/RoomModal';
import '../../common/RoomModal.css';

const BOARD_SIZE = 8;

function Checkers() {
  const navigate = useNavigate();
  const { 
    currentRoom, 
    playerRole, 
    subscribeToRoom, 
    updateGameState, 
    endGame, 
    leaveRoom 
  } = useGame();
  
  const [board, setBoard] = useState(createInitialBoard());
  const [currentPlayer, setCurrentPlayer] = useState('red');
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [gameMode, setGameMode] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [playerColor, setPlayerColor] = useState(null);
  const [gameStatus, setGameStatus] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [redPieces, setRedPieces] = useState(12);
  const [blackPieces, setBlackPieces] = useState(12);

  function createInitialBoard() {
    const newBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    
    // Place black pieces (top)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if ((row + col) % 2 === 1) {
          newBoard[row][col] = { color: 'black', isKing: false };
        }
      }
    }
    
    // Place red pieces (bottom)
    for (let row = 5; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if ((row + col) % 2 === 1) {
          newBoard[row][col] = { color: 'red', isKing: false };
        }
      }
    }
    
    return newBoard;
  }

  // Helper function to validate the board structure
  const isValidBoard = (board) => {
    if (!Array.isArray(board) || board.length !== BOARD_SIZE) return false;
    return board.every(row => Array.isArray(row) && row.length === BOARD_SIZE);
  };

  const getValidMoves = useCallback((row, col, boardState) => {
    const piece = boardState[row][col];
    if (!piece) return [];
    
    const moves = [];
    const directions = piece.isKing 
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : piece.color === 'red' 
        ? [[-1, -1], [-1, 1]]
        : [[1, -1], [1, 1]];
    
    // Regular moves
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
        if (!boardState[newRow][newCol]) {
          moves.push({ row: newRow, col: newCol, isJump: false });
        }
      }
    }
    
    // Jump moves (captures) - check all diagonal directions for kings
    const jumpDirections = piece.isKing 
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : piece.color === 'red' 
        ? [[-1, -1], [-1, 1]]
        : [[1, -1], [1, 1]];
    
    for (const [dr, dc] of jumpDirections) {
      const jumpRow = row + dr;
      const jumpCol = col + dc;
      const landRow = row + 2 * dr;
      const landCol = col + 2 * dc;
      
      if (landRow >= 0 && landRow < BOARD_SIZE && landCol >= 0 && landCol < BOARD_SIZE) {
        const jumpedPiece = boardState[jumpRow]?.[jumpCol];
        if (jumpedPiece && jumpedPiece.color !== piece.color && !boardState[landRow][landCol]) {
          moves.push({ row: landRow, col: landCol, isJump: true, jumpedRow: jumpRow, jumpedCol: jumpCol });
        }
      }
    }
    
    return moves;
  }, []);

  // Subscribe to room updates for online play
  useEffect(() => {
    if (gameMode === 'online' && roomId) {
      const unsubscribe = subscribeToRoom('checkers', roomId, (roomData) => {
        if (roomData.gameState) {
          const boardData = roomData.gameState.board;
          const validBoard = isValidBoard(boardData) ? boardData : createInitialBoard();
          setBoard(validBoard);
          setCurrentPlayer(roomData.currentTurn === 'host' ? 'red' : 'black');
          if (roomData.gameState.redPieces !== undefined) {
            setRedPieces(roomData.gameState.redPieces);
          }
          if (roomData.gameState.blackPieces !== undefined) {
            setBlackPieces(roomData.gameState.blackPieces);
          }
        }
        
        if (roomData.guest && isWaiting) {
          setIsWaiting(false);
          setGameStatus(`${roomData.guest.name} joined! Game on!`);
        }
        
        if (roomData.status === 'finished') {
          const winner = roomData.winner;
          setGameStatus(`${winner} wins! 🎉`);
        }
      });
      
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [gameMode, roomId, subscribeToRoom, isWaiting]);

  useEffect(() => {
    if (redPieces === 0) {
      setGameStatus('Black wins! 🎉');
      if (gameMode === 'online' && roomId) {
        endGame('checkers', roomId, 'Black');
      }
    } else if (blackPieces === 0) {
      setGameStatus('Red wins! 🎉');
      if (gameMode === 'online' && roomId) {
        endGame('checkers', roomId, 'Red');
      }
    } else if (gameMode === 'local') {
      setGameStatus(`${currentPlayer === 'red' ? '🔴 Red' : '⚫ Black'}'s turn`);
    } else if (gameMode === 'online' && currentRoom) {
      const isMyTurn = (playerRole === 'host' && currentPlayer === 'red') || (playerRole === 'guest' && currentPlayer === 'black');
      setGameStatus(isMyTurn ? 'Your turn!' : "Opponent's turn...");
    }
  }, [currentPlayer, redPieces, blackPieces, gameMode, roomId, playerRole, currentRoom, endGame]);

  const handleCellClick = async (row, col) => {
    if (redPieces === 0 || blackPieces === 0) return;
    
    if (gameMode === 'online') {
      const isMyTurn = (playerRole === 'host' && currentPlayer === 'red') || (playerRole === 'guest' && currentPlayer === 'black');
      if (!isMyTurn) return;
    }

    const piece = board[row][col];
    
    // If clicking on own piece, select it
    if (piece && piece.color === currentPlayer) {
      setSelectedPiece({ row, col });
      setValidMoves(getValidMoves(row, col, board));
      return;
    }
    
    // If a piece is selected and clicking on a valid move
    if (selectedPiece) {
      const move = validMoves.find(m => m.row === row && m.col === col);
      if (move) {
        const newBoard = board.map(r => r.map(c => c ? { ...c } : null));
        const movingPiece = { ...newBoard[selectedPiece.row][selectedPiece.col] };
        
        // Make the move
        newBoard[selectedPiece.row][selectedPiece.col] = null;
        newBoard[row][col] = movingPiece;
        
        // Check for king promotion
        if ((movingPiece.color === 'red' && row === 0) || (movingPiece.color === 'black' && row === BOARD_SIZE - 1)) {
          newBoard[row][col].isKing = true;
        }
        
        let newRedPieces = redPieces;
        let newBlackPieces = blackPieces;
        
        // Handle jump (capture)
        if (move.isJump) {
          const capturedPiece = newBoard[move.jumpedRow][move.jumpedCol];
          newBoard[move.jumpedRow][move.jumpedCol] = null;
          if (capturedPiece.color === 'red') {
            newRedPieces--;
          } else {
            newBlackPieces--;
          }
        }
        
        setBoard(newBoard);
        setRedPieces(newRedPieces);
        setBlackPieces(newBlackPieces);
        setSelectedPiece(null);
        setValidMoves([]);
        
        const nextPlayer = currentPlayer === 'red' ? 'black' : 'red';
        setCurrentPlayer(nextPlayer);
        
        if (gameMode === 'online' && roomId) {
          const nextTurn = playerRole === 'host' ? 'guest' : 'host';
          await updateGameState('checkers', roomId, { 
            board: newBoard, 
            redPieces: newRedPieces, 
            blackPieces: newBlackPieces 
          }, nextTurn);
        }
      }
    }
  };

  const resetGame = async () => {
    const newBoard = createInitialBoard();
    setBoard(newBoard);
    setCurrentPlayer('red');
    setSelectedPiece(null);
    setValidMoves([]);
    setRedPieces(12);
    setBlackPieces(12);
    
    if (gameMode === 'online' && roomId) {
      await updateGameState('checkers', roomId, { 
        board: newBoard, 
        redPieces: 12, 
        blackPieces: 12 
      }, 'host');
    }
  };

  const startLocalGame = () => {
    setGameMode('local');
    setPlayerColor('red');
    setBoard(createInitialBoard());
    setCurrentPlayer('red');
    setRedPieces(12);
    setBlackPieces(12);
  };

  const handleOnlineGame = () => {
    setShowRoomModal(true);
  };

  const handleGameStart = (newRoomId, role) => {
    setRoomId(newRoomId);
    setPlayerColor(role === 'host' ? 'red' : 'black');
    setGameMode('online');
    setIsWaiting(role === 'host');
    setShowRoomModal(false);
    setBoard(createInitialBoard());
    setCurrentPlayer('red');
    setRedPieces(12);
    setBlackPieces(12);
  };

  const handleLeaveGame = async () => {
    if (gameMode === 'online' && roomId) {
      await leaveRoom('checkers', roomId);
    }
    setGameMode(null);
    setRoomId('');
    setPlayerColor(null);
    setIsWaiting(false);
  };

  const isValidMove = (row, col) => {
    return validMoves.some(m => m.row === row && m.col === col);
  };

  if (!gameMode) {
    return (
      <div className="game-container">
        <div className="game-header">
          <button className="back-button" onClick={() => navigate('/')}>
            ← Back
          </button>
          <h1 className="game-title">🔴⚫ Checkers</h1>
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
            <li>Move diagonally on dark squares</li>
            <li>Jump over opponent's pieces to capture them</li>
            <li>Reach the opposite end to become a King</li>
            <li>Capture all opponent's pieces to win!</li>
          </ul>
        </div>

        <RoomModal
          isOpen={showRoomModal}
          onClose={() => setShowRoomModal(false)}
          gameType="checkers"
          gameName="Checkers"
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
        <h1 className="game-title">🔴⚫ Checkers</h1>
      </div>

      {gameMode === 'online' && roomId && (
        <div className="game-status">
          Room Code: <strong>{roomId.substring(0, 8)}</strong>
          {playerColor && <span> | You are: <strong style={{ color: playerColor === 'red' ? '#ef4444' : '#1f2937' }}>{playerColor.charAt(0).toUpperCase() + playerColor.slice(1)}</strong></span>}
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
          <div className="game-status" style={{ fontSize: '1rem' }}>
            🔴 Red: {redPieces} | ⚫ Black: {blackPieces}
          </div>
          
          <div className="checkers-board">
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isDark = (rowIndex + colIndex) % 2 === 1;
                const isSelected = selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex;
                const isValid = isValidMove(rowIndex, colIndex);
                
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`checkers-cell ${isDark ? 'dark' : 'light'} ${isSelected ? 'selected' : ''} ${isValid ? 'valid-move' : ''}`}
                    onClick={() => isDark && handleCellClick(rowIndex, colIndex)}
                  >
                    {cell && (
                      <div className={`checkers-piece ${cell.color} ${cell.isKing ? 'king' : ''}`}>
                        {cell.isKing && '👑'}
                      </div>
                    )}
                  </div>
                );
              })
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

export default Checkers;
