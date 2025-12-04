import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';
import './AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const { currentUser, isAdmin, login, logout } = useAuth();
  const { getAllRooms, deleteRoom } = useGame();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [allRooms, setAllRooms] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const loadAllRooms = async () => {
    setIsLoading(true);
    const rooms = await getAllRooms();
    setAllRooms(rooms);
    setIsLoading(false);
  };

  useEffect(() => {
    if (currentUser && isAdmin) {
      loadAllRooms();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, isAdmin]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      await login(email, password);
      setSuccessMessage('Logged in successfully!');
    } catch (err) {
      setError('Failed to login: ' + err.message);
    }
    
    setIsLoading(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setAllRooms({});
    } catch (err) {
      setError('Failed to logout: ' + err.message);
    }
  };

  const handleDeleteRoom = async (gameType, roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) {
      return;
    }
    
    setIsLoading(true);
    const success = await deleteRoom(gameType, roomId);
    if (success) {
      setSuccessMessage('Room deleted successfully!');
      loadAllRooms();
    }
    setIsLoading(false);
  };

  const getStatusBadge = (status) => {
    const badges = {
      waiting: '🟡 Waiting',
      playing: '🟢 Playing',
      finished: '⚪ Finished'
    };
    return badges[status] || status;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleString();
  };

  // Login form for non-authenticated users
  if (!currentUser) {
    return (
      <div className="admin-container">
        <div className="admin-header">
          <button className="back-button" onClick={() => navigate('/')}>
            ← Back
          </button>
          <h1 className="admin-title">🔐 Admin Login</h1>
        </div>

        <div className="login-form-container">
          <form onSubmit={handleLogin} className="login-form">
            {error && <div className="admin-error">{error}</div>}
            {successMessage && <div className="admin-success">{successMessage}</div>}
            
            <input
              type="email"
              className="admin-input"
              placeholder="Admin Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              className="admin-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button 
              type="submit" 
              className="admin-button primary"
              disabled={isLoading}
            >
              {isLoading ? '⏳ Logging in...' : '🔓 Login'}
            </button>
          </form>
          
          <p className="admin-note">
            Note: Only admin accounts can access this dashboard.
          </p>
        </div>
      </div>
    );
  }

  // Access denied for non-admin users
  if (!isAdmin) {
    return (
      <div className="admin-container">
        <div className="admin-header">
          <button className="back-button" onClick={() => navigate('/')}>
            ← Back
          </button>
          <h1 className="admin-title">🚫 Access Denied</h1>
        </div>
        
        <div className="access-denied">
          <p>You don't have admin privileges.</p>
          <p>Logged in as: {currentUser.email}</p>
          <button className="admin-button secondary" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="admin-container">
      <div className="admin-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1 className="admin-title">🎛️ Admin Dashboard</h1>
      </div>

      <div className="admin-info">
        <span>Logged in as: {currentUser.email}</span>
        <button className="admin-button small" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}
      {successMessage && <div className="admin-success">{successMessage}</div>}

      <div className="admin-actions">
        <button 
          className="admin-button primary"
          onClick={loadAllRooms}
          disabled={isLoading}
        >
          🔄 Refresh Rooms
        </button>
      </div>

      <div className="rooms-section">
        <h2>📋 All Game Rooms</h2>
        
        {isLoading ? (
          <p className="loading-text">⏳ Loading rooms...</p>
        ) : Object.keys(allRooms).length === 0 ? (
          <p className="no-data-text">No rooms found.</p>
        ) : (
          Object.entries(allRooms).map(([gameType, rooms]) => (
            <div key={gameType} className="game-type-section">
              <h3 className="game-type-title">🎮 {gameType}</h3>
              
              {Object.entries(rooms).map(([roomId, room]) => (
                <div key={roomId} className="room-card">
                  <div className="room-card-header">
                    <span className="room-card-id">#{roomId.substring(0, 8)}</span>
                    <span className="room-card-status">{getStatusBadge(room.status)}</span>
                  </div>
                  
                  <div className="room-card-body">
                    <div className="room-card-row">
                      <span className="label">Host:</span>
                      <span>{room.host?.name || 'Unknown'}</span>
                    </div>
                    <div className="room-card-row">
                      <span className="label">Guest:</span>
                      <span>{room.guest?.name || 'Waiting...'}</span>
                    </div>
                    <div className="room-card-row">
                      <span className="label">Created:</span>
                      <span>{formatDate(room.createdAt)}</span>
                    </div>
                    {room.winner && (
                      <div className="room-card-row">
                        <span className="label">Winner:</span>
                        <span>🏆 {room.winner}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="room-card-actions">
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteRoom(gameType, roomId)}
                      disabled={isLoading}
                    >
                      🗑️ Delete Room
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
