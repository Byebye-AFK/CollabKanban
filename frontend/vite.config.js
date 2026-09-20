import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/board': 'http://localhost:8080',
      '/boards': 'http://localhost:8080',
      '/cards': 'http://localhost:8080',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Scoped to the boards feature. The rest of the app predates any
      // test setup and sits at zero; widening this glob is its own job,
      // not something to bolt onto a feature branch.
      include: [
        'src/api/boardsApi.js',
        'src/api/socket.js',
        'src/hooks/useBoard.js',
        'src/api/teamsApi.js',
        'src/api/library.js',
        'src/components/boards/**',
        'src/components/teams/**',
        'src/components/library/**',
        'src/pages/BoardsPage.jsx',
        'src/pages/TeamsPage.jsx',
      ],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
})
