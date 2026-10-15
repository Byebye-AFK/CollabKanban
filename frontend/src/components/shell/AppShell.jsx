import React from 'react'
import Sidebar from './Sidebar'
import '../../styles/shell.css'

/**
 * The signed-in frame: sidebar on the left, one inset panel for the page.
 *
 * Every page — the board included — renders inside it, and every state
 * of a page (loading, error, loaded) renders inside the same frame, so
 * nothing shifts as data arrives.
 */
export default function AppShell({ children, ...sidebar }) {
  return (
    <div className="app">
      <Sidebar {...sidebar} />
      <main className="app-main">{children}</main>
    </div>
  )
}
