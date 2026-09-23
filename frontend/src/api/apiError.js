// ── Backend error parsing ───────────────────────────────────
// Spring Boot (server.error.include-message=always) returns JSON on
// error responses shaped like:
//   { timestamp, status, error, message, path }
// This pulls that `message` out so the frontend can throw exactly
// what the backend sent, instead of a generic "API 404" string.

/**
 * Builds an Error from a failed fetch Response, using the backend's
 * own message when the body carries one.
 *
 * @param {Response} res
 * @returns {Promise<Error & { status: number }>}
 */
export async function parseApiError(res) {
  const raw = await res.text().catch(() => '')

  let message = null
  if (raw) {
    try {
      const body = JSON.parse(raw)
      message = body?.message || body?.error || null
    } catch {
      // Not JSON (plain text error body) — use it as-is.
      message = raw
    }
  }

  const err = new Error(message || `Request failed with status ${res.status}`)
  err.status = res.status
  return err
}
