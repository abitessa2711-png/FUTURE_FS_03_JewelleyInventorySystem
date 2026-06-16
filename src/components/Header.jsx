import React from 'react'
import { Menu, Sun, Moon } from 'lucide-react'

const Header = ({ username, onLogout, onMenuClick, theme, toggleTheme }) => (
  <header className="app-header">
    <div className="flex" style={{ gap: '12px', alignItems: 'center' }}>
      <button className="menu-toggle-btn" onClick={onMenuClick} aria-label="Toggle Menu">
        <Menu size={20} />
      </button>
      <span className="header-title">TAS Jewellers</span>
      <span className="header-subtitle">நகை வணிக முறைமை</span>
    </div>

    <div className="header-actions">
      <button 
        className="btn-theme" 
        onClick={toggleTheme} 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '6px 12px', 
          border: '1px solid var(--border)', 
          borderRadius: '20px', 
          background: 'var(--bg)', 
          color: 'var(--gold)', 
          cursor: 'pointer',
          height: '34px',
          fontWeight: '600',
          gap: '6px'
        }}
        title={theme === 'light' ? 'இருண்ட தீம் (Dark Theme)' : 'ஒளிரும் தீம் (Light Theme)'}
      >
        {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        <span style={{ fontSize: '12px', color: 'var(--text-main)' }}>
          {theme === 'light' ? 'Dark' : 'Light'}
        </span>
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
