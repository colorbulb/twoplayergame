import React, { useState, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import './RoomModal.css';

function RoomModal({ isOpen, onClose, gameType, gameName, onGameStart }) {
  const { createRoom, joinRoom, getAvailableRooms, rooms, error } = useGame();
  const [view, setView] = useState('menu'); // menu, create, join, browse
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [createdRoomId, setCreatedRoomId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const loadRooms = async () => {
    setIsLoading(true);
    await getAvailableRooms(gameType);
    setIsLoading(false);
  };

  useEffect(() => {
    if (view === 'browse') {
      loadRooms();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setLocalError('Please enter your name');
      return;
    }
    
    setIsLoading(true);
    setLocalError(null);
    const roomId = await createRoom(gameType, playerName);
    setIsLoading(false);
    
    if (roomId) {
      setCreatedRoomId(roomId);
      setView('waiting');
    }
  };

  const handleJoinRoom = async (targetRoomId) => {
    const roomIdToJoin = targetRoomId || roomCode.trim();
    
    if (!roomIdToJoin) {
      setLocalError('Please enter a room code');
      return;
    }
    
    if (!playerName.trim()) {
      setLocalError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setLocalError(null);
    const success = await joinRoom(gameType, roomIdToJoin, playerName);
    setIsLoading(false);
    
    if (success) {
      onGameStart(roomIdToJoin, 'guest');
    }
  };

  const handleStartGame = () => {
    if (createdRoomId) {
      onGameStart(createdRoomId, 'host');
    }
  };

  const handleClose = () => {
    setView('menu');
    setPlayerName('');
    setRoomCode('');
    setCreatedRoomId(null);
    setLocalError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>×</button>
        
        <h2 className="modal-title">🎮 {gameName} - Multiplayer</h2>

        {(error || localError) && (
          <div className="modal-error">{error || localError}</div>
        )}

        {view === 'menu' && (
          <div className="modal-menu">
            <button className="modal-button primary" onClick={() => setView('create')}>
              🏠 Create Room
            </button>
            <button className="modal-button secondary" onClick={() => setView('join')}>
              🔑 Enter Room Code
            </button>
            <button className="modal-button secondary" onClick={() => setView('browse')}>
              🔍 Browse Available Rooms
            </button>
          </div>
        )}

        {view === 'create' && (
          <div className="modal-form">
            <input
              type="text"
              className="modal-input"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
            />
            <button 
              className="modal-button primary" 
              onClick={handleCreateRoom}
              disabled={isLoading}
            >
              {isLoading ? '⏳ Creating...' : '✨ Create Room'}
            </button>
            <button className="modal-button back" onClick={() => setView('menu')}>
              ← Back
            </button>
          </div>
        )}

        {view === 'waiting' && (
          <div className="modal-waiting">
            <div className="room-code-display">
              <span className="room-code-label">Room Code:</span>
              <span className="room-code-value">{createdRoomId}</span>
            </div>
            <p className="waiting-text">
              ⏳ Waiting for another player to join...
            </p>
            <p className="share-text">
              Share this code with your friend!
            </p>
            <button 
              className="modal-button primary"
              onClick={handleStartGame}
            >
              🎮 Start Game (Wait in Game)
            </button>
            <button className="modal-button back" onClick={handleClose}>
              ❌ Cancel
            </button>
          </div>
        )}

        {view === 'join' && (
          <div className="modal-form">
            <input
              type="text"
              className="modal-input"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
            />
            <input
              type="text"
              className="modal-input room-code-input"
              placeholder="Enter 4-letter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
              maxLength={4}
            />
            <button 
              className="modal-button primary" 
              onClick={() => handleJoinRoom()}
              disabled={isLoading}
            >
              {isLoading ? '⏳ Joining...' : '🚪 Join Room'}
            </button>
            <button className="modal-button back" onClick={() => setView('menu')}>
              ← Back
            </button>
          </div>
        )}

        {view === 'browse' && (
          <div className="modal-browse">
            <input
              type="text"
              className="modal-input"
              placeholder="Enter your name to join a room"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
            />
            {!playerName.trim() && (
              <p className="name-hint-text">⚠️ Please enter your name above to enable joining</p>
            )}
            
            <div className="rooms-list">
              {isLoading ? (
                <p className="loading-text">⏳ Loading rooms...</p>
              ) : rooms.length === 0 ? (
                <p className="no-rooms-text">No available rooms. Create one!</p>
              ) : (
                rooms.map((room) => (
                  <div key={room.roomId} className="room-item">
                    <div className="room-info">
                      <span className="room-host">🎮 {room.host?.name || 'Unknown'}</span>
                      <span className="room-id">#{room.roomId}</span>
                    </div>
                    <button 
                      className="room-join-button"
                      onClick={() => handleJoinRoom(room.roomId)}
                      disabled={isLoading || !playerName.trim()}
                    >
                      Join
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <button className="modal-button refresh" onClick={loadRooms} disabled={isLoading}>
              🔄 Refresh
            </button>
            <button className="modal-button back" onClick={() => setView('menu')}>
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoomModal;
