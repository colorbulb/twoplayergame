import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import Home from './pages/Home';
import DevTools from './components/common/DevTools';
import { MultiplayerRoutes, SinglePlayerRoutes, AdminRoutes } from './routes';

function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<Home />} />
              
              {/* Multiplayer Games */}
              <Route path="/multiplayer/*" element={<MultiplayerRoutes />} />
              
              {/* Single Player Games */}
              <Route path="/singleplayer/*" element={<SinglePlayerRoutes />} />
              
              {/* Admin Dashboard */}
              <Route path="/admin/*" element={<AdminRoutes />} />
              
              {/* Legacy routes for backward compatibility */}
              <Route path="/tictactoe" element={<Navigate to="/multiplayer/tictactoe" replace />} />
              <Route path="/connectfour" element={<Navigate to="/multiplayer/connectfour" replace />} />
              <Route path="/rockpaperscissors" element={<Navigate to="/multiplayer/rockpaperscissors" replace />} />
              <Route path="/battleship" element={<Navigate to="/multiplayer/battleship" replace />} />
              <Route path="/wordchain" element={<Navigate to="/multiplayer/wordchain" replace />} />
              <Route path="/memorymatch" element={<Navigate to="/singleplayer/memorymatch" replace />} />
              <Route path="/snake" element={<Navigate to="/singleplayer/snake" replace />} />
              <Route path="/2048" element={<Navigate to="/singleplayer/2048" replace />} />
              <Route path="/minesweeper" element={<Navigate to="/singleplayer/minesweeper" replace />} />
              <Route path="/typingtest" element={<Navigate to="/singleplayer/typingtest" replace />} />
            </Routes>
            <DevTools />
          </div>
        </Router>
      </GameProvider>
    </AuthProvider>
  );
}

export default App;
