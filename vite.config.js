import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],

  // Dev-only proxy — routes /api calls to the local Express server (server/).
  // Not needed (and ignored) when using `vercel dev`, which handles /api natively.
  server: command === 'serve'
    ? {
        proxy: {
          '/api': {
            target: `http://localhost:${process.env.PORT ?? 3001}`,
            changeOrigin: true,
          },
        },
      }
    : undefined,

  build: {
    // No source maps in production — reduces bundle size and avoids exposing logic.
    sourcemap: false,

    // Split React into its own long-lived cached chunk.
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },

    // Raise the warning threshold slightly — Tailwind JIT output is large-ish.
    chunkSizeWarningLimit: 600,
  },
}));
