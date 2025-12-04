import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../../contexts/GameContext';
import RoomModal from '../../common/RoomModal';
import '../../common/RoomModal.css';

const BOARD_SIZE = 10;
const SHIPS = [
  { name: 'Carrier', size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Cruiser', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Destroyer', size: 2 }
];

function Battleship() {
  const navigate = useNavigate();
  const { leaveRoom, subscribeToRoom, updateGameState, endGame } = useGame();
  
  const [gameMode, setGameMode] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [myRole, setMyRole] = useState(null); // 'host' or 'guest'
  const [isWaiting, setIsWaiting] = useState(false);
  const [phase, setPhase] = useState('placement'); // placement, waiting_opponent, playing, ended
  const [playerBoard, setPlayerBoard] = useState(createEmptyBoard());
  const [opponentBoard, setOpponentBoard] = useState(createEmptyBoard()); // What we know about opponent's board (hits/misses)
  const [opponentShipsBoard, setOpponentShipsBoard] = useState(null); // Actual opponent ships (for online mode)
  const [currentShipIndex, setCurrentShipIndex] = useState(0);
  const [isHorizontal, setIsHorizontal] = useState(true);
  const [playerShips, setPlayerShips] = useState([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameStatus, setGameStatus] = useState('');
  const [playerHits, setPlayerHits] = useState(0);
  const [opponentHits, setOpponentHits] = useState(0);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);

  function createEmptyBoard() {
    return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
  }

  const totalShipCells = SHIPS.reduce((sum, ship) => sum + ship.size, 0);

  // Helper to convert board for Firebase (null -> empty string)
  const boardToFirebase = useCallback((board) => board.map(row => row.map(cell => cell === null ? '' : cell)), []);
  
  // Helper to convert board from Firebase
  const boardFromFirebase = useCallback((board) => {
    if (!board) return createEmptyBoard();
    const boardArray = Array.isArray(board) ? board : Object.values(board);
    return boardArray.map(row => {
      const rowArray = Array.isArray(row) ? row : Object.values(row);
      return rowArray.map(cell => cell === '' ? null : cell);
    });
  }, []);

  // Subscribe to room updates for online play
  useEffect(() => {
    if (gameMode === 'online' && roomId) {
      const unsubscribe = subscribeToRoom('battleship', roomId, (roomData) => {
        // Guest joined
        if (roomData.guest && isWaiting) {
          setIsWaiting(false);
          setGameStatus(`${roomData.guest.name} joined! Place your ships!`);
        }

        // Handle game state updates
        if (roomData.gameState) {
          const gs = roomData.gameState;
          
          // Check if opponent is ready
          let opponentShips = null;
          if (myRole === 'host' && gs.guestReady) {
            setOpponentReady(true);
            opponentShips = boardFromFirebase(gs.guestBoard);
            setOpponentShipsBoard(opponentShips);
          } else if (myRole === 'guest' && gs.hostReady) {
            setOpponentReady(true);
            opponentShips = boardFromFirebase(gs.hostBoard);
            setOpponentShipsBoard(opponentShips);
          }

          // Update phase based on both players ready
          const bothReady = (myRole === 'host' && gs.hostReady && gs.guestReady) ||
                           (myRole === 'guest' && gs.hostReady && gs.guestReady);
          if (bothReady && phase === 'waiting_opponent') {
            setPhase('playing');
            setGameStatus(roomData.currentTurn === myRole ? "Your turn! Attack!" : "Opponent's turn...");
          }

          // Update turn
          setIsPlayerTurn(roomData.currentTurn === myRole);

          // Handle opponent's attack on our board (inline)
          const opponentAttacks = myRole === 'host' ? gs.guestAttacks : gs.hostAttacks;
          if (opponentAttacks) {
            const attacks = boardFromFirebase(opponentAttacks);
            setPlayerBoard(prevBoard => {
              const newBoard = prevBoard.map(r => [...r]);
              let hitsOnMe = 0;
              for (let r = 0; r < BOARD_SIZE; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                  if (attacks[r][c] === 'attacked') {
                    if (newBoard[r][c] === 'ship') {
                      newBoard[r][c] = 'hit';
                      hitsOnMe++;
                    } else if (newBoard[r][c] === null) {
                      newBoard[r][c] = 'miss';
                    }
                  }
                }
              }
              setOpponentHits(hitsOnMe);
              return newBoard;
            });
          }

          // Handle our view of opponent's board (inline)
          const myAttacks = myRole === 'host' ? gs.hostAttacks : gs.guestAttacks;
          const shipsBoard = opponentShips || opponentShipsBoard;
          if (myAttacks && shipsBoard) {
            const attacks = boardFromFirebase(myAttacks);
            setOpponentBoard(() => {
              const newBoard = createEmptyBoard();
              let myHits = 0;
              for (let r = 0; r < BOARD_SIZE; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                  if (attacks[r][c] === 'attacked') {
                    if (shipsBoard[r][c] === 'ship') {
                      newBoard[r][c] = 'hit';
                      myHits++;
                    } else {
                      newBoard[r][c] = 'miss';
                    }
                  }
                }
              }
              setPlayerHits(myHits);
              return newBoard;
            });
          }

          // Check for winner
          if (gs.winner) {
            setPhase('ended');
            if (gs.winner === myRole) {
              setGameStatus('You Win! 🎉 All enemy ships destroyed!');
            } else {
              setGameStatus('Game Over! Enemy wins! 😢');
            }
          }
        }
      });
      
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [gameMode, roomId, subscribeToRoom, isWaiting, myRole, phase, opponentShipsBoard, boardFromFirebase]);

  const canPlaceShip = useCallback((board, row, col, size, horizontal) => {
    for (let i = 0; i < size; i++) {
      const r = horizontal ? row : row + i;
      const c = horizontal ? col + i : col;
      if (r >= BOARD_SIZE || c >= BOARD_SIZE || board[r][c] === 'ship') {
        return false;
      }
    }
    return true;
  }, []);

  const placeShip = async (row, col) => {
    if (currentShipIndex >= SHIPS.length) return;
    
    const ship = SHIPS[currentShipIndex];
    if (!canPlaceShip(playerBoard, row, col, ship.size, isHorizontal)) {
      setGameStatus('Cannot place ship here!');
      return;
    }

    const newBoard = playerBoard.map(r => [...r]);
    const shipCells = [];
    
    for (let i = 0; i < ship.size; i++) {
      const r = isHorizontal ? row : row + i;
      const c = isHorizontal ? col + i : col;
      newBoard[r][c] = 'ship';
      shipCells.push({ row: r, col: c });
    }

    setPlayerBoard(newBoard);
    setPlayerShips([...playerShips, { ...ship, cells: shipCells }]);
    setCurrentShipIndex(currentShipIndex + 1);

    if (currentShipIndex + 1 >= SHIPS.length) {
      if (gameMode === 'online') {
        // Mark ourselves as ready and send our board
        const gameStateUpdate = myRole === 'host' 
          ? { hostReady: true, hostBoard: boardToFirebase(newBoard), hostAttacks: boardToFirebase(createEmptyBoard()) }
          : { guestReady: true, guestBoard: boardToFirebase(newBoard), guestAttacks: boardToFirebase(createEmptyBoard()) };
        
        await updateGameState('battleship', roomId, gameStateUpdate, 'host');
        
        if (opponentReady) {
          setPhase('playing');
          setGameStatus(myRole === 'host' ? "Your turn! Attack!" : "Opponent's turn...");
        } else {
          setPhase('waiting_opponent');
          setGameStatus("Waiting for opponent to place ships...");
        }
      } else {
        // Local game - vs computer
        setPhase('playing');
        setGameStatus("Your turn! Click on opponent's board to attack.");
        initializeOpponentShips();
      }
    } else {
      setGameStatus(`Place your ${SHIPS[currentShipIndex + 1].name} (${SHIPS[currentShipIndex + 1].size} cells)`);
    }
  };

  const initializeOpponentShips = useCallback(() => {
    const board = createEmptyBoard();
    
    for (const ship of SHIPS) {
      let placed = false;
      while (!placed) {
        const horizontal = Math.random() > 0.5;
        const maxRow = horizontal ? BOARD_SIZE : BOARD_SIZE - ship.size;
        const maxCol = horizontal ? BOARD_SIZE - ship.size : BOARD_SIZE;
        const row = Math.floor(Math.random() * maxRow);
        const col = Math.floor(Math.random() * maxCol);
        
        if (canPlaceShip(board, row, col, ship.size, horizontal)) {
          for (let i = 0; i < ship.size; i++) {
            const r = horizontal ? row : row + i;
            const c = horizontal ? col + i : col;
            board[r][c] = 'ship';
          }
          placed = true;
        }
      }
    }
    
    setOpponentShipsBoard(board);
    setOpponentBoard(createEmptyBoard());
  }, [canPlaceShip]);

  const handleAttack = async (row, col) => {
    if (phase !== 'playing' || !isPlayerTurn) return;
    if (opponentBoard[row][col] === 'hit' || opponentBoard[row][col] === 'miss') return;

    if (gameMode === 'online') {
      // Online multiplayer attack
      const attackKey = myRole === 'host' ? 'hostAttacks' : 'guestAttacks';
      
      // Get current attacks and add new one
      const newAttackBoard = opponentBoard.map(r => [...r]);
      newAttackBoard[row][col] = 'attacked';
      
      // Determine result based on opponent's ships
      const isHit = opponentShipsBoard && opponentShipsBoard[row][col] === 'ship';
      const newOpponentView = opponentBoard.map(r => [...r]);
      newOpponentView[row][col] = isHit ? 'hit' : 'miss';
      setOpponentBoard(newOpponentView);
      
      if (isHit) {
        const newHits = playerHits + 1;
        setPlayerHits(newHits);
        setGameStatus('Hit! 💥');
        
        if (newHits >= totalShipCells) {
          setPhase('ended');
          setGameStatus('You Win! 🎉 All enemy ships destroyed!');
          await endGame('battleship', roomId, myRole);
          return;
        }
      } else {
        setGameStatus('Miss! 💦');
      }

      // Update Firebase with attack and switch turn
      const nextTurn = myRole === 'host' ? 'guest' : 'host';
      await updateGameState('battleship', roomId, { 
        [attackKey]: boardToFirebase(newAttackBoard.map(r => r.map(c => c === 'hit' || c === 'miss' ? 'attacked' : c)))
      }, nextTurn);
      
      setIsPlayerTurn(false);
    } else {
      // Local game vs computer
      const newBoard = opponentBoard.map(r => [...r]);
      let newPlayerHits = playerHits;

      if (opponentShipsBoard[row][col] === 'ship') {
        newBoard[row][col] = 'hit';
        newPlayerHits++;
        setPlayerHits(newPlayerHits);
        setGameStatus('Hit! 💥');
      } else {
        newBoard[row][col] = 'miss';
        setGameStatus('Miss! 💦');
      }

      setOpponentBoard(newBoard);

      if (newPlayerHits >= totalShipCells) {
        setPhase('ended');
        setGameStatus('You Win! 🎉 All enemy ships destroyed!');
        return;
      }

      setIsPlayerTurn(false);
      
      // Opponent's turn (AI)
      setTimeout(() => {
        opponentAttack();
      }, 1000);
    }
  };

  const opponentAttack = () => {
    const newBoard = playerBoard.map(r => [...r]);
    let row, col;
    
    // Find a cell that hasn't been attacked
    do {
      row = Math.floor(Math.random() * BOARD_SIZE);
      col = Math.floor(Math.random() * BOARD_SIZE);
    } while (newBoard[row][col] === 'hit' || newBoard[row][col] === 'miss');

    let newOpponentHits = opponentHits;

    if (newBoard[row][col] === 'ship') {
      newBoard[row][col] = 'hit';
      newOpponentHits++;
      setOpponentHits(newOpponentHits);
    } else {
      newBoard[row][col] = 'miss';
    }

    setPlayerBoard(newBoard);

    if (newOpponentHits >= totalShipCells) {
      setPhase('ended');
      setGameStatus('Game Over! Enemy wins! 😢');
      return;
    }

    setIsPlayerTurn(true);
    setGameStatus("Your turn!");
  };

  const resetGame = () => {
    setPlayerBoard(createEmptyBoard());
    setOpponentBoard(createEmptyBoard());
    setOpponentShipsBoard(null);
    setCurrentShipIndex(0);
    setPlayerShips([]);
    setPhase('placement');
    setIsPlayerTurn(true);
    setPlayerHits(0);
    setOpponentHits(0);
    setOpponentReady(false);
    setGameStatus(`Place your ${SHIPS[0].name} (${SHIPS[0].size} cells)`);
  };

  const startLocalGame = () => {
    setGameMode('local');
    setMyRole(null);
    resetGame();
  };

  const handleOnlineGame = () => {
    setShowRoomModal(true);
  };

  const handleGameStart = (newRoomId, role) => {
    setRoomId(newRoomId);
    setMyRole(role);
    setGameMode('online');
    setIsWaiting(role === 'host');
    setShowRoomModal(false);
    resetGame();
  };

  const handleLeaveGame = async () => {
    if (gameMode === 'online' && roomId) {
      await leaveRoom('battleship', roomId);
    }
    setGameMode(null);
    setRoomId('');
    setMyRole(null);
    setIsWaiting(false);
  };

  const renderBoard = (board, isOpponentBoard = false) => (
    <div className="battleship-board">
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={`battleship-cell ${
              cell === 'ship' && !isOpponentBoard ? 'ship' : ''
            } ${cell === 'hit' ? 'hit' : ''} ${cell === 'miss' ? 'miss' : ''}`}
            onClick={() => 
              isOpponentBoard 
                ? handleAttack(rowIndex, colIndex)
                : phase === 'placement' && placeShip(rowIndex, colIndex)
            }
          />
        ))
      )}
    </div>
  );

  if (!gameMode) {
    return (
      <div className="game-container">
        <div className="game-header">
          <button className="back-button" onClick={() => navigate('/')}>
            ← Back
          </button>
          <h1 className="game-title">🚢💥 Battleship</h1>
        </div>

        <div className="room-container">
          <h2>Choose Game Mode</h2>
          
          <button className="game-button" onClick={startLocalGame}>
            🎮 Play vs Computer
          </button>
          
          <button className="game-button" onClick={handleOnlineGame} style={{ marginTop: '15px' }}>
            🌐 Play Online
          </button>
        </div>

        <div className="game-instructions">
          <h3>How to Play</h3>
          <ul>
            <li>Place your ships on your board</li>
            <li>Take turns attacking the opponent's board</li>
            <li>Red = Hit, Dark = Miss</li>
            <li>Sink all enemy ships to win!</li>
          </ul>
        </div>

        <RoomModal
          isOpen={showRoomModal}
          onClose={() => setShowRoomModal(false)}
          gameType="battleship"
          gameName="Battleship"
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
        <h1 className="game-title">🚢💥 Battleship</h1>
      </div>

      {gameMode === 'online' && roomId && (
        <div className="game-status">
          Room Code: <strong>{roomId.substring(0, 8)}</strong>
          {myRole && <span> | You are: <strong>{myRole === 'host' ? 'Player 1' : 'Player 2'}</strong></span>}
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

          {phase === 'placement' && (
            <div style={{ marginBottom: '20px' }}>
              <button 
                className="game-button secondary"
                onClick={() => setIsHorizontal(!isHorizontal)}
              >
                Rotate: {isHorizontal ? 'Horizontal ↔️' : 'Vertical ↕️'}
              </button>
            </div>
          )}

          <div className="battleship-container">
            <div>
              <h3>Your Fleet</h3>
              {renderBoard(playerBoard, false)}
            </div>
            {(phase === 'playing' || phase === 'ended') && (
              <div>
                <h3>Enemy Waters</h3>
                {renderBoard(opponentBoard, true)}
              </div>
            )}
          </div>

          <div style={{ marginTop: '20px' }}>
            <p>Your hits: {playerHits}/{totalShipCells} | Enemy hits: {opponentHits}/{totalShipCells}</p>
          </div>

          {phase === 'ended' && (
            <button className="game-button" onClick={resetGame}>
              🔄 New Game
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default Battleship;
