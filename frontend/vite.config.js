import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vercel serves the site at the root and sets VERCEL during its builds; GitHub Pages serves it under /OPcourts/ (case matters).
export default defineConfig({
  plugins: [react()],
  base: process.env.VERCEL ? '/' : '/OPcourts/',
});
