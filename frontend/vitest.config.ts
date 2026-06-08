import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals:     true,
    environment: 'jsdom',
    setupFiles:  ['./tests/__mocks__/setup.ts'],
    coverage:    { provider: 'v8', reporter: ['text','lcov'], exclude: ['node_modules','tests'] },
  },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
