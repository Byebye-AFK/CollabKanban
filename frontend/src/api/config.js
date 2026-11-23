// Backend origins. Set VITE_API_URL (and optionally VITE_WS_URL) at build time
// for deployments; local dev falls back to the Spring Boot default.
const DEFAULT_API_URL = 'http://localhost:8080'

const rawApi = import.meta.env.VITE_API_URL || DEFAULT_API_URL

export const API_BASE_URL = rawApi.replace(/\/+$/, '')

export const WS_URL =
  import.meta.env.VITE_WS_URL || `${API_BASE_URL.replace(/^http/, 'ws')}/ws`
