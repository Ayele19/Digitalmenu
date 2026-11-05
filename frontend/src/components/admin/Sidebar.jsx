import React, { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  UtensilsCrossed,
  Tags,
  QrCode,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import '../../styles/Sidebar.css'

const NAV_ITEMS = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/menu-items', icon: UtensilsCrossed, label: 'Menu Items' },
  { to: '/admin/categories', icon: Tags, label: 'Categories' },
  { to: '/admin/qr-code', icon: QrCode, label: 'QR Code' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
]

/**
 * Sidebar
 * Reads active route from useLocation.
 * Fixed on desktop, hamburger slide-in drawer on mobile.
 */
export default function Sidebar() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/admin/login')
  }

  function closeSidebar() {
    setOpen(false)
  }

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        className="sidebar-hamburger"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile backdrop */}
      <div
        className={`sidebar-overlay${open ? ' sidebar-overlay-visible' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside className={`sidebar${open ? ' sidebar-open' : ''}`} aria-label="Admin navigation">
        {/* Logo area */}
        <div className="sidebar-logo-area">
          <div className="sidebar-logo-circle" aria-hidden="true">
            <span className="sidebar-logo-emoji">☕</span>
          </div>
          <div>
            <div className="sidebar-cafe-name">Ethiopian Café</div>
            <div className="sidebar-cafe-subtitle">Admin Panel</div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="sidebar-nav" aria-label="Main navigation">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to || location.pathname.startsWith(to + '/')
            return (
              <NavLink
                key={to}
                to={to}
                className={`sidebar-nav-link ${isActive ? 'sidebar-nav-link-active' : 'sidebar-nav-link-inactive'}`}
                onClick={closeSidebar}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={18} aria-hidden="true" />
                {label}
              </NavLink>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="sidebar-logout-area">
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
          >
            <LogOut size={18} aria-hidden="true" />
            Log Out
          </button>
        </div>
      </aside>
    </>
  )
}
