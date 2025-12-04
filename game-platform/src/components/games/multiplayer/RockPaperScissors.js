import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const choices = [
  { id: 'rock', emoji: '✊', name: 'Rock' },
  { id: 'paper', emoji: '✋', name: 'Paper' },
  { id: 'scissors', emoji: '✌️', name: 'Scissors' }
];

function RockPaperScissors() {
  const navigate = useNavigate();
  const [gameMode, setGameMode] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [playerChoice, setPlayerChoice] = useState(null);
  const [opponentChoice, setOpponentChoice] = useState(null);
  const [result, setResult] = useState(null);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [round, setRound] = useState(1);
  const [showResult, setShowResult] = useState(false);

  const determineWinner = (p1, p2) => {
    if (p1 === p2) return 'draw';
    if (
      (p1 === 'rock' && p2 === 'scissors') ||
      (p1 === 'paper' && p2 === 'rock') ||
      (p1 === 'scissors' && p2 === 'paper')
    ) {
      return 'player1';
    }
    return 'player2';
  };

  const handleChoice = (choice) => {
    setPlayerChoice(choice);
    
    // For local game or demo online, generate opponent's choice
    const opponentOptions = ['rock', 'paper', 'scissors'];
    const randomChoice = opponentOptions[Math.floor(Math.random() * 3)];
    
    setTimeout(() => {
      setOpponentChoice(randomChoice);
      const winner = determineWinner(choice, randomChoice);
      setResult(winner);
      setShowResult(true);
      
      if (winner === 'player1') {
        setScores(prev => ({ ...prev, player1: prev.player1 + 1 }));
      } else if (winner === 'player2') {
        setScores(prev => ({ ...prev, player2: prev.player2 + 1 }));
      }
    }, 1000);
  };

  const nextRound = () => {
    setPlayerChoice(null);
    setOpponentChoice(null);
    setResult(null);
    setShowResult(false);
    setRound(prev => prev + 1);
  };

  const resetGame = () => {
    setPlayerChoice(null);
    setOpponentChoice(null);
    setResult(null);
    setShowResult(false);
    setScores({ player1: 0, player2: 0 });
    setRound(1);
  };

  const startLocalGame = () => {
    setGameMode('local');
    resetGame();
  };

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(newRoomId);
    setGameMode('online');
    setIsWaiting(true);
    setTimeout(() => {
      setIsWaiting(false);
    }, 2000);
    resetGame();
  };

  const joinRoom = () => {
    if (!roomId.trim()) return;
    setGameMode('online');
    resetGame();
  };

  const getResultMessage = () => {
    if (result === 'draw') return "It's a Draw! 🤝";
    if (result === 'player1') return 'You Win! 🎉';
    return 'Opponent Wins! 😢';
  };

  if (!gameMode) {
    return (
      <div className="game-container">
        <div className="game-header">
          <button className="back-button" onClick={() => navigate('/')}>
            ← Back
          </button>
          <h1 className="game-title">✊✋✌️ Rock Paper Scissors</h1>
        </div>

        <div className="room-container">
          <h2>Choose Game Mode</h2>
          
          <button className="game-button" onClick={startLocalGame}>
            🎮 Play vs Computer
          </button>
          
          <div style={{ margin: '30px 0' }}>
            <h3>Or Play Online</h3>
            <button className="game-button" onClick={createRoom}>
              🏠 Create Room
            </button>
            
            <div style={{ marginTop: '20px' }}>
              <input
                type="text"
                className="room-input"
                placeholder="Enter Room Code"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              />
              <button className="game-button secondary" onClick={joinRoom}>
                🚪 Join Room
              </button>
            </div>
          </div>
        </div>

        <div className="game-instructions">
          <h3>How to Play</h3>
          <ul>
            <li>Rock beats Scissors</li>
            <li>Scissors beats Paper</li>
            <li>Paper beats Rock</li>
            <li>Best of multiple rounds wins!</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <button className="back-button" onClick={() => setGameMode(null)}>
          ← Back
        </button>
        <h1 className="game-title">✊✋✌️ Rock Paper Scissors</h1>
      </div>

      {gameMode === 'online' && roomId && (
        <div className="game-status">
          Room Code: <strong>{roomId}</strong>
        </div>
      )}

      {isWaiting ? (
        <p className="waiting-message">Waiting for opponent to join...</p>
      ) : (
        <div className="rps-container">
          <div className="game-status">
            Round {round} | You: {scores.player1} - Opponent: {scores.player2}
          </div>

          {!showResult ? (
            <>
              <h2>Make your choice!</h2>
              <div className="rps-choices">
                {choices.map((choice) => (
                  <button
                    key={choice.id}
                    className={`rps-choice ${playerChoice === choice.id ? 'selected' : ''}`}
                    onClick={() => !playerChoice && handleChoice(choice.id)}
                    disabled={!!playerChoice}
                  >
                    {choice.emoji}
                  </button>
                ))}
              </div>
              {playerChoice && !opponentChoice && (
                <p className="waiting-message">Waiting for opponent...</p>
              )}
            </>
          ) : (
            <>
              <div className="rps-result">
                <div className="rps-player">
                  <h3>You</h3>
                  <div className="rps-player-choice">
                    {choices.find(c => c.id === playerChoice)?.emoji}
                  </div>
                </div>
                <div style={{ fontSize: '2rem' }}>VS</div>
                <div className="rps-player">
                  <h3>Opponent</h3>
                  <div className="rps-player-choice">
                    {choices.find(c => c.id === opponentChoice)?.emoji}
                  </div>
                </div>
              </div>
              
              <div className="game-status" style={{ fontSize: '1.8rem' }}>
                {getResultMessage()}
              </div>

              <div>
                <button className="game-button" onClick={nextRound}>
                  ▶️ Next Round
                </button>
                <button className="game-button secondary" onClick={resetGame}>
                  🔄 Reset Game
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default RockPaperScissors;
