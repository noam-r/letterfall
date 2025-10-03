import { useState, useEffect, useRef } from 'react';
import { PerformanceManager } from '@shared/performance/PerformanceManager';

interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface MemoryVisualizerProps {
  visible: boolean;
  updateInterval?: number;
}

export function MemoryVisualizer({ visible, updateInterval = 1000 }: MemoryVisualizerProps) {
  const [snapshots, setSnapshots] = useState<MemorySnapshot[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<MemorySnapshot | null>(null);
  const intervalRef = useRef<number | null>(null);
  const performanceManagerRef = useRef<PerformanceManager | null>(null);

  useEffect(() => {
    if (visible) {
      performanceManagerRef.current = new PerformanceManager();
      startMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [visible, updateInterval]);

  const startMonitoring = () => {
    if (intervalRef.current || !performanceManagerRef.current) return;

    setIsMonitoring(true);
    intervalRef.current = window.setInterval(() => {
      if (performanceManagerRef.current) {
        const memory = performanceManagerRef.current.getMemoryUsage();
        const snapshot: MemorySnapshot = {
          timestamp: Date.now(),
          ...memory,
        };

        setSnapshots(prev => {
          const newSnapshots = [...prev, snapshot];
          return newSnapshots.slice(-100); // Keep last 100 snapshots
        });
      }
    }, updateInterval);
  };

  const stopMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsMonitoring(false);
  };

  const clearSnapshots = () => {
    setSnapshots([]);
    setSelectedSnapshot(null);
  };

  const forceGarbageCollection = () => {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    } else {
      // Fallback: create and release large objects to encourage GC
      const largeArray = new Array(1000000).fill(0);
      largeArray.length = 0;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getMemoryUsagePercentage = (used: number, total: number) => {
    return total > 0 ? (used / total) * 100 : 0;
  };

  const getMemoryTrend = () => {
    if (snapshots.length < 2) return 'stable';
    
    const recent = snapshots.slice(-10);
    const trend = recent.reduce((acc, snapshot, index) => {
      if (index === 0) return acc;
      const prev = recent[index - 1];
      return acc + (snapshot.usedJSHeapSize - prev.usedJSHeapSize);
    }, 0);

    if (trend > 1024 * 1024) return 'increasing'; // > 1MB increase
    if (trend < -1024 * 1024) return 'decreasing'; // > 1MB decrease
    return 'stable';
  };

  const exportMemoryData = () => {
    const data = {
      snapshots,
      summary: {
        totalSnapshots: snapshots.length,
        timeRange: snapshots.length > 0 ? {
          start: snapshots[0].timestamp,
          end: snapshots[snapshots.length - 1].timestamp,
        } : null,
        peakMemory: Math.max(...snapshots.map(s => s.usedJSHeapSize)),
        averageMemory: snapshots.reduce((sum, s) => sum + s.usedJSHeapSize, 0) / snapshots.length,
      },
      exportedAt: Date.now(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!visible) return null;

  const currentSnapshot = snapshots[snapshots.length - 1];
  const memoryTrend = getMemoryTrend();

  return (
    <div className="memory-visualizer">
      <div className="memory-visualizer__header">
        <h3>Memory Usage Visualizer</h3>
        <div className="memory-visualizer__controls">
          <button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            className={`btn ${isMonitoring ? 'btn--danger' : 'btn--primary'}`}
          >
            {isMonitoring ? 'Stop' : 'Start'} Monitoring
          </button>
          <button onClick={forceGarbageCollection} className="btn btn--secondary">
            Force GC
          </button>
          <button onClick={clearSnapshots} className="btn btn--secondary">
            Clear Data
          </button>
          <button onClick={exportMemoryData} className="btn btn--secondary">
            Export
          </button>
        </div>
      </div>

      <div className="memory-visualizer__content">
        {currentSnapshot && (
          <div className="memory-summary">
            <div className="memory-card">
              <h4>Current Usage</h4>
              <div className="memory-value">
                {formatBytes(currentSnapshot.usedJSHeapSize)}
              </div>
              <div className="memory-subtitle">
                {getMemoryUsagePercentage(
                  currentSnapshot.usedJSHeapSize,
                  currentSnapshot.totalJSHeapSize
                ).toFixed(1)}% of allocated
              </div>
            </div>

            <div className="memory-card">
              <h4>Total Allocated</h4>
              <div className="memory-value">
                {formatBytes(currentSnapshot.totalJSHeapSize)}
              </div>
              <div className="memory-subtitle">
                {getMemoryUsagePercentage(
                  currentSnapshot.totalJSHeapSize,
                  currentSnapshot.jsHeapSizeLimit
                ).toFixed(1)}% of limit
              </div>
            </div>

            <div className="memory-card">
              <h4>Heap Limit</h4>
              <div className="memory-value">
                {formatBytes(currentSnapshot.jsHeapSizeLimit)}
              </div>
            </div>

            <div className="memory-card">
              <h4>Trend</h4>
              <div className={`memory-value memory-trend--${memoryTrend}`}>
                {memoryTrend}
              </div>
              <div className="memory-subtitle">
                {snapshots.length} samples
              </div>
            </div>
          </div>
        )}

        <div className="memory-chart">
          <h4>Memory Usage Over Time</h4>
          <div className="chart-container">
            <svg width="100%" height="200" viewBox="0 0 800 200">
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map(percent => (
                <line
                  key={percent}
                  x1="0"
                  y1={200 - (percent / 100) * 200}
                  x2="800"
                  y2={200 - (percent / 100) * 200}
                  stroke="#374151"
                  strokeWidth="0.5"
                  opacity="0.3"
                />
              ))}

              {/* Memory usage line */}
              {snapshots.length > 1 && (
                <>
                  <polyline
                    points={snapshots.map((snapshot, index) => {
                      const x = (index / (snapshots.length - 1)) * 800;
                      const maxMemory = Math.max(...snapshots.map(s => s.jsHeapSizeLimit));
                      const y = 200 - (snapshot.usedJSHeapSize / maxMemory) * 200;
                      return `${x},${Math.max(0, Math.min(200, y))}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />

                  {/* Total allocated line */}
                  <polyline
                    points={snapshots.map((snapshot, index) => {
                      const x = (index / (snapshots.length - 1)) * 800;
                      const maxMemory = Math.max(...snapshots.map(s => s.jsHeapSizeLimit));
                      const y = 200 - (snapshot.totalJSHeapSize / maxMemory) * 200;
                      return `${x},${Math.max(0, Math.min(200, y))}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1"
                    strokeDasharray="5,5"
                  />
                </>
              )}

              {/* Data points */}
              {snapshots.map((snapshot, index) => {
                const x = (index / (snapshots.length - 1)) * 800;
                const maxMemory = Math.max(...snapshots.map(s => s.jsHeapSizeLimit));
                const y = 200 - (snapshot.usedJSHeapSize / maxMemory) * 200;
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={Math.max(0, Math.min(200, y))}
                    r="3"
                    fill="#3b82f6"
                    className="memory-data-point"
                    onClick={() => setSelectedSnapshot(snapshot)}
                    style={{ cursor: 'pointer' }}
                  />
                );
              })}
            </svg>
          </div>

          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#3b82f6' }}></div>
              <span>Used Memory</span>
            </div>
            <div className="legend-item">
              <div className="legend-color legend-color--dashed" style={{ backgroundColor: '#10b981' }}></div>
              <span>Allocated Memory</span>
            </div>
          </div>
        </div>

        {selectedSnapshot && (
          <div className="memory-details">
            <h4>Snapshot Details</h4>
            <div className="snapshot-info">
              <div className="info-row">
                <span>Timestamp:</span>
                <span>{new Date(selectedSnapshot.timestamp).toLocaleString()}</span>
              </div>
              <div className="info-row">
                <span>Used Memory:</span>
                <span>{formatBytes(selectedSnapshot.usedJSHeapSize)}</span>
              </div>
              <div className="info-row">
                <span>Total Allocated:</span>
                <span>{formatBytes(selectedSnapshot.totalJSHeapSize)}</span>
              </div>
              <div className="info-row">
                <span>Heap Limit:</span>
                <span>{formatBytes(selectedSnapshot.jsHeapSizeLimit)}</span>
              </div>
              <div className="info-row">
                <span>Usage Percentage:</span>
                <span>
                  {getMemoryUsagePercentage(
                    selectedSnapshot.usedJSHeapSize,
                    selectedSnapshot.totalJSHeapSize
                  ).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}