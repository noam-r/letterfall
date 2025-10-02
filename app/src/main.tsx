import { createRoot } from 'react-dom/client';

import '@styles/globals.css';
import '@styles/app.css';
import { App } from '@app/App';

createRoot(document.getElementById('root') as HTMLElement).render(
  <App />
);
