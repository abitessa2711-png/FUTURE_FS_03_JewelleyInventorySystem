import React from 'react'
import { Package, ShoppingBag, AlertTriangle, TrendingUp, PlusCircle } from 'lucide-react'

const Dashboard = ({ products = [], sales = [], setActiveTab }) => {
  // Aggregate Stats
  const totalWeight = products.reduce((s, p) => s + ((p.quantity || 0) * (p.weight || 0)), 0)
  const totalQty    = products.reduce((s, p) => s + (p.quantity || 0), 0)
  const productGroups = {};
  products.forEach(p => {
    const key = `${p.category}-${p.subcategory}-${p.variant}`;
    if (!productGroups[key]) {
      productGroups[key] = { ...p, totalQuantity: 0, totalWeight: 0 };
    }
    productGroups[key].totalQuantity += (p.quantity || 0);
    productGroups[key].totalWeight += ((p.quantity || 0) * (p.weight || 0));
  });
  
  const lowStock = Object.values(productGroups).filter(g => g.totalQuantity < 3);
  
  const todayStr = new Date().toISOString().split('T')[0]
  const todaysSales = sales.filter(s => (s.date && s.date.split('T')[0]) === todayStr)
  
  const todayRevenue = todaysSales.reduce((s, i) => s + (i.total || 0), 0)
  const todaySoldWeight = todaysSales.reduce((s, i) => s + (i.weight || 0), 0)

  const cards = [
    { label: 'இருப்பு விபரம்', sub: 'Total Stock (Qty | Wt)', value: `${totalQty} pcs | ${totalWeight.toFixed(2)}g`, icon: <Package />, color: 'var(--gold)' },
    { label: 'இன்றைய விற்பனை', sub: "Today's Net Total", value: `₹${todayRevenue.toLocaleString('en-IN')}`, icon: <TrendingUp />, color: 'var(--success)' },
    { label: 'குறைந்த இருப்பு', sub: 'Low Stock Alerts', value: lowStock.length, icon: <AlertTriangle />, color: 'var(--danger)' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="flex-between mb-16">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>நிர்வாகத் திரை</h2>
          <p className="text-sub">Business Overview & Real-time Statistics</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {cards.map((c, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: `${c.color}18`, color: c.color }}>
              {c.icon}
            </div>
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-sub)', marginTop: '2px' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        {/* Recent Items */}
        <div className="card">
          <div className="card-title">சமீபத்திய வரவு (Recently Added Stock)</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Item</th><th className="hide-mobile">Category</th><th style={{ textAlign: 'right' }}>Stock Qty | Wt</th></tr>
              </thead>
              <tbody>
                {products.slice(-5).reverse().map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="fw-600">{p.variant}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>{p.detail}</div>
                      <div className="show-mobile" style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: '2px' }}>
                        {p.category}
                      </div>
                    </td>
                    <td className="hide-mobile">{p.category}</td>
                    <td style={{ textAlign: 'right' }}><span className="text-gold fw-600">{p.quantity} pcs | {p.weight}g</span></td>
                  </tr>
                ))}
                {products.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', padding: 20 }}>தகவல் இல்லை</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock */}
        <div className="card">
          <div className="card-title">குறைந்த இருப்பு எச்சரிக்கை (Low Stock)</div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {lowStock.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-sub)' }}>அனைத்தும் சரியாக உள்ளது!</div>
            ) : (
              lowStock.map((p, idx) => (
                <div key={idx} className="flex-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div className="fw-600" style={{ fontSize: 14 }}>{p.variant}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>{p.category} - {p.subcategory}</div>
                  </div>
                  <div className="text-danger fw-700">{p.totalQuantity} pcs | {p.totalWeight.toFixed(2)}g</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
