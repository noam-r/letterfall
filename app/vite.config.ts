import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  base: '/letterfall/',
  plugins: [react()],
  resolve: {
    alias: {
      '@app': path.resolve(rootDir, 'src/app'),
      '@game': path.resolve(rootDir, 'src/game'),
      '@ui': path.resolve(rootDir, 'src/ui'),
      '@data': path.resolve(rootDir, 'src/data'),
      '@styles': path.resolve(rootDir, 'src/styles'),
      '@shared': path.resolve(rootDir, 'src/shared'),
    },
  },
});
