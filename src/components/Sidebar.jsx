import React from 'react'
import { PlusCircle, ShoppingBag, TrendingUp, Home } from 'lucide-react'

const MENU = [
  { id: 'dashboard', label: 'முகப்பு', sub: 'Dashboard', icon: <Home size={17} />, roles: ['admin', 'auditor'] },
  { id: 'add', label: 'சேர்க்கை', sub: 'Add Stock', icon: <PlusCircle size={17} />, roles: ['admin'] },
  { id: 'sell', label: 'விற்பனை / பில்', sub: 'Sell & Bill', icon: <ShoppingBag size={17} />, roles: ['admin'] },
  { id: 'reports', label: 'அறிக்கைகள்', sub: 'Reports', icon: <TrendingUp size={17} />, roles: ['admin', 'auditor'] },
]

const Sidebar = ({ activeTab, setActiveTab, role = 'admin' }) => {
  const visible = MENU.filter(m => m.roles.includes(role))

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-dot" />
        <div>
          <div className="sidebar-brand-name">TAS Jewellers</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>நகை கணக்கு முறைமை</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {visible.map(item => {
          const active = activeTab === item.id
          return (
            <div key={item.id} className={`nav-item ${active ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}>
              <span style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</span>
              <div>
                <div style={{ fontWeight: active ? 600 : 500 }}>{item.label}</div>
                <div style={{ fontSize: '11px', opacity: 0.6 }}>{item.sub}</div>
              </div>
            </div>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="online-dot" />
        <div>
          <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
            {role === 'admin' ? 'நிர்வாகி (Admin)' : 'Auditor'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
