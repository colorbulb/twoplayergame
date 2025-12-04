import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MemoryMatch from '../components/games/singleplayer/MemoryMatch';
import Snake from '../components/games/singleplayer/Snake';
import Game2048 from '../components/games/singleplayer/Game2048';
import Minesweeper from '../components/games/singleplayer/Minesweeper';
import TypingSpeedTest from '../components/games/singleplayer/TypingSpeedTest';
import Sudoku from '../components/games/singleplayer/Sudoku';

function SinglePlayerRoutes() {
  return (
    <Routes>
      <Route path="memorymatch" element={<MemoryMatch />} />
      <Route path="snake" element={<Snake />} />
      <Route path="2048" element={<Game2048 />} />
      <Route path="minesweeper" element={<Minesweeper />} />
      <Route path="typingtest" element={<TypingSpeedTest />} />
      <Route path="sudoku" element={<Sudoku />} />
    </Routes>
  );
}

export default SinglePlayerRoutes;
