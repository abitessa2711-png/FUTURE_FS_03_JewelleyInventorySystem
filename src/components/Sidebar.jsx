import React from 'react'
import { PlusCircle, ShoppingBag, TrendingUp, Home, Package, ClipboardCheck, RotateCcw, BarChart2, AlertTriangle, Receipt, Printer } from 'lucide-react'

const MENU = [
  { id: 'dashboard', label: 'முகப்பு',       sub: 'Dashboard',        icon: <Home size={17} />,          roles: ['admin', 'employee'] },
  { id: 'stock',     label: 'இருப்பு',        sub: 'Stock List',       icon: <Package size={17} />,       roles: ['admin', 'auditor', 'employee'] },
  { id: 'add',       label: 'சேர்க்கை',       sub: 'Add Stock',        icon: <PlusCircle size={17} />,    roles: ['admin', 'auditor', 'employee'] },
  { id: 'sell',      label: 'விற்பனை / பில்', sub: 'Sell & Bill',      icon: <ShoppingBag size={17} />,   roles: ['admin', 'auditor', 'employee'] },
  { id: 'sold',      label: 'விற்பனை வரலாறு', sub: 'Sold Items',       icon: <Receipt size={17} />,       roles: ['admin', 'employee'] },
  { id: 'audit',     label: 'கணக்காய்வு',     sub: 'Inventory Audit',  icon: <ClipboardCheck size={17} />, roles: ['admin', 'auditor'] },
  { id: 'reports',   label: 'அறிக்கைகள்',     sub: 'Reports',          icon: <BarChart2 size={17} />,     roles: ['admin'] },
]

const Sidebar = ({ activeTab, setActiveTab, role = 'admin', isOpen, onClose }) => {
  const visible = MENU.filter(item => item.roles.includes(role.toLowerCase()));

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
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
              <div
                key={item.id}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id)
                  if (onClose) onClose()
                }}
              >
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
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Offline Mode</div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
