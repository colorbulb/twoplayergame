import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const [gameMode, setGameMode] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [phase, setPhase] = useState('placement'); // placement, playing, ended
  const [playerBoard, setPlayerBoard] = useState(createEmptyBoard());
  const [opponentBoard, setOpponentBoard] = useState(createEmptyBoard());
  const [currentShipIndex, setCurrentShipIndex] = useState(0);
  const [isHorizontal, setIsHorizontal] = useState(true);
  const [playerShips, setPlayerShips] = useState([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameStatus, setGameStatus] = useState('');
  const [playerHits, setPlayerHits] = useState(0);
  const [opponentHits, setOpponentHits] = useState(0);

  function createEmptyBoard() {
    return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
  }

  const totalShipCells = SHIPS.reduce((sum, ship) => sum + ship.size, 0);

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

  const placeShip = (row, col) => {
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
      setPhase('playing');
      setGameStatus("Your turn! Click on opponent's board to attack.");
      // Initialize opponent's ships randomly
      initializeOpponentShips();
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
    
    setOpponentBoard(board);
  }, [canPlaceShip]);

  const handleAttack = (row, col) => {
    if (phase !== 'playing' || !isPlayerTurn) return;
    if (opponentBoard[row][col] === 'hit' || opponentBoard[row][col] === 'miss') return;

    const newBoard = opponentBoard.map(r => [...r]);
    let newPlayerHits = playerHits;

    if (newBoard[row][col] === 'ship') {
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
    setCurrentShipIndex(0);
    setPlayerShips([]);
    setPhase('placement');
    setIsPlayerTurn(true);
    setPlayerHits(0);
    setOpponentHits(0);
    setGameStatus(`Place your ${SHIPS[0].name} (${SHIPS[0].size} cells)`);
  };

  const startLocalGame = () => {
    setGameMode('local');
    resetGame();
  };

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(newRoomId);
    setGameMode('online');
    setIsWaiting(true);
    setTimeout(() => {
      setIsWaiting(false);
      resetGame();
    }, 2000);
  };

  const joinRoom = () => {
    if (!roomId.trim()) return;
    setGameMode('online');
    resetGame();
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
            <li>Place your ships on your board</li>
            <li>Take turns attacking the opponent's board</li>
            <li>Red = Hit, Dark = Miss</li>
            <li>Sink all enemy ships to win!</li>
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
        <h1 className="game-title">🚢💥 Battleship</h1>
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
            {phase !== 'placement' && (
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
