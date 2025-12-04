import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import TicTacToe from './components/games/multiplayer/TicTacToe';
import ConnectFour from './components/games/multiplayer/ConnectFour';
import RockPaperScissors from './components/games/multiplayer/RockPaperScissors';
import Battleship from './components/games/multiplayer/Battleship';
import WordChain from './components/games/multiplayer/WordChain';
import MemoryMatch from './components/games/singleplayer/MemoryMatch';
import Snake from './components/games/singleplayer/Snake';
import Game2048 from './components/games/singleplayer/Game2048';
import Minesweeper from './components/games/singleplayer/Minesweeper';
import TypingSpeedTest from './components/games/singleplayer/TypingSpeedTest';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Multiplayer Games */}
          <Route path="/tictactoe" element={<TicTacToe />} />
          <Route path="/connectfour" element={<ConnectFour />} />
          <Route path="/rockpaperscissors" element={<RockPaperScissors />} />
          <Route path="/battleship" element={<Battleship />} />
          <Route path="/wordchain" element={<WordChain />} />
          {/* Single Player Games */}
          <Route path="/memorymatch" element={<MemoryMatch />} />
          <Route path="/snake" element={<Snake />} />
          <Route path="/2048" element={<Game2048 />} />
          <Route path="/minesweeper" element={<Minesweeper />} />
          <Route path="/typingtest" element={<TypingSpeedTest />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
