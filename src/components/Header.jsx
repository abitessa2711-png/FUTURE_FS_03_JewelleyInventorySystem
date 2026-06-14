import React from 'react'
import { Menu } from 'lucide-react'

const Header = ({ username, onLogout, toggleTheme, theme, onMenuClick }) => (
  <header className="app-header">
    <div className="flex" style={{ gap: '12px', alignItems: 'center' }}>
      <button className="menu-toggle-btn" onClick={onMenuClick} aria-label="Toggle Menu">
        <Menu size={20} />
      </button>
      <span className="header-title">TAS Jewellers</span>
      <span className="header-subtitle">நகை வணிக முறைமை</span>
    </div>

    <div className="header-actions">
      <button className="btn btn-theme" onClick={toggleTheme}>
        {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
      </button>

      <div className="user-chip">
        <div className="user-avatar">{(username || 'U').charAt(0).toUpperCase()}</div>
        <span>{username}</span>
      </div>

      <button className="btn btn-danger-ghost" onClick={onLogout}>
        வெளியேறு
      </button>
    </div>
  </header>
)

export default Header
