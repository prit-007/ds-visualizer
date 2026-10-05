import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import mdx from '@mdx-js/rollup';

export default defineConfig({
  // GitHub Pages project sites are served from /<repo>/ — the deploy
  // workflow sets BASE_PATH=/ds-visualizer/; local dev stays '/'.
  base: process.env.BASE_PATH || '/',
  plugins: [mdx(), react()],
  server: {
    port: 3000,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
});
