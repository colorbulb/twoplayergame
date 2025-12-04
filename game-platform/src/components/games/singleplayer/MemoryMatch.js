import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const EMOJIS = ['🍎', '🍕', '🎮', '🚀', '⭐', '🎵', '🌈', '🦋'];

function MemoryMatch() {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [bestScore, setBestScore] = useState(
    parseInt(localStorage.getItem('memoryMatchBest')) || 0
  );

  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  useEffect(() => {
    if (matchedPairs.length === EMOJIS.length && gameStarted) {
      setGameWon(true);
      setIsTimerRunning(false);
      
      // Update best score (fewer moves is better)
      if (bestScore === 0 || moves < bestScore) {
        setBestScore(moves);
        localStorage.setItem('memoryMatchBest', moves.toString());
      }
    }
  }, [matchedPairs, gameStarted, moves, bestScore]);

  const initializeGame = () => {
    // Create pairs of cards
    const cardPairs = [...EMOJIS, ...EMOJIS]
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false
      }))
      .sort(() => Math.random() - 0.5);
    
    setCards(cardPairs);
    setFlippedCards([]);
    setMatchedPairs([]);
    setMoves(0);
    setGameWon(false);
    setTimer(0);
    setGameStarted(true);
    setIsTimerRunning(true);
  };

  const handleCardClick = (clickedCard) => {
    // Don't allow click if already flipped or matched
    if (
      flippedCards.length === 2 ||
      flippedCards.some(card => card.id === clickedCard.id) ||
      matchedPairs.includes(clickedCard.emoji)
    ) {
      return;
    }

    const newFlippedCards = [...flippedCards, clickedCard];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setMoves(moves + 1);
      
      // Check if cards match
      if (newFlippedCards[0].emoji === newFlippedCards[1].emoji) {
        setMatchedPairs([...matchedPairs, clickedCard.emoji]);
        setFlippedCards([]);
      } else {
        // Flip back after delay
        setTimeout(() => {
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isCardFlipped = (card) => {
    return (
      flippedCards.some(c => c.id === card.id) ||
      matchedPairs.includes(card.emoji)
    );
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1 className="game-title">🃏🎴 Memory Match</h1>
      </div>

      {!gameStarted ? (
        <>
          <div className="game-instructions">
            <h3>How to Play</h3>
            <ul>
              <li>Click on cards to flip them over</li>
              <li>Find matching pairs of cards</li>
              <li>Match all pairs to win</li>
              <li>Try to complete in as few moves as possible!</li>
            </ul>
          </div>

          {bestScore > 0 && (
            <div className="game-status">
              🏆 Best Score: {bestScore} moves
            </div>
          )}

          <button className="game-button" onClick={initializeGame}>
            🎮 Start Game
          </button>
        </>
      ) : (
        <>
          <div className="game-status">
            Moves: {moves} | Time: {formatTime(timer)} | Pairs: {matchedPairs.length}/{EMOJIS.length}
          </div>

          <div className="memory-board">
            {cards.map((card) => (
              <div
                key={card.id}
                className={`memory-card ${isCardFlipped(card) ? 'flipped' : ''}`}
                onClick={() => handleCardClick(card)}
              >
                <div className="memory-card-face memory-card-back">❓</div>
                <div className="memory-card-face memory-card-front">
                  {card.emoji}
                </div>
              </div>
            ))}
          </div>

          {gameWon && (
            <div style={{ marginTop: '30px' }}>
              <h2>🎉 Congratulations!</h2>
              <p>You won in {moves} moves and {formatTime(timer)}!</p>
              {moves === bestScore && <p>🏆 New Best Score!</p>}
              <button className="game-button" onClick={initializeGame}>
                🔄 Play Again
              </button>
            </div>
          )}

          {!gameWon && (
            <button className="game-button secondary" onClick={initializeGame}>
              🔄 Restart
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default MemoryMatch;
