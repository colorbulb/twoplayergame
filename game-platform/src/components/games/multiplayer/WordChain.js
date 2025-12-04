import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Note: In a real app, you would use a dictionary API for word validation
// This is a simplified implementation that accepts any word with 2+ letters

function WordChain() {
  const navigate = useNavigate();
  const [gameMode, setGameMode] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [words, setWords] = useState([]);
  const [inputWord, setInputWord] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [gameStatus, setGameStatus] = useState('');
  const [error, setError] = useState('');
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [timeLeft, setTimeLeft] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const startTimer = useCallback(() => {
    setTimeLeft(30);
    setIsTimerRunning(true);
  }, []);

  useEffect(() => {
    let timer;
    if (isTimerRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      // Time's up - current player loses the round
      setIsTimerRunning(false);
      const winner = currentPlayer === 1 ? 2 : 1;
      setScores(prev => ({
        ...prev,
        [`player${winner}`]: prev[`player${winner}`] + 1
      }));
      setGameStatus(`Time's up! Player ${winner} scores!`);
      setGameOver(true);
    }
    return () => clearInterval(timer);
  }, [timeLeft, isTimerRunning, currentPlayer]);

  const isValidWord = (word) => {
    // In a real app, this would check against a dictionary API
    // For demo, we accept any word with 2+ letters
    return word.length >= 2;
  };

  const startsWithCorrectLetter = (word) => {
    if (words.length === 0) return true;
    const lastWord = words[words.length - 1].word;
    const lastLetter = lastWord.charAt(lastWord.length - 1).toLowerCase();
    return word.charAt(0).toLowerCase() === lastLetter;
  };

  const isWordUsed = (word) => {
    return words.some(w => w.word.toLowerCase() === word.toLowerCase());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const word = inputWord.trim().toLowerCase();
    
    if (!word) {
      setError('Please enter a word');
      return;
    }

    if (!isValidWord(word)) {
      setError('Please enter a valid word (at least 2 letters)');
      return;
    }

    if (!startsWithCorrectLetter(word)) {
      const lastWord = words[words.length - 1].word;
      const lastLetter = lastWord.charAt(lastWord.length - 1).toUpperCase();
      setError(`Word must start with "${lastLetter}"`);
      return;
    }

    if (isWordUsed(word)) {
      setError('This word has already been used!');
      return;
    }

    // Valid word
    setWords([...words, { word, player: currentPlayer }]);
    setInputWord('');
    setError('');
    setScores(prev => ({
      ...prev,
      [`player${currentPlayer}`]: prev[`player${currentPlayer}`] + word.length
    }));
    
    // Switch player
    const nextPlayer = currentPlayer === 1 ? 2 : 1;
    setCurrentPlayer(nextPlayer);
    setGameStatus(`Player ${nextPlayer}'s turn - word must start with "${word.charAt(word.length - 1).toUpperCase()}"`);
    startTimer();
  };

  const resetGame = () => {
    setWords([]);
    setInputWord('');
    setCurrentPlayer(1);
    setError('');
    setScores({ player1: 0, player2: 0 });
    setTimeLeft(30);
    setIsTimerRunning(false);
    setGameOver(false);
    setGameStatus('Player 1 starts! Enter any word to begin.');
  };

  const startLocalGame = () => {
    setGameMode('local');
    resetGame();
    startTimer();
  };

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(newRoomId);
    setGameMode('online');
    setIsWaiting(true);
    setTimeout(() => {
      setIsWaiting(false);
      resetGame();
      startTimer();
    }, 2000);
  };

  const joinRoom = () => {
    if (!roomId.trim()) return;
    setGameMode('online');
    resetGame();
    startTimer();
  };

  if (!gameMode) {
    return (
      <div className="game-container">
        <div className="game-header">
          <button className="back-button" onClick={() => navigate('/')}>
            ← Back
          </button>
          <h1 className="game-title">📝🔗 Word Chain</h1>
        </div>

        <div className="room-container">
          <h2>Choose Game Mode</h2>
          
          <button className="game-button" onClick={startLocalGame}>
            🎮 Local 2-Player
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
            <li>Players take turns entering words</li>
            <li>Each word must start with the last letter of the previous word</li>
            <li>Words cannot be repeated</li>
            <li>You have 30 seconds per turn</li>
            <li>Score points based on word length!</li>
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
        <h1 className="game-title">📝🔗 Word Chain</h1>
      </div>

      {gameMode === 'online' && roomId && (
        <div className="game-status">
          Room Code: <strong>{roomId}</strong>
        </div>
      )}

      {isWaiting ? (
        <p className="waiting-message">Waiting for opponent to join...</p>
      ) : (
        <div className="word-chain-container">
          <div className="game-status">
            Player 1: {scores.player1} pts | Player 2: {scores.player2} pts
          </div>

          <div className="game-status" style={{ 
            color: timeLeft <= 10 ? '#ef4444' : '#00d4ff',
            fontSize: '1.5rem'
          }}>
            ⏱️ {timeLeft}s
          </div>

          <p className="game-status">{gameStatus}</p>

          <div className="word-list">
            {words.length === 0 ? (
              <p style={{ color: '#a0aec0', textAlign: 'center' }}>
                No words yet. Be the first to start!
              </p>
            ) : (
              words.map((item, index) => (
                <div key={index} className="word-item">
                  <strong style={{ color: item.player === 1 ? '#00d4ff' : '#fbbf24' }}>
                    P{item.player}:
                  </strong>{' '}
                  {item.word}
                  <span style={{ color: '#10b981', marginLeft: '10px' }}>
                    +{item.word.length} pts
                  </span>
                </div>
              ))
            )}
          </div>

          {!gameOver ? (
            <form onSubmit={handleSubmit}>
              <div className="word-input-container">
                <input
                  type="text"
                  className="word-input"
                  placeholder={`Player ${currentPlayer}, enter a word...`}
                  value={inputWord}
                  onChange={(e) => setInputWord(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="game-button">
                  Submit
                </button>
              </div>
              {error && (
                <p style={{ color: '#ef4444', marginTop: '10px' }}>{error}</p>
              )}
            </form>
          ) : (
            <div>
              <p style={{ fontSize: '1.5rem', margin: '20px 0' }}>
                {scores.player1 > scores.player2 
                  ? '🏆 Player 1 Wins!'
                  : scores.player2 > scores.player1
                  ? '🏆 Player 2 Wins!'
                  : "🤝 It's a Tie!"}
              </p>
              <button className="game-button" onClick={() => {
                resetGame();
                startTimer();
              }}>
                🔄 Play Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default WordChain;
