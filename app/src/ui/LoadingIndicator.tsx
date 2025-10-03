import type { LoadingProgress } from '@shared/resources/ResourceLoader';

interface LoadingIndicatorProps {
  progress: LoadingProgress;
  title?: string;
  showDetails?: boolean;
  className?: string;
}

export function LoadingIndicator({ 
  progress, 
  title = 'Loading...', 
  showDetails = false,
  className = '' 
}: LoadingIndicatorProps) {
  const { loaded, total, percentage, currentResource } = progress;

  return (
    <div className={`loading-indicator ${className}`} role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
      <div className="loading-indicator__content">
        <h3 className="loading-indicator__title">{title}</h3>
        
        <div className="loading-indicator__progress">
          <div className="loading-indicator__bar">
            <div 
              className="loading-indicator__fill" 
              style={{ width: `${percentage}%` }}
              aria-hidden="true"
            />
          </div>
          
          <div className="loading-indicator__text">
            <span className="loading-indicator__percentage">{percentage}%</span>
            {showDetails && (
              <span className="loading-indicator__count">
                {loaded} / {total}
              </span>
            )}
          </div>
        </div>

        {showDetails && currentResource && (
          <div className="loading-indicator__current" aria-live="polite">
            <span className="loading-indicator__label">Loading:</span>
            <span className="loading-indicator__resource">
              {formatResourceName(currentResource)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  'aria-label'?: string;
}

export function LoadingSpinner({ 
  size = 'medium', 
  className = '',
  'aria-label': ariaLabel = 'Loading'
}: LoadingSpinnerProps) {
  return (
    <div 
      className={`loading-spinner loading-spinner--${size} ${className}`}
      role="status"
      aria-label={ariaLabel}
    >
      <div className="loading-spinner__circle" aria-hidden="true" />
    </div>
  );
}

interface LoadingOverlayProps {
  isVisible: boolean;
  progress?: LoadingProgress;
  title?: string;
  message?: string;
  onCancel?: () => void;
}

export function LoadingOverlay({ 
  isVisible, 
  progress, 
  title = 'Loading Game Assets',
  message,
  onCancel 
}: LoadingOverlayProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="loading-overlay" role="dialog" aria-modal="true" aria-labelledby="loading-title">
      <div className="loading-overlay__backdrop" />
      <div className="loading-overlay__content">
        {progress ? (
          <LoadingIndicator 
            progress={progress} 
            title={title}
            showDetails={true}
            className="loading-overlay__indicator"
          />
        ) : (
          <div className="loading-overlay__simple">
            <LoadingSpinner size="large" />
            <h3 id="loading-title" className="loading-overlay__title">{title}</h3>
            {message && (
              <p className="loading-overlay__message">{message}</p>
            )}
          </div>
        )}

        {onCancel && (
          <button 
            type="button" 
            className="loading-overlay__cancel"
            onClick={onCancel}
            aria-label="Cancel loading"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function formatResourceName(url: string): string {
  try {
    const urlObj = new URL(url);
    const filename = urlObj.pathname.split('/').pop() || url;
    
    // Remove file extension and format nicely
    const nameWithoutExt = filename.split('.')[0];
    return nameWithoutExt
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  } catch {
    // Fallback for invalid URLs
    return url.split('/').pop() || url;
  }
}