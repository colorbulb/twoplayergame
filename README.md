# Game Platform

A React-based gaming platform featuring 10 games - 5 multiplayer and 5 single-player games.

## 🎮 Games Included

### 👥 Multiplayer Games (2+ Players)
1. **Tic Tac Toe** - Classic 3x3 grid game for 2 players
2. **Connect Four** - Drop discs to connect 4 in a row
3. **Rock Paper Scissors** - Classic hand game with scoring
4. **Battleship** - Naval combat strategy game
5. **Word Chain** - Chain words together (word must start with the last letter of the previous word)

### 🎯 Single Player Games
1. **Memory Match** - Find matching pairs of cards
2. **Snake** - Classic snake game with growing difficulty
3. **2048** - Merge tiles to reach 2048
4. **Minesweeper** - Clear the minefield
5. **Typing Speed Test** - Test and improve your typing speed

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
cd game-platform
npm install
```

### Running the App

```bash
npm start
```

The app will run at [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
```

## 🎯 Features

- **Modern UI** - Beautiful gradient design with smooth animations
- **Responsive** - Works on desktop and mobile devices
- **Local Storage** - High scores and best times are saved locally
- **Mobile Controls** - Touch-friendly controls for mobile gaming
- **Room System** - Create or join rooms for multiplayer games

## 🛠️ Tech Stack

- React 18
- React Router DOM
- CSS3 (with custom animations and gradients)
- Local Storage for score persistence

## 📁 Project Structure

```
game-platform/
├── public/
├── src/
│   ├── components/
│   │   └── games/
│   │       ├── multiplayer/
│   │       │   ├── TicTacToe.js
│   │       │   ├── ConnectFour.js
│   │       │   ├── RockPaperScissors.js
│   │       │   ├── Battleship.js
│   │       │   └── WordChain.js
│   │       └── singleplayer/
│   │           ├── MemoryMatch.js
│   │           ├── Snake.js
│   │           ├── Game2048.js
│   │           ├── Minesweeper.js
│   │           └── TypingSpeedTest.js
│   ├── pages/
│   │   └── Home.js
│   ├── App.js
│   ├── App.css
│   └── index.js
└── package.json
```

## 🎮 How to Play

Each game includes instructions accessible from the game's home screen. Click on any game card from the main menu to get started!

## 📝 License

MIT License