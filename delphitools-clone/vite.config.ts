import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'site',
    emptyOutDir: true,
  },
  test: {
    environment: 'node',
  },
});
