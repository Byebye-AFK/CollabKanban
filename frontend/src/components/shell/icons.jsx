import React from 'react'

/**
 * Shared stroke icons.
 *
 * Every icon is drawn on the same 24×24 grid with a round cap so the
 * visual weight stays even wherever they are mixed. Size and stroke are
 * overridable, but the defaults match the shell's chrome.
 */
function Icon({ paths, size = 16, stroke = 1.9, children, ...rest }) {
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

export const SearchIcon = props => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.6-3.6" />
  </Icon>
)

export const Chevron = props => <Icon paths={['M9 6l6 6-6 6']} size={14} stroke={2} {...props} />

export const CollapseIcon = props => (
  <Icon paths={['M20 12H5', 'm10 7-5 5 5 5']} size={17} {...props} />
)

export const CloseIcon = props => (
  <Icon paths={['M6 6l12 12', 'M18 6 6 18']} stroke={2} {...props} />
)

export const PlusIcon = props => (
  <Icon paths={['M12 5v14', 'M5 12h14']} size={14} stroke={2.4} {...props} />
)

export const SortIcon = props => (
  <Icon paths={['M4 7h16', 'M7 12h10', 'M10 17h4']} stroke={1.8} {...props} />
)

export const BoardIcon = props => (
  <Icon paths={['M3 4.5h18v15H3z', 'M9 4.5v15', 'M15 4.5v15']} stroke={1.7} {...props} />
)

export const GroupIcon = props => (
  <Icon paths={['M3 5h18', 'M3 12h18', 'M3 19h10']} stroke={1.8} {...props} />
)

/**
 * The one icon that carries state: hollow when the board is not starred,
 * solid when it is, so the toggle reads at a glance without its label.
 */
export const StarIcon = ({ filled = false, ...props }) => (
  <Icon
    paths={['M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z']}
    size={17}
    stroke={1.8}
    fill={filled ? 'currentColor' : 'none'}
    {...props}
  />
)

export const GridIcon = props => (
  <Icon paths={['M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M4 13h7v7H4z', 'M13 13h7v7h-7z']} stroke={1.8} {...props} />
)
