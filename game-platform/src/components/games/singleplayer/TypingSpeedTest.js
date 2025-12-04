import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const SAMPLE_TEXTS = [
  "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.",
  "Programming is the art of telling a computer what to do. Every programmer should learn at least one new language every year.",
  "React is a JavaScript library for building user interfaces. It makes creating interactive UIs painless and efficient.",
  "Practice makes perfect. The more you type, the faster and more accurate you become. Keep practicing every day.",
  "Technology is best when it brings people together. Innovation distinguishes between a leader and a follower."
];

function TypingSpeedTest() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [bestWpm, setBestWpm] = useState(
    parseInt(localStorage.getItem('typingBestWpm')) || 0
  );
  const inputRef = useRef(null);

  const startTest = useCallback(() => {
    const randomText = SAMPLE_TEXTS[Math.floor(Math.random() * SAMPLE_TEXTS.length)];
    setText(randomText);
    setUserInput('');
    setStartTime(null);
    setEndTime(null);
    setIsStarted(true);
    setIsFinished(false);
    setWpm(0);
    setAccuracy(100);
    setTimeElapsed(0);
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  useEffect(() => {
    let timer;
    if (isStarted && startTime && !isFinished) {
      timer = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isStarted, startTime, isFinished]);

  const calculateStats = useCallback(() => {
    if (!startTime || !endTime) return;
    
    const timeInMinutes = (endTime - startTime) / 60000;
    const wordsTyped = text.split(' ').length;
    const calculatedWpm = Math.round(wordsTyped / timeInMinutes);
    
    // Calculate accuracy
    let correctChars = 0;
    for (let i = 0; i < userInput.length; i++) {
      if (userInput[i] === text[i]) {
        correctChars++;
      }
    }
    const calculatedAccuracy = Math.round((correctChars / text.length) * 100);
    
    setWpm(calculatedWpm);
    setAccuracy(calculatedAccuracy);
    
    if (calculatedWpm > bestWpm) {
      setBestWpm(calculatedWpm);
      localStorage.setItem('typingBestWpm', calculatedWpm.toString());
    }
  }, [startTime, endTime, text, userInput, bestWpm]);

  useEffect(() => {
    if (isFinished && endTime) {
      calculateStats();
    }
  }, [isFinished, endTime, calculateStats]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    
    if (!startTime) {
      setStartTime(Date.now());
    }
    
    setUserInput(value);
    
    // Check if finished
    if (value.length >= text.length) {
      setEndTime(Date.now());
      setIsFinished(true);
    }
  };

  const renderText = () => {
    return text.split('').map((char, index) => {
      let className = '';
      if (index < userInput.length) {
        className = userInput[index] === char ? 'correct' : 'incorrect';
      } else if (index === userInput.length) {
        className = 'current';
      }
      return (
        <span key={index} className={className}>
          {char}
        </span>
      );
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentWpm = () => {
    if (!startTime || userInput.length === 0) return 0;
    const timeInMinutes = (Date.now() - startTime) / 60000;
    const wordsTyped = userInput.split(' ').filter(w => w).length;
    return Math.round(wordsTyped / timeInMinutes) || 0;
  };

  const getCurrentAccuracy = () => {
    if (userInput.length === 0) return 100;
    let correctChars = 0;
    for (let i = 0; i < userInput.length; i++) {
      if (userInput[i] === text[i]) {
        correctChars++;
      }
    }
    return Math.round((correctChars / userInput.length) * 100);
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1 className="game-title">⌨️⚡ Typing Speed Test</h1>
      </div>

      {!isStarted ? (
        <>
          <div className="game-instructions">
            <h3>How to Play</h3>
            <ul>
              <li>Click Start to begin the typing test</li>
              <li>Type the text as fast and accurately as possible</li>
              <li>Your WPM (Words Per Minute) and accuracy will be calculated</li>
              <li>Try to beat your best score!</li>
            </ul>
          </div>

          {bestWpm > 0 && (
            <div className="game-status">
              🏆 Best WPM: {bestWpm}
            </div>
          )}

          <button className="game-button" onClick={startTest}>
            🎮 Start Test
          </button>
        </>
      ) : (
        <div className="typing-container">
          {!isFinished && (
            <div className="typing-stats">
              <div className="stat-box">
                <div className="stat-value">{formatTime(timeElapsed)}</div>
                <div className="stat-label">Time</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{getCurrentWpm()}</div>
                <div className="stat-label">WPM</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{getCurrentAccuracy()}%</div>
                <div className="stat-label">Accuracy</div>
              </div>
            </div>
          )}

          <div className="typing-text">
            {renderText()}
          </div>

          {!isFinished ? (
            <textarea
              ref={inputRef}
              className="typing-input"
              value={userInput}
              onChange={handleInputChange}
              placeholder="Start typing..."
              autoFocus
              rows={3}
            />
          ) : (
            <>
              <div className="typing-stats">
                <div className="stat-box">
                  <div className="stat-value">{wpm}</div>
                  <div className="stat-label">WPM</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value">{accuracy}%</div>
                  <div className="stat-label">Accuracy</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value">{formatTime(timeElapsed)}</div>
                  <div className="stat-label">Time</div>
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <h2>
                  {accuracy >= 95 && wpm >= 60 ? '🏆 Excellent!' :
                   accuracy >= 90 && wpm >= 40 ? '⭐ Great Job!' :
                   accuracy >= 80 ? '👍 Good Work!' : '💪 Keep Practicing!'}
                </h2>
                {wpm === bestWpm && wpm > 0 && <p>🎉 New Best Score!</p>}
              </div>

              <button className="game-button" onClick={startTest}>
                🔄 Try Again
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default TypingSpeedTest;
