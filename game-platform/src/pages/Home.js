import React from 'react';
import { Link } from 'react-router-dom';

const multiplayerGames = [
  {
    id: 'tictactoe',
    name: 'Tic Tac Toe',
    icon: '❌⭕',
    description: 'Classic 3x3 grid game for 2 players',
    path: '/multiplayer/tictactoe'
  },
  {
    id: 'connectfour',
    name: 'Connect Four',
    icon: '🔴🟡',
    description: 'Drop discs to connect 4 in a row',
    path: '/multiplayer/connectfour'
  },
  {
    id: 'rockpaperscissors',
    name: 'Rock Paper Scissors',
    icon: '✊✋✌️',
    description: 'Classic hand game for 2 players',
    path: '/multiplayer/rockpaperscissors'
  },
  {
    id: 'battleship',
    name: 'Battleship',
    icon: '🚢💥',
    description: 'Naval combat strategy game',
    path: '/multiplayer/battleship'
  },
  {
    id: 'wordchain',
    name: 'Word Chain',
    icon: '📝🔗',
    description: 'Chain words together with friends',
    path: '/multiplayer/wordchain'
  },
  {
    id: 'checkers',
    name: 'Checkers',
    icon: '🔴⚫',
    description: 'Classic board game with jumping captures',
    path: '/multiplayer/checkers'
  }
];

const singlePlayerGames = [
  {
    id: 'memorymatch',
    name: 'Memory Match',
    icon: '🃏🎴',
    description: 'Find matching pairs of cards',
    path: '/singleplayer/memorymatch'
  },
  {
    id: 'snake',
    name: 'Snake',
    icon: '🐍🍎',
    description: 'Classic snake game',
    path: '/singleplayer/snake'
  },
  {
    id: '2048',
    name: '2048',
    icon: '🔢🎯',
    description: 'Merge tiles to reach 2048',
    path: '/singleplayer/2048'
  },
  {
    id: 'minesweeper',
    name: 'Minesweeper',
    icon: '💣🚩',
    description: 'Clear the minefield',
    path: '/singleplayer/minesweeper'
  },
  {
    id: 'typingtest',
    name: 'Typing Speed Test',
    icon: '⌨️⚡',
    description: 'Test your typing speed',
    path: '/singleplayer/typingtest'
  },
  {
    id: 'sudoku',
    name: 'Sudoku',
    icon: '🔢📝',
    description: 'Fill the grid with numbers 1-9',
    path: '/singleplayer/sudoku'
  }
];

function Home() {
  return (
    <div className="home-container">
      <h1>🎮 Game Platform</h1>
      <p className="subtitle">Play solo or with friends online!</p>

      <section className="games-section">
        <h2>👥 Multiplayer Games</h2>
        <div className="games-grid">
          {multiplayerGames.map((game) => (
            <Link to={game.path} key={game.id} className="game-card">
              <div className="icon">{game.icon}</div>
              <h3>{game.name}</h3>
              <p>{game.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="games-section">
        <h2>🎯 Single Player Games</h2>
        <div className="games-grid">
          {singlePlayerGames.map((game) => (
            <Link to={game.path} key={game.id} className="game-card">
              <div className="icon">{game.icon}</div>
              <h3>{game.name}</h3>
              <p>{game.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="admin-link">
        <Link to="/admin" className="admin-button-link">
          🔐 Admin Dashboard
        </Link>
      </div>
    </div>
  );
}

export default Home;
