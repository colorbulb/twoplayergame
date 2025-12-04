import React, { useState, useEffect, useRef } from 'react';
import './DevTools.css';

const MAX_CONSOLE_LOGS = 100;

function DevTools() {
  const [isOpen, setIsOpen] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    // Store original console methods
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    const addLog = (type, args) => {
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');

      setConsoleLogs(prev => {
        const newLogs = [...prev, { type, message, timestamp: new Date().toLocaleTimeString() }];
        return newLogs.slice(-MAX_CONSOLE_LOGS);
      });
    };

    console.log = (...args) => {
      originalLog.apply(console, args);
      addLog('log', args);
    };

    console.error = (...args) => {
      originalError.apply(console, args);
      addLog('error', args);
    };

    console.warn = (...args) => {
      originalWarn.apply(console, args);
      addLog('warn', args);
    };

    console.info = (...args) => {
      originalInfo.apply(console, args);
      addLog('info', args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
      isInitializedRef.current = false;
    };
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleClearLogs = () => {
    setConsoleLogs([]);
  };

  const getLogClass = (type) => {
    switch (type) {
      case 'error': return 'dev-log-error';
      case 'warn': return 'dev-log-warn';
      case 'info': return 'dev-log-info';
      default: return 'dev-log-default';
    }
  };

  return (
    <div className="dev-tools-container">
      <button 
        className="dev-tools-toggle" 
        onClick={() => setIsOpen(!isOpen)}
        title="Developer Tools"
      >
        ⚙️
      </button>
      
      {isOpen && (
        <div className="dev-tools-panel">
          <div className="dev-tools-header">
            <h3>🛠️ Developer Tools</h3>
            <button className="dev-tools-close" onClick={() => setIsOpen(false)}>×</button>
          </div>
          
          <div className="dev-tools-actions">
            <button className="dev-tools-btn refresh" onClick={handleRefresh}>
              🔄 Refresh Page
            </button>
            <button className="dev-tools-btn clear" onClick={handleClearLogs}>
              🗑️ Clear Logs
            </button>
          </div>
          
          <div className="dev-tools-console">
            <h4>📋 Console Logs ({consoleLogs.length})</h4>
            <div className="dev-tools-log-list">
              {consoleLogs.length === 0 ? (
                <p className="no-logs">No logs captured yet...</p>
              ) : (
                consoleLogs.map((log, index) => (
                  <div key={index} className={`dev-log-entry ${getLogClass(log.type)}`}>
                    <span className="log-time">[{log.timestamp}]</span>
                    <span className="log-type">[{log.type.toUpperCase()}]</span>
                    <span className="log-message">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DevTools;
