import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: './src/ui',
  base: './', // Verwende relative Pfade für Electron
  envDir: '../../', // Load .env from project root
  build: {
    outDir: '../../dist/ui',
  },
  server: {
    port: 3000,
  },
});
