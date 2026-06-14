import React from 'react'
import { Trash2 } from 'lucide-react'

const StockDashboard = ({ products = [], onDelete, role = 'admin' }) => {
  const availableProducts = products.filter(p => (parseFloat(p.weight) || 0) > 0)
  const totalWeight = availableProducts.reduce((s, p) => s + ((p.quantity || 0) * (parseFloat(p.weight) || 0)), 0)

  return (
    <div className="animate-fade-in">
      <div className="flex-between mb-16">
        <div>
          <h1 style={{ margin: 0 }}>இருப்பு விவரங்கள்</h1>
          <p className="text-sub" style={{ marginTop: '4px' }}>Live Stock · {availableProducts.length} வகைகள் · மொத்த எடை {totalWeight.toFixed(2)}g</p>
        </div>
      </div>

      {availableProducts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-sub)' }}>
          தகவல் இல்லை — Add stock to see it here.
        </div>
      ) : (
        <div className="stock-cards-grid">
          {availableProducts.map(item => (
            <div key={item.id} className="stock-card" style={{ position: 'relative' }}>
              <div className="stock-card-name">{item.variant || item.subcategory}</div>
              <div className="stock-card-detail">
                {item.category}{item.detail ? ` · ${item.detail}` : ''}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '6px' }}>
                <span style={{ fontSize: '18px', color: 'var(--gold)', fontWeight: 700 }}>{item.quantity}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-sub)', marginRight: '6px' }}>pcs  · </span>
                <span className="stock-card-weight">{parseFloat(item.weight || 0).toFixed(2)}</span>
                <span className="stock-card-unit"> g</span>
              </div>
              {role === 'admin' && (
                <button 
                  className="btn btn-danger-ghost" 
                  style={{ position: 'absolute', top: '10px', right: '10px', padding: '6px' }}
                  onClick={() => window.confirm('இந்த இருப்பை நீக்க வேண்டுமா?') && onDelete(item.id)}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default StockDashboard
