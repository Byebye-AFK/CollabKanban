import { useEffect, useState } from 'react'

/** How long a toast lingers before dismissing itself. */
const TOAST_MS = 2200

/**
 * Rail destinations App can route to: the pages themselves, plus the
 * dashboard's own sections, which App reaches by opening the dashboard
 * scrolled to them.
 */
const ROUTABLE = ['dashboard', 'boards', 'starred', 'teams', 'graph', 'workspaces']

/**
 * Rail navigation for the library pages (Boards, Teams).
 *
 * The dashboard handles the rail itself because half its entries are
 * sections to scroll to. These pages have no sections, so everything
 * routable is forwarded to App; the rail's remaining entries have no
 * page yet and say so, rather than leaving the click to do nothing.
 *
 * @param {string} self  the rail id of the page using this hook
 * @param {Function} onNavigate  App's page-level navigate
 */
export function useRailNavigate(self, onNavigate) {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), TOAST_MS)
    return () => clearTimeout(t)
  }, [toast])

  const navigate = (id) => {
    if (id === self) return
    if (ROUTABLE.includes(id)) return onNavigate?.(id)
    setToast(`${id[0].toUpperCase() + id.slice(1)} is coming next`)
  }

  return { navigate, toast }
}
