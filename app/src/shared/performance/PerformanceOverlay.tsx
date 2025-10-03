
import { usePerformanceMetrics, usePerformanceAlerts } from './hooks';

interface PerformanceOverlayProps {
  visible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function PerformanceOverlay({ 
  visible = true, 
  position = 'top-right' 
}: PerformanceOverlayProps) {
  const { current: metrics, isMonitoring } = usePerformanceMetrics();
  const { active: alerts, critical, warnings } = usePerformanceAlerts();

  if (!visible || !isMonitoring || !metrics) {
    return null;
  }

  const positionStyles = {
    'top-left': { top: '10px', left: '10px' },
    'top-right': { top: '10px', right: '10px' },
    'bottom-left': { bottom: '10px', left: '10px' },
    'bottom-right': { bottom: '10px', right: '10px' },
  };

  const getPerformanceColor = (fps: number) => {
    if (fps >= 50) return '#4ade80'; // green
    if (fps >= 30) return '#fbbf24'; // yellow
    return '#ef4444'; // red
  };

  const getMemoryColor = (memoryMB: number) => {
    if (memoryMB < 100) return '#4ade80'; // green
    if (memoryMB < 150) return '#fbbf24'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles[position],
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        fontFamily: 'monospace',
        fontSize: '12px',
        lineHeight: '1.4',
        zIndex: 9999,
        minWidth: '200px',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        Performance Monitor
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>FPS:</span>
        <span style={{ color: getPerformanceColor(metrics.fps) }}>
          {metrics.fps.toFixed(1)}
          {metrics.fpsTrend !== undefined && (
            <span style={{ fontSize: '10px', marginLeft: '4px' }}>
              {metrics.fpsTrend > 0 ? '↑' : metrics.fpsTrend < 0 ? '↓' : '→'}
            </span>
          )}
        </span>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Memory:</span>
        <span style={{ color: getMemoryColor(metrics.memoryUsage?.usedMB || 0) }}>
          {(metrics.memoryUsage?.usedMB || 0).toFixed(1)} MB
          {metrics.memoryTrend !== undefined && (
            <span style={{ fontSize: '10px', marginLeft: '4px' }}>
              {metrics.memoryTrend > 0 ? '↑' : metrics.memoryTrend < 0 ? '↓' : '→'}
            </span>
          )}
        </span>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Render:</span>
        <span>{metrics.renderTime.toFixed(1)} ms</span>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Entities:</span>
        <span>{metrics.entityCount}</span>
      </div>

      {alerts.length > 0 && (
        <div style={{ marginTop: '8px', paddingTop: '4px', borderTop: '1px solid #444' }}>
          <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>
            Alerts ({alerts.length})
          </div>
          {critical.length > 0 && (
            <div style={{ color: '#ef4444', fontSize: '10px' }}>
              🔴 {critical.length} critical
            </div>
          )}
          {warnings.length > 0 && (
            <div style={{ color: '#fbbf24', fontSize: '10px' }}>
              🟡 {warnings.length} warnings
            </div>
          )}
        </div>
      )}
    </div>
  );
}