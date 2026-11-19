import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// ── Content-Security-Policy (production build only) ──────────────
// Dev needs inline scripts for React Refresh, so the policy is injected at
// build time. connect-src must name the API and WebSocket origins, which
// come from the same env vars config.js reads.
function cspPlugin(env) {
  const api = (env.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '')
  const ws = env.VITE_WS_URL || `${api.replace(/^http/, 'ws')}/ws`
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    `connect-src 'self' ${api} ${new URL(ws).origin}`,
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join('; ')
  return {
    name: 'inject-csp',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: policy },
        injectTo: 'head-prepend',
      },
    ],
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), cspPlugin(loadEnv(mode, process.cwd(), 'VITE_'))],
  server: {
    port: 5173,
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
        'src/api/boardStatus.js',
        'src/api/boardPrefsApi.js',
        'src/components/board/HiddenColumns.jsx',
        'src/components/board/DisplayMenu.jsx',
        'src/api/socket.js',
        'src/api/authApi.js',
        'src/hooks/useBoard.js',
        'src/hooks/useBoardTeam.js',
        'src/components/board/BoardMembers.jsx',
        'src/components/board/CreateBoardModal.jsx',
        'src/api/teamsApi.js',
        'src/api/library.js',
        'src/components/boards/**',
        'src/components/teams/**',
        'src/components/library/**',
        'src/components/ui/GooeyInput.jsx',
        'src/components/ui/EncryptedText.jsx',
        'src/hooks/useDecryptTree.js',
        'src/pages/BoardsPage.jsx',
        'src/pages/TeamsPage.jsx',
      ],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
}))
