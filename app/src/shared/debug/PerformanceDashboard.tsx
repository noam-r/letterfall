import { useState, useEffect, useRef } from 'react';
import { PerformanceManager, type PerformanceMetrics as ImportedPerformanceMetrics } from '@shared/performance/PerformanceManager';
import { Logger } from './Logger';

type PerformanceMetrics = ImportedPerformanceMetrics;

interface PerformanceDashboardProps {
  visible: boolean;
  onClose: () => void;
}

export function PerformanceDashboard({ visible, onClose }: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [history, setHistory] = useState<PerformanceMetrics[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const intervalRef = useRef<number | null>(null);
  const performanceManagerRef = useRef<PerformanceManager | null>(null);
  const loggerRef = useRef<Logger | null>(null);

  useEffect(() => {
    if (visible) {
      performanceManagerRef.current = new PerformanceManager();
      loggerRef.current = Logger.getInstance();
      
      performanceManagerRef.current.startMonitoring();
      startRecording();
    }

    return () => {
      stopRecording();
      if (performanceManagerRef.current) {
        performanceManagerRef.current.stopMonitoring();
      }
    };
  }, [visible]);

  const startRecording = () => {
    if (intervalRef.current) return;

    setIsRecording(true);
    intervalRef.current = window.setInterval(() => {
      if (performanceManagerRef.current) {
        const currentMetrics = performanceManagerRef.current.getMetrics();
        setMetrics(currentMetrics);
        
        setHistory(prev => {
          const newHistory = [...prev, currentMetrics];
          return newHistory.slice(-60); // Keep last 60 samples (1 minute at 1Hz)
        });
      }

      if (loggerRef.current) {
        const recentLogs = loggerRef.current.getFilteredEntries({
          since: Date.now() - 5000, // Last 5 seconds
          limit: 10,
        });
        setLogs(recentLogs);
      }
    }, 1000);
  };

  const stopRecording = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRecording(false);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const exportData = () => {
    const data = {
      metrics: metrics,
      history: history,
      logs: logs,
      timestamp: Date.now(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `letterfall-performance-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPerformanceStatus = (fps: number) => {
    if (fps >= 55) return { status: 'excellent', color: '#10b981' };
    if (fps >= 45) return { status: 'good', color: '#f59e0b' };
    if (fps >= 30) return { status: 'fair', color: '#f97316' };
    return { status: 'poor', color: '#ef4444' };
  };

  if (!visible) return null;

  return (
    <div className="performance-dashboard">
      <div className="performance-dashboard__header">
        <h3>Performance Dashboard</h3>
        <div className="performance-dashboard__controls">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`btn ${isRecording ? 'btn--danger' : 'btn--primary'}`}
          >
            {isRecording ? 'Stop' : 'Start'} Recording
          </button>
          <button onClick={clearHistory} className="btn btn--secondary">
            Clear History
          </button>
          <button onClick={exportData} className="btn btn--secondary">
            Export Data
          </button>
          <button onClick={onClose} className="btn btn--ghost">
            ×
          </button>
        </div>
      </div>

      <div className="performance-dashboard__content">
        {metrics && (
          <>
            <div className="performance-dashboard__metrics">
              <div className="metric-card">
                <h4>FPS</h4>
                <div 
                  className="metric-value"
                  style={{ color: getPerformanceStatus(metrics.fps).color }}
                >
                  {metrics.fps.toFixed(1)}
                </div>
                <div className="metric-status">
                  {getPerformanceStatus(metrics.fps).status}
                </div>
              </div>

              <div className="metric-card">
                <h4>Frame Time</h4>
                <div className="metric-value">
                  {(metrics.frameTime || 0).toFixed(2)}ms
                </div>
              </div>

              <div className="metric-card">
                <h4>Memory Usage</h4>
                <div className="metric-value">
                  {formatBytes(metrics.memory?.usedJSHeapSize || 0)}
                </div>
                <div className="metric-subtitle">
                  / {formatBytes(metrics.memory?.totalJSHeapSize || 0)}
                </div>
              </div>

              <div className="metric-card">
                <h4>Render Time</h4>
                <div className="metric-value">
                  {metrics.renderTime.toFixed(2)}ms
                </div>
              </div>
            </div>

            <div className="performance-dashboard__charts">
              <div className="chart-container">
                <h4>FPS History</h4>
                <div className="chart">
                  <svg width="100%" height="100" viewBox="0 0 300 100">
                    {history.map((metric, index) => {
                      const x = (index / (history.length - 1)) * 300;
                      const y = 100 - (metric.fps / 60) * 100;
                      return (
                        <circle
                          key={index}
                          cx={x}
                          cy={Math.max(0, Math.min(100, y))}
                          r="2"
                          fill={getPerformanceStatus(metric.fps).color}
                        />
                      );
                    })}
                    {history.length > 1 && (
                      <polyline
                        points={history.map((metric, index) => {
                          const x = (index / (history.length - 1)) * 300;
                          const y = 100 - (metric.fps / 60) * 100;
                          return `${x},${Math.max(0, Math.min(100, y))}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#6b7280"
                        strokeWidth="1"
                      />
                    )}
                  </svg>
                </div>
              </div>

              <div className="chart-container">
                <h4>Memory Usage History</h4>
                <div className="chart">
                  <svg width="100%" height="100" viewBox="0 0 300 100">
                    {history.map((metric, index) => {
                      const x = (index / (history.length - 1)) * 300;
                      const maxMemory = Math.max(...history.map(h => h.memory?.usedJSHeapSize || 0));
                      const y = 100 - ((metric.memory?.usedJSHeapSize || 0) / maxMemory) * 100;
                      return (
                        <circle
                          key={index}
                          cx={x}
                          cy={Math.max(0, Math.min(100, y))}
                          r="2"
                          fill="#3b82f6"
                        />
                      );
                    })}
                    {history.length > 1 && (
                      <polyline
                        points={history.map((metric, index) => {
                          const x = (index / (history.length - 1)) * 300;
                          const maxMemory = Math.max(...history.map(h => h.memory?.usedJSHeapSize || 0));
                          const y = 100 - ((metric.memory?.usedJSHeapSize || 0) / maxMemory) * 100;
                          return `${x},${Math.max(0, Math.min(100, y))}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="1"
                      />
                    )}
                  </svg>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="performance-dashboard__logs">
          <h4>Recent Logs</h4>
          <div className="log-container">
            {logs.map((log, index) => (
              <div 
                key={index} 
                className={`log-entry log-entry--${(['debug', 'info', 'warn', 'error', 'none'][log.level] || 'unknown').toLowerCase()}`}
              >
                <span className="log-timestamp">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="log-category">[{log.category}]</span>
                <span className="log-message">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}