// ── Library derivation ───────────────────────────────────────
// Pure helpers shared by the Boards and Teams pages. Both present the
// same shape of thing — everything of one kind across every workspace,
// searchable, sortable and groupable — so the arranging lives here once
// and each page supplies only its own comparators and search fields.

/** Case-insensitive match across the named string fields of each item. */
export function filterBy(items = [], query = '', fields = []) {
  const q = query.trim().toLowerCase()
  if (!q) return items
  return items.filter(item =>
    fields.some(field => String(item[field] ?? '').toLowerCase().includes(q)),
  )
}

/**
 * Returns a new sorted array — the input is never reordered in place.
 * An unknown id falls back to the first comparator rather than throwing.
 */
export function sortBy(items = [], comparators = {}, id, fallbackId) {
  const compare = comparators[id] || comparators[fallbackId]
  if (!compare) return [...items]
  return [...items].sort(compare)
}

/**
 * Groups items by their workspace, preserving the order they arrived in
 * so the grouped and flat views agree about precedence.
 *
 * Each item must carry `workspaceId` and `workspaceName`.
 */
export function groupByWorkspace(items = []) {
  const groups = []
  const index = new Map()

  for (const item of items) {
    if (!index.has(item.workspaceId)) {
      const group = { workspaceId: item.workspaceId, name: item.workspaceName, items: [] }
      index.set(item.workspaceId, group)
      groups.push(group)
    }
    index.get(item.workspaceId).items.push(item)
  }

  return groups
}
