import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TicTacToe from '../components/games/multiplayer/TicTacToe';
import ConnectFour from '../components/games/multiplayer/ConnectFour';
import RockPaperScissors from '../components/games/multiplayer/RockPaperScissors';
import Battleship from '../components/games/multiplayer/Battleship';
import WordChain from '../components/games/multiplayer/WordChain';

function MultiplayerRoutes() {
  return (
    <Routes>
      <Route path="tictactoe" element={<TicTacToe />} />
      <Route path="connectfour" element={<ConnectFour />} />
      <Route path="rockpaperscissors" element={<RockPaperScissors />} />
      <Route path="battleship" element={<Battleship />} />
      <Route path="wordchain" element={<WordChain />} />
    </Routes>
  );
}

export default MultiplayerRoutes;
