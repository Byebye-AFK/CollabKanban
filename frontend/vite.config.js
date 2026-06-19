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
})
