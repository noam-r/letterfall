
import { useNetworkStatus } from '@shared/network/hooks';

interface OfflineIndicatorProps {
  className?: string;
  showWhenOnline?: boolean;
}

export function OfflineIndicator({ className = '', showWhenOnline = false }: OfflineIndicatorProps) {
  const { networkStatus, isOnline, isSlowConnection, offlineQueueStatus, processOfflineQueue, clearOfflineQueue } = useNetworkStatus();

  if (isOnline && !showWhenOnline && !isSlowConnection) {
    return null;
  }

  const getStatusText = () => {
    if (!isOnline) {
      return 'Offline';
    } else if (isSlowConnection) {
      return 'Slow Connection';
    } else {
      return 'Online';
    }
  };

  const getStatusColor = () => {
    if (!isOnline) {
      return '#ef4444'; // Red
    } else if (isSlowConnection) {
      return '#f59e0b'; // Orange
    } else {
      return '#10b981'; // Green
    }
  };

  const getConnectionDetails = () => {
    if (!networkStatus) return null;

    const details = [];
    
    if (networkStatus.effectiveType !== 'unknown') {
      details.push(networkStatus.effectiveType.toUpperCase());
    }
    
    if (networkStatus.downlink > 0) {
      details.push(`${networkStatus.downlink.toFixed(1)} Mbps`);
    }
    
    if (networkStatus.rtt > 0) {
      details.push(`${networkStatus.rtt}ms`);
    }

    return details.length > 0 ? details.join(' • ') : null;
  };

  return (
    <div className={`offline-indicator ${className}`}>
      <div className="offline-indicator__status">
        <div 
          className="offline-indicator__dot"
          style={{ backgroundColor: getStatusColor() }}
        />
        <span className="offline-indicator__text">
          {getStatusText()}
        </span>
      </div>

      {networkStatus && (
        <div className="offline-indicator__details">
          {getConnectionDetails()}
        </div>
      )}

      {!isOnline && offlineQueueStatus.count > 0 && (
        <div className="offline-indicator__queue">
          <div className="offline-indicator__queue-info">
            {offlineQueueStatus.count} request{offlineQueueStatus.count !== 1 ? 's' : ''} queued
          </div>
          <div className="offline-indicator__queue-actions">
            <button
              onClick={processOfflineQueue}
              className="offline-indicator__button offline-indicator__button--primary"
              disabled={!isOnline}
            >
              Retry
            </button>
            <button
              onClick={clearOfflineQueue}
              className="offline-indicator__button offline-indicator__button--secondary"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {isSlowConnection && (
        <div className="offline-indicator__warning">
          <span>⚠️ Slow connection detected. Some features may be limited.</span>
        </div>
      )}
    </div>
  );
}

interface NetworkStatusBadgeProps {
  compact?: boolean;
}

export function NetworkStatusBadge({ compact = false }: NetworkStatusBadgeProps) {
  const { isOnline, isSlowConnection } = useNetworkStatus();

  if (isOnline && !isSlowConnection) {
    return null;
  }

  const getIcon = () => {
    if (!isOnline) {
      return '📡';
    } else if (isSlowConnection) {
      return '🐌';
    }
    return '✅';
  };

  const getText = () => {
    if (!isOnline) {
      return compact ? 'Offline' : 'No Connection';
    } else if (isSlowConnection) {
      return compact ? 'Slow' : 'Slow Connection';
    }
    return 'Online';
  };

  const getClassName = () => {
    let className = 'network-status-badge';
    
    if (!isOnline) {
      className += ' network-status-badge--offline';
    } else if (isSlowConnection) {
      className += ' network-status-badge--slow';
    } else {
      className += ' network-status-badge--online';
    }
    
    if (compact) {
      className += ' network-status-badge--compact';
    }
    
    return className;
  };

  return (
    <div className={getClassName()}>
      <span className="network-status-badge__icon">{getIcon()}</span>
      <span className="network-status-badge__text">{getText()}</span>
    </div>
  );
}