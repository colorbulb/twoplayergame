import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import Home from './pages/Home';
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
              <Route path="/tictactoe" element={<Navigate to="/multiplayer/tictactoe" />} />
              <Route path="/connectfour" element={<Navigate to="/multiplayer/connectfour" />} />
              <Route path="/rockpaperscissors" element={<Navigate to="/multiplayer/rockpaperscissors" />} />
              <Route path="/battleship" element={<Navigate to="/multiplayer/battleship" />} />
              <Route path="/wordchain" element={<Navigate to="/multiplayer/wordchain" />} />
              <Route path="/memorymatch" element={<Navigate to="/singleplayer/memorymatch" />} />
              <Route path="/snake" element={<Navigate to="/singleplayer/snake" />} />
              <Route path="/2048" element={<Navigate to="/singleplayer/2048" />} />
              <Route path="/minesweeper" element={<Navigate to="/singleplayer/minesweeper" />} />
              <Route path="/typingtest" element={<Navigate to="/singleplayer/typingtest" />} />
            </Routes>
          </div>
        </Router>
      </GameProvider>
    </AuthProvider>
  );
}

// Navigate component for redirects
function Navigate({ to }) {
  React.useEffect(() => {
    window.location.href = to;
  }, [to]);
  return null;
}

export default App;
