import React, { createContext, useContext, useState, useCallback } from 'react';
import { database } from '../config/firebase';
import { ref, set, get, onValue, off, remove, update } from 'firebase/database';

const GameContext = createContext();

export function useGame() {
  return useContext(GameContext);
}

// Room inactivity timeout: 5 minutes
const ROOM_INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

export function GameProvider({ children }) {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [playerRole, setPlayerRole] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState(null);

  // Generate a 4-letter room code
  const generateRoomCode = useCallback(() => {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude I and O to avoid confusion
    let code = '';
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(4);
      crypto.getRandomValues(array);
      for (let i = 0; i < 4; i++) {
        code += letters[array[i] % letters.length];
      }
    } else {
      for (let i = 0; i < 4; i++) {
        code += letters[Math.floor(Math.random() * letters.length)];
      }
    }
    return code;
  }, []);

  // Generate a unique player ID using crypto API when available
  const getPlayerId = useCallback(() => {
    let playerId = localStorage.getItem('playerId');
    if (!playerId) {
      // Use crypto.randomUUID if available, fallback to combination of crypto.getRandomValues
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        playerId = 'player_' + crypto.randomUUID().substring(0, 8);
      } else if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const array = new Uint32Array(2);
        crypto.getRandomValues(array);
        playerId = 'player_' + array[0].toString(36) + array[1].toString(36);
      } else {
        // Fallback for older browsers
        playerId = 'player_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
      }
      localStorage.setItem('playerId', playerId);
    }
    return playerId;
  }, []);

  // Create a new room
  const createRoom = useCallback(async (gameType, playerName) => {
    try {
      const playerId = getPlayerId();
      
      // Generate a unique 4-letter room code
      let roomId;
      let roomRef;
      let attempts = 0;
      const maxAttempts = 10;
      
      // Try to find a unique room code
      while (attempts < maxAttempts) {
        roomId = generateRoomCode();
        roomRef = ref(database, `rooms/${gameType}/${roomId}`);
        const snapshot = await get(roomRef);
        if (!snapshot.exists()) {
          break;
        }
        attempts++;
      }
      
      if (attempts >= maxAttempts) {
        setError('Failed to generate unique room code. Please try again.');
        return null;
      }
      
      const roomData = {
        id: roomId,
        gameType,
        host: {
          id: playerId,
          name: playerName || 'Player 1',
          ready: true
        },
        guest: null,
        status: 'waiting', // waiting, playing, finished
        gameState: null,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        currentTurn: 'host'
      };

      await set(roomRef, roomData);
      setCurrentRoom({ ...roomData, roomId });
      setPlayerRole('host');
      setError(null);
      return roomId;
    } catch (err) {
      setError('Failed to create room: ' + err.message);
      return null;
    }
  }, [getPlayerId, generateRoomCode]);

  // Join an existing room
  const joinRoom = useCallback(async (gameType, roomId, playerName) => {
    try {
      const playerId = getPlayerId();
      const roomRef = ref(database, `rooms/${gameType}/${roomId}`);
      const snapshot = await get(roomRef);
      
      if (!snapshot.exists()) {
        setError('Room not found');
        return false;
      }

      const roomData = snapshot.val();
      
      if (roomData.guest) {
        setError('Room is full');
        return false;
      }

      if (roomData.status !== 'waiting') {
        setError('Game already in progress');
        return false;
      }

      await update(roomRef, {
        guest: {
          id: playerId,
          name: playerName || 'Player 2',
          ready: true
        },
        status: 'playing',
        lastActivity: Date.now()
      });

      setCurrentRoom({ ...roomData, roomId, guest: { id: playerId, name: playerName || 'Player 2', ready: true } });
      setPlayerRole('guest');
      setError(null);
      return true;
    } catch (err) {
      setError('Failed to join room: ' + err.message);
      return false;
    }
  }, [getPlayerId]);

  // Get available rooms for a game type
  const getAvailableRooms = useCallback(async (gameType) => {
    try {
      const roomsRef = ref(database, `rooms/${gameType}`);
      const snapshot = await get(roomsRef);
      
      if (!snapshot.exists()) {
        setRooms([]);
        return [];
      }

      const roomsData = snapshot.val();
      const now = Date.now();
      const roomEntries = Object.entries(roomsData);
      
      // Clean up inactive rooms and filter available ones
      const availableRooms = [];
      for (const [id, room] of roomEntries) {
        const lastActivity = room.lastActivity || room.createdAt || 0;
        const isInactive = now - lastActivity > ROOM_INACTIVITY_TIMEOUT_MS;
        
        if (isInactive) {
          // Delete inactive room
          try {
            const inactiveRoomRef = ref(database, `rooms/${gameType}/${id}`);
            await remove(inactiveRoomRef);
          } catch (cleanupErr) {
            // Ignore cleanup errors
          }
        } else if (room.status === 'waiting' && !room.guest) {
          availableRooms.push({ ...room, roomId: id });
        }
      }
      
      setRooms(availableRooms);
      return availableRooms;
    } catch (err) {
      setError('Failed to fetch rooms: ' + err.message);
      return [];
    }
  }, []);

  // Subscribe to room updates
  const subscribeToRoom = useCallback((gameType, roomId, callback) => {
    const roomRef = ref(database, `rooms/${gameType}/${roomId}`);
    
    onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const roomData = { ...snapshot.val(), roomId };
        setCurrentRoom(roomData);
        setGameState(roomData.gameState);
        if (callback) callback(roomData);
      }
    });

    return () => off(roomRef);
  }, []);

  // Update game state
  const updateGameState = useCallback(async (gameType, roomId, newGameState, nextTurn) => {
    try {
      const roomRef = ref(database, `rooms/${gameType}/${roomId}`);
      await update(roomRef, { 
        gameState: newGameState,
        currentTurn: nextTurn,
        lastActivity: Date.now()
      });
      setError(null);
    } catch (err) {
      setError('Failed to update game: ' + err.message);
    }
  }, []);

  // End game
  const endGame = useCallback(async (gameType, roomId, winner) => {
    try {
      const roomRef = ref(database, `rooms/${gameType}/${roomId}`);
      await update(roomRef, { 
        status: 'finished',
        winner
      });
      setError(null);
    } catch (err) {
      setError('Failed to end game: ' + err.message);
    }
  }, []);

  // Leave room
  const leaveRoom = useCallback(async (gameType, roomId) => {
    try {
      const roomRef = ref(database, `rooms/${gameType}/${roomId}`);
      off(roomRef);
      
      if (playerRole === 'host') {
        // If host leaves, delete the room
        await remove(roomRef);
      } else {
        // If guest leaves, just remove guest
        await update(roomRef, { 
          guest: null, 
          status: 'waiting' 
        });
      }
      
      setCurrentRoom(null);
      setPlayerRole(null);
      setGameState(null);
      setError(null);
    } catch (err) {
      setError('Failed to leave room: ' + err.message);
    }
  }, [playerRole]);

  // Admin: Delete room
  const deleteRoom = useCallback(async (gameType, roomId) => {
    try {
      const roomRef = ref(database, `rooms/${gameType}/${roomId}`);
      await remove(roomRef);
      setError(null);
      return true;
    } catch (err) {
      setError('Failed to delete room: ' + err.message);
      return false;
    }
  }, []);

  // Admin: Get all rooms
  const getAllRooms = useCallback(async () => {
    try {
      const roomsRef = ref(database, 'rooms');
      const snapshot = await get(roomsRef);
      
      if (!snapshot.exists()) {
        return {};
      }

      return snapshot.val();
    } catch (err) {
      setError('Failed to fetch all rooms: ' + err.message);
      return {};
    }
  }, []);

  const value = {
    currentRoom,
    rooms,
    playerRole,
    gameState,
    error,
    createRoom,
    joinRoom,
    getAvailableRooms,
    subscribeToRoom,
    updateGameState,
    endGame,
    leaveRoom,
    deleteRoom,
    getAllRooms,
    getPlayerId
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
