import { useState, useEffect } from 'react';
import { PerformanceDashboard } from './PerformanceDashboard';
import { MemoryVisualizer } from './MemoryVisualizer';
import { Logger, LogLevel } from './Logger';

interface DebugPanelProps {
  enabled?: boolean;
}

export function DebugPanel({ enabled = import.meta.env.DEV }: DebugPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'performance' | 'memory' | 'logs'>('performance');
  const [logs, setLogs] = useState<any[]>([]);
  const [logFilter, setLogFilter] = useState<{
    level: LogLevel;
    category: string;
  }>({
    level: LogLevel.DEBUG,
    category: '',
  });

  useEffect(() => {
    if (!enabled) return;

    const logger = Logger.getInstance();
    
    const updateLogs = () => {
      const filteredLogs = logger.getFilteredEntries({
        level: logFilter.level,
        category: logFilter.category || undefined,
        limit: 100,
      });
      setLogs(filteredLogs);
    };

    // Initial load
    updateLogs();

    // Listen for new log entries
    const handleLogEntry = () => {
      updateLogs();
    };

    logger.addListener(handleLogEntry);

    // Update logs periodically
    const interval = setInterval(updateLogs, 1000);

    return () => {
      logger.removeListener(handleLogEntry);
      clearInterval(interval);
    };
  }, [enabled, logFilter]);

  // Keyboard shortcut to toggle debug panel
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + D
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);

  const clearLogs = () => {
    const logger = Logger.getInstance();
    logger.clear();
    setLogs([]);
  };

  const exportLogs = () => {
    const logger = Logger.getInstance();
    const data = logger.exportLogs();
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `letterfall-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatLogLevel = (level: LogLevel) => {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'NONE'];
    return levelNames[level] || 'UNKNOWN';
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!enabled) return null;

  return (
    <>
      {/* Toggle button */}
      <button
        className="debug-toggle"
        onClick={() => setIsVisible(!isVisible)}
        title="Toggle Debug Panel (Ctrl+Shift+D)"
      >
        🔧
      </button>

      {/* Debug panel */}
      {isVisible && (
        <div className="debug-panel">
          <div className="debug-panel__header">
            <h3>Debug Panel</h3>
            <div className="debug-panel__tabs">
              <button
                className={`debug-tab ${activeTab === 'performance' ? 'debug-tab--active' : ''}`}
                onClick={() => setActiveTab('performance')}
              >
                Performance
              </button>
              <button
                className={`debug-tab ${activeTab === 'memory' ? 'debug-tab--active' : ''}`}
                onClick={() => setActiveTab('memory')}
              >
                Memory
              </button>
              <button
                className={`debug-tab ${activeTab === 'logs' ? 'debug-tab--active' : ''}`}
                onClick={() => setActiveTab('logs')}
              >
                Logs ({logs.length})
              </button>
            </div>
            <button
              className="btn btn--ghost"
              onClick={() => setIsVisible(false)}
            >
              ×
            </button>
          </div>

          <div className="debug-panel__content">
            {activeTab === 'performance' && (
              <PerformanceDashboard
                visible={true}
                onClose={() => setIsVisible(false)}
              />
            )}

            {activeTab === 'memory' && (
              <MemoryVisualizer visible={true} />
            )}

            {activeTab === 'logs' && (
              <div className="debug-logs">
                <div className="debug-logs__controls">
                  <div className="log-filters">
                    <select
                      value={logFilter.level}
                      onChange={(e) => setLogFilter(prev => ({
                        ...prev,
                        level: parseInt(e.target.value) as LogLevel
                      }))}
                      className="log-filter-select"
                    >
                      <option value={LogLevel.DEBUG}>Debug & Above</option>
                      <option value={LogLevel.INFO}>Info & Above</option>
                      <option value={LogLevel.WARN}>Warnings & Errors</option>
                      <option value={LogLevel.ERROR}>Errors Only</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Filter by category..."
                      value={logFilter.category}
                      onChange={(e) => setLogFilter(prev => ({
                        ...prev,
                        category: e.target.value
                      }))}
                      className="log-filter-input"
                    />
                  </div>

                  <div className="log-actions">
                    <button onClick={clearLogs} className="btn btn--secondary">
                      Clear Logs
                    </button>
                    <button onClick={exportLogs} className="btn btn--secondary">
                      Export Logs
                    </button>
                  </div>
                </div>

                <div className="debug-logs__container">
                  {logs.length === 0 ? (
                    <div className="no-logs">No logs match the current filter</div>
                  ) : (
                    logs.map((log, index) => (
                      <div
                        key={index}
                        className={`debug-log-entry debug-log-entry--${formatLogLevel(log.level).toLowerCase()}`}
                      >
                        <div className="log-entry-header">
                          <span className="log-timestamp">
                            {formatTimestamp(log.timestamp)}
                          </span>
                          <span className="log-level">
                            {formatLogLevel(log.level)}
                          </span>
                          <span className="log-category">
                            [{log.category}]
                          </span>
                        </div>
                        <div className="log-message">
                          {log.message}
                        </div>
                        {log.data && (
                          <details className="log-data">
                            <summary>Data</summary>
                            <pre>{JSON.stringify(log.data, null, 2)}</pre>
                          </details>
                        )}
                        {log.stack && (
                          <details className="log-stack">
                            <summary>Stack Trace</summary>
                            <pre>{log.stack}</pre>
                          </details>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}