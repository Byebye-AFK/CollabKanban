import React from 'react'
import { SidebarIcon, Chevron } from './icons'

/**
 * The thin bar across the top of the main panel: sidebar toggle,
 * breadcrumb, and a slot on the right for the page's own controls.
 *
 * @param {Array<string|{label: string, onClick?: Function}>} crumbs
 *   the trail, last item being the current page
 */
export default function PageHeader({ crumbs = [], collapsed = false, onToggleCollapse, children }) {
  const items = crumbs.map(c => (typeof c === 'string' ? { label: c } : c))

  return (
    <header className="app-header">
      {onToggleCollapse && (
        <button
          className="ui-iconbtn"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Show sidebar' : 'Hide sidebar'}
        >
          <SidebarIcon />
        </button>
      )}

      <nav className="app-crumbs" aria-label="Breadcrumb">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <React.Fragment key={`${item.label}-${i}`}>
              {i > 0 && <Chevron size={12} className="app-crumb-sep" />}
              {item.onClick && !isLast ? (
                <button className="app-crumb" onClick={item.onClick}>{item.label}</button>
              ) : (
                <span
                  className={`app-crumb${isLast ? ' is-now' : ''}`}
                  aria-current={isLast ? 'page' : undefined}
                  title={item.label}
                >
                  {item.label}
                </span>
              )}
            </React.Fragment>
          )
        })}
      </nav>

      {children && <div className="app-header-right">{children}</div>}
    </header>
  )
}
