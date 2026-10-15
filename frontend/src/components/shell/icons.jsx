import React from 'react'
import { STATUS } from '../../api/boardStatus'

/**
 * Shared stroke icons.
 *
 * Every icon is drawn on the same 24×24 grid with a round cap so the
 * visual weight stays even wherever they are mixed. Size and stroke are
 * overridable, but the defaults match the chrome: 16px at 1.7.
 */
export function Icon({ paths, size = 16, stroke = 1.7, children, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {paths?.map((d, i) => <path key={i} d={d} />)}
      {children}
    </svg>
  )
}

/** Path data for the navigation glyphs, so nav tables can name an icon. */
export const GLYPHS = {
  dashboard:  ['M4 4h7v7H4z', 'M13 4h7v4h-7z', 'M13 10h7v10h-7z', 'M4 13h7v7H4z'],
  graph:      ['M12 5.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z', 'M5 16a2 2 0 1 1 0 4 2 2 0 0 1 0-4z', 'M19 16a2 2 0 1 1 0 4 2 2 0 0 1 0-4z', 'M10.4 10.2 6.3 15.1', 'M13.6 10.2l4.1 4.9'],
  workspaces: ['M3 7.5 12 3l9 4.5-9 4.5-9-4.5z', 'M3 12l9 4.5 9-4.5', 'M3 16.5 12 21l9-4.5'],
  teams:      ['M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20', 'M9 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M22 20v-1.5a4 4 0 0 0-3-3.87', 'M16 3.6a4 4 0 0 1 0 7.75'],
  boards:     ['M4 4.5h16v15H4z', 'M9.5 4.5v15', 'M14.5 4.5v15'],
  starred:    ['M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z'],
  settings:   ['M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z', 'M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.2a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.4 15H3a2 2 0 0 1 0-4h.2A1.6 1.6 0 0 0 4.3 8.2l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9.9 4.3V4a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.2a2 2 0 0 1 0 4h-.2a1.6 1.6 0 0 0-1.1.9z'],
  signout:    ['M15 17l5-5-5-5', 'M20 12H9', 'M11 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5'],
}

export const SearchIcon = props => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4-4" />
  </Icon>
)

export const Chevron = props => <Icon paths={['M9 6l6 6-6 6']} size={14} stroke={2} {...props} />

export const ChevronDown = props => <Icon paths={['M6 9l6 6 6-6']} size={12} stroke={2.2} {...props} />

/** The panel-toggle glyph Linear uses to show and hide its sidebar. */
export const SidebarIcon = props => (
  <Icon {...props}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <path d="M9.5 4.5v15" />
  </Icon>
)

/** Kept for callers that still name it; it is the sidebar toggle. */
export const CollapseIcon = SidebarIcon

export const CloseIcon = props => (
  <Icon paths={['M6 6l12 12', 'M18 6 6 18']} stroke={2} {...props} />
)

export const PlusIcon = props => (
  <Icon paths={['M12 5v14', 'M5 12h14']} size={14} stroke={2} {...props} />
)

export const MoreIcon = props => (
  <Icon size={16} {...props}>
    <circle cx="5.5" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="18.5" cy="12" r="1.3" fill="currentColor" stroke="none" />
  </Icon>
)

export const SortIcon = props => (
  <Icon paths={['M4 7h16', 'M7 12h10', 'M10 17h4']} {...props} />
)

export const FilterIcon = SortIcon

/** Two sliders — the "Display" control. */
export const DisplayIcon = props => (
  <Icon paths={['M4 8h9', 'M17 8h3', 'M4 16h3', 'M11 16h9']} {...props}>
    <circle cx="15" cy="8" r="2" />
    <circle cx="9" cy="16" r="2" />
  </Icon>
)

export const BoardIcon = props => <Icon paths={GLYPHS.boards} {...props} />

export const GroupIcon = props => (
  <Icon paths={['M3 5h18', 'M3 12h18', 'M3 19h10']} {...props} />
)

export const GridIcon = props => (
  <Icon paths={['M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M4 13h7v7H4z', 'M13 13h7v7h-7z']} {...props} />
)

export const ListIcon = props => (
  <Icon paths={['M8 6h12', 'M8 12h12', 'M8 18h12', 'M4 6h.01', 'M4 12h.01', 'M4 18h.01']} {...props} />
)

/**
 * The one icon that carries state: hollow when the board is not starred,
 * solid when it is, so the toggle reads at a glance without its label.
 */
export const StarIcon = ({ filled = false, ...props }) => (
  <Icon paths={GLYPHS.starred} fill={filled ? 'currentColor' : 'none'} {...props} />
)

export const TrashIcon = props => (
  <Icon paths={['M4 7h16', 'M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7', 'M6.5 7l.8 11.2A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.8L17.5 7']} {...props} />
)

export const EyeOffIcon = props => (
  <Icon paths={['M3 3l18 18', 'M10.6 5.1A9.7 9.7 0 0 1 12 5c5 0 8.5 4.5 9.5 7a13 13 0 0 1-2.4 3.4', 'M6.3 6.3A13 13 0 0 0 2.5 12c1 2.5 4.5 7 9.5 7a9.4 9.4 0 0 0 5.3-1.6', 'M9.9 9.9a3 3 0 0 0 4.2 4.2']} {...props} />
)

export const EyeIcon = props => (
  <Icon {...props}>
    <path d="M2.5 12c1-2.5 4.5-7 9.5-7s8.5 4.5 9.5 7c-1 2.5-4.5 7-9.5 7s-8.5-4.5-9.5-7z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
)

export const RefreshIcon = props => (
  <Icon paths={['M20 12a8 8 0 1 1-2.3-5.7', 'M20 4v5h-5']} {...props} />
)

export const CheckIcon = props => <Icon paths={['m5 13 4 4L19 7']} stroke={2} {...props} />

export const CopyIcon = props => (
  <Icon paths={['M5 15V5a2 2 0 0 1 2-2h10']} {...props}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
  </Icon>
)

export const InviteIcon = props => (
  <Icon paths={['M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20', 'M9 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M19 8v6', 'M22 11h-6']} {...props} />
)

export const WarnIcon = props => (
  <Icon paths={['M12 3.6 21 19H3z', 'M12 9.5v4.5', 'M12 17h.01']} size={20} {...props} />
)

export const ArrowLeftIcon = props => <Icon paths={['M19 12H5', 'm11 6-6 6 6 6']} {...props} />

/** A dashed head-and-shoulders: a card nobody has picked up yet. */
export const UnassignedIcon = props => (
  <Icon strokeDasharray="2 2.4" {...props}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="10" r="3" strokeDasharray="none" />
    <path d="M7 18.2a5.5 5.5 0 0 1 10 0" strokeDasharray="none" />
  </Icon>
)

// ── Status icons ─────────────────────────────────────────────
// Linear's set, drawn on a 14px grid: a dashed ring for backlog, an
// empty ring for to-do, a ring with a half-filled core for work in
// flight, and solid discs with a mark for done and canceled.

const STATUS_COLOR = {
  [STATUS.BACKLOG]:  'var(--status-backlog)',
  [STATUS.TODO]:     'var(--status-todo)',
  [STATUS.STARTED]:  'var(--status-started)',
  [STATUS.DONE]:     'var(--status-done)',
  [STATUS.CANCELED]: 'var(--status-canceled)',
}

function StatusGlyph({ status }) {
  switch (status) {
    case STATUS.BACKLOG:
      return <circle cx="7" cy="7" r="5.75" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1.4 1.65" />
    case STATUS.STARTED:
      return (
        <>
          <circle cx="7" cy="7" r="5.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 3.5a3.5 3.5 0 0 1 0 7z" fill="currentColor" />
        </>
      )
    case STATUS.DONE:
      return (
        <>
          <circle cx="7" cy="7" r="6.5" fill="currentColor" />
          <path d="m4.4 7.1 1.8 1.8 3.5-3.6" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )
    case STATUS.CANCELED:
      return (
        <>
          <circle cx="7" cy="7" r="6.5" fill="currentColor" />
          <path d="m4.9 4.9 4.2 4.2M9.1 4.9 4.9 9.1" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )
    default:
      return <circle cx="7" cy="7" r="5.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
  }
}

export function StatusIcon({ status = STATUS.TODO, size = 14, className = '', ...rest }) {
  return (
    <span
      className={`ui-status ${className}`.trim()}
      style={{ color: STATUS_COLOR[status] ?? STATUS_COLOR[STATUS.TODO] }}
      data-status={status}
      {...rest}
    >
      <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true">
        <StatusGlyph status={status} />
      </svg>
    </span>
  )
}
