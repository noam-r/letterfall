import { createRoot } from 'react-dom/client';

import '@styles/globals.css';
import '@styles/app.css';
import { App } from '@app/App';
import { ErrorBoundary, errorReporter } from '@shared/error';

// Initialize error reporting
errorReporter.logUserAction(
  { 
    action: 'app_start', 
    timestamp: new Date().toISOString(), 
    context: { component: 'Main' } 
  },
  { success: true }
);

createRoot(document.getElementById('root') as HTMLElement).render(
  <ErrorBoundary
    onError={(error, errorInfo, errorId) => {
      errorReporter.reportError(error, {
        component: 'App',
        action: 'app_render',
        additionalData: { errorInfo, errorId }
      });
    }}
  >
    <App />
  </ErrorBoundary>
);
