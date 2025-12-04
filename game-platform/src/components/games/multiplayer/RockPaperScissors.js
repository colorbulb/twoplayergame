import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../../contexts/GameContext';
import RoomModal from '../../common/RoomModal';
import '../../common/RoomModal.css';

const choices = [
  { id: 'rock', emoji: '✊', name: 'Rock' },
  { id: 'paper', emoji: '✋', name: 'Paper' },
  { id: 'scissors', emoji: '✌️', name: 'Scissors' }
];

function RockPaperScissors() {
  const navigate = useNavigate();
  const { 
    playerRole, 
    subscribeToRoom, 
    updateGameState, 
    leaveRoom 
  } = useGame();
  
  const [gameMode, setGameMode] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [playerChoice, setPlayerChoice] = useState(null);
  const [opponentChoice, setOpponentChoice] = useState(null);
  const [result, setResult] = useState(null);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [round, setRound] = useState(1);
  const [showResult, setShowResult] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);

  // Subscribe to room updates for online play
  useEffect(() => {
    if (gameMode === 'online' && roomId) {
      const unsubscribe = subscribeToRoom('rockpaperscissors', roomId, (roomData) => {
        if (roomData.gameState) {
          const hostChoice = roomData.gameState.hostChoice;
          const guestChoice = roomData.gameState.guestChoice;
          
          if (playerRole === 'host' && guestChoice) {
            setOpponentChoice(guestChoice);
          } else if (playerRole === 'guest' && hostChoice) {
            setOpponentChoice(hostChoice);
          }
          
          if (roomData.gameState.scores) {
            setScores(roomData.gameState.scores);
          }
          if (roomData.gameState.round) {
            setRound(roomData.gameState.round);
          }
        }
        
        if (roomData.guest && isWaiting) {
          setIsWaiting(false);
        }
      });
      
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [gameMode, roomId, subscribeToRoom, isWaiting, playerRole]);

  // Handle determining winner when both choices are made
  useEffect(() => {
    if (playerChoice && opponentChoice && !showResult) {
      const winner = determineWinner(playerChoice, opponentChoice);
      setResult(winner);
      setShowResult(true);
      
      if (winner === 'player1') {
        setScores(prev => ({ ...prev, player1: prev.player1 + 1 }));
      } else if (winner === 'player2') {
        setScores(prev => ({ ...prev, player2: prev.player2 + 1 }));
      }
    }
  }, [playerChoice, opponentChoice, showResult]);

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

  const handleChoice = async (choice) => {
    setPlayerChoice(choice);
    
    if (gameMode === 'online' && roomId) {
      const choiceKey = playerRole === 'host' ? 'hostChoice' : 'guestChoice';
      await updateGameState('rockpaperscissors', roomId, { 
        [choiceKey]: choice,
        scores,
        round 
      }, playerRole === 'host' ? 'guest' : 'host');
    } else {
      // For local game, generate opponent's choice
      const opponentOptions = ['rock', 'paper', 'scissors'];
      const randomChoice = opponentOptions[Math.floor(Math.random() * 3)];
      
      setTimeout(() => {
        setOpponentChoice(randomChoice);
      }, 1000);
    }
  };

  const nextRound = async () => {
    setPlayerChoice(null);
    setOpponentChoice(null);
    setResult(null);
    setShowResult(false);
    setRound(prev => prev + 1);
    
    if (gameMode === 'online' && roomId) {
      await updateGameState('rockpaperscissors', roomId, { 
        hostChoice: null,
        guestChoice: null,
        scores,
        round: round + 1 
      }, 'host');
    }
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

  const handleOnlineGame = () => {
    setShowRoomModal(true);
  };

  const handleGameStart = (newRoomId, role) => {
    setRoomId(newRoomId);
    setGameMode('online');
    setIsWaiting(role === 'host');
    setShowRoomModal(false);
    resetGame();
  };

  const handleLeaveGame = async () => {
    if (gameMode === 'online' && roomId) {
      await leaveRoom('rockpaperscissors', roomId);
    }
    setGameMode(null);
    setRoomId('');
    setIsWaiting(false);
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
          
          <button className="game-button" onClick={handleOnlineGame} style={{ marginTop: '15px' }}>
            🌐 Play Online
          </button>
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

        <RoomModal
          isOpen={showRoomModal}
          onClose={() => setShowRoomModal(false)}
          gameType="rockpaperscissors"
          gameName="Rock Paper Scissors"
          onGameStart={handleGameStart}
        />
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <button className="back-button" onClick={handleLeaveGame}>
          ← Back
        </button>
        <h1 className="game-title">✊✋✌️ Rock Paper Scissors</h1>
      </div>

      {gameMode === 'online' && roomId && (
        <div className="game-status">
          Room Code: <strong>{roomId.substring(0, 8)}</strong>
        </div>
      )}

      {isWaiting ? (
        <div style={{ textAlign: 'center' }}>
          <p className="waiting-message">Waiting for opponent to join...</p>
          <p style={{ color: '#a0aec0' }}>Share your room code with a friend!</p>
        </div>
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
