import React, { useState } from 'react'
import { Package, ShoppingBag, Trash2, Search, TrendingUp } from 'lucide-react'

const Reports = ({ products = [], soldItems = [], bills = [], role, deleteProduct }) => {
  const [filter, setFilter] = useState('')

  // ── Aggregation rules for Summary Dashboard (அறிக்கை) ────────────────────
  const groupedStock = {}
  products.forEach(p => {
    const w = parseFloat(p.weight || 0)
    if (w <= 0) return // Case 3: Ignore all zero stock records

    const cat = p.category
    const sub = p.subcategory

    // Generic subcategory labels from mock data to treat as "no subcategory"
    const isGenericSub = !sub || sub === 'வகைகள்' || sub === 'பொருட்கள்' || sub === 'வகைகள் ' || sub === 'பொருட்கள் '

    if (isGenericSub) {
      // Case 2: If Category has no Subcategory
      const key = cat
      if (!groupedStock[key]) {
        groupedStock[key] = {
          category: cat,
          subcategory: null,
          weight: 0,
          quantity: 0
        }
      }
      groupedStock[key].weight += ((p.quantity || 0) * w)
      groupedStock[key].quantity += (parseInt(p.quantity, 10) || 0)
    } else {
      // Case 1: If Category has Subcategories
      const key = `${cat} - ${sub}`
      if (!groupedStock[key]) {
        groupedStock[key] = {
          category: cat,
          subcategory: sub,
          weight: 0,
          quantity: 0
        }
      }
      groupedStock[key].weight += ((p.quantity || 0) * w)
      groupedStock[key].quantity += (parseInt(p.quantity, 10) || 0)
    }
  })

  // Filter products for the detailed view, ignoring zero stock items (Case 3)
  const filteredProducts = products.filter(p =>
    ((p.category || '').toLowerCase().includes(filter.toLowerCase()) ||
    (p.variant   || '').toLowerCase().includes(filter.toLowerCase()) ||
    (p.subcategory || '').toLowerCase().includes(filter.toLowerCase()) ||
    (p.detail      || '').toLowerCase().includes(filter.toLowerCase())) &&
    (p.quantity > 0 && p.weight > 0)
  )

  const totalStockWeight = products.reduce((s, p) => s + ((p.quantity || 0) * (p.weight || 0)), 0)
  const totalStockQty    = products.reduce((s, p) => s + (p.quantity || 0), 0)
  const totalSalesCount  = soldItems.length
  const totalRevenue     = soldItems.reduce((s, i) => s + (i.total || 0), 0)

  return (
    <div className="animate-fade-in">
      <div className="flex-between mb-16">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>அறிக்கைகள் & கணக்கு</h2>
          <p className="text-sub">Full Inventory Summary & Sales History</p>
        </div>
      </div>

      {/* Mini Stats Belt */}
      <div className="reports-stats-grid">
        <div className="card flex" style={{ gap: 12, padding: '12px 20px' }}>
          <div className="stat-icon" style={{ background: 'var(--gold)18', color: 'var(--gold)', marginBottom: 0 }}><Package size={18}/></div>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-sub)' }}>Stock Qty | Wt</div>
            <div className="fw-600" style={{ fontSize: '13px' }}>{totalStockQty} pcs | {totalStockWeight.toFixed(2)}g</div>
          </div>
        </div>
        <div className="card flex" style={{ gap: 12, padding: '12px 20px' }}>
          <div className="stat-icon" style={{ background: 'var(--success)18', color: 'var(--success)', marginBottom: 0 }}><ShoppingBag size={18}/></div>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-sub)' }}>Total Sales</div>
            <div className="fw-600">{totalSalesCount} Bills</div>
          </div>
        </div>
        <div className="card flex" style={{ gap: 12, padding: '12px 20px' }}>
          <div className="stat-icon" style={{ background: 'var(--gold)18', color: 'var(--gold)', marginBottom: 0 }}><TrendingUp size={18}/></div>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-sub)' }}>Customer Count</div>
            <div className="fw-600">{new Set(soldItems.map(s => s.customerName)).size} Persons</div>
          </div>
        </div>
        <div className="card flex" style={{ gap: 12, padding: '12px 20px' }}>
          <div className="stat-icon" style={{ background: 'var(--gold)18', color: 'var(--gold)', marginBottom: 0 }}><TrendingUp size={18}/></div>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-sub)' }}>Net Revenue</div>
            <div className="fw-600">₹{totalRevenue.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
        {/* Inventory Summary Report */}
        <div className="card">
          <div className="flex-between mb-16">
            <div className="card-title" style={{ border: 'none', marginBottom: 0, paddingBottom: 0 }}>சரக்கு இருப்பு அறிக்கை (Inventory Details)</div>
            <div className="flex" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '0 10px', width: 250 }}>
              <Search size={14} color="var(--text-sub)" />
              <input 
                type="text" placeholder="Search..." 
                value={filter} onChange={e => setFilter(e.target.value)}
                style={{ border: 'none', height: 38, background: 'transparent' }} 
              />
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>பிரிவு & மாடல் (Category & Variant/Size)</th>
                  <th className="desktop-only-col">துணை பிரிவு (Subcategory)</th>
                  <th className="desktop-only-col">விவரம் (Detail)</th>
                  <th style={{ textAlign: 'right' }}>இருப்பு (Stock Qty | Weight)</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr key={p.id} className="table-row">
                    <td>
                      <div className="fw-600">{p.variant}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>
                        {p.category}{p.subcategory ? ` · ${p.subcategory}` : ''}
                      </div>
                      {p.detail && (
                        <div className="mobile-only-detail-inline" style={{ fontSize: 10, color: 'var(--text-sub)', marginTop: '2px' }}>
                          {p.detail}
                        </div>
                      )}
                    </td>
                    <td className="desktop-only-col">{p.subcategory || '—'}</td>
                    <td className="desktop-only-col">{p.detail || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="text-gold fw-600">{p.quantity} pcs | {p.weight}g</span>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-sub)' }}>தகவல் இல்லை</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sales Log */}
        <div className="card">
          <div className="card-title">விற்பனை வரலாறு (Sales Log)</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Item Details</th>
                  <th style={{ textAlign: 'right' }}>Qty | Weight</th>
                  <th className="desktop-only-col" style={{ textAlign: 'right' }}>Rate/g</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {soldItems.slice(-30).reverse().map((s, i) => (
                  <tr key={i} className="table-row">
                    <td><div className="fw-600">{s.customerName || 'Walk-in'}</div><div style={{ fontSize: 11, color: 'var(--text-sub)' }}>{s.date?.split('T')[0]}</div></td>
                    <td><div className="fw-600">{s.variant}</div><div style={{ fontSize: 11, color: 'var(--text-sub)' }}>{s.category} {s.detail ? `- ${s.detail}` : ''}</div></td>
                    <td style={{ textAlign: 'right' }}>
                      <div>{s.quantity || 0} pcs | {s.weight || 0}g</div>
                      {s.pricePerGram !== undefined && (
                        <div className="mobile-only-detail-inline" style={{ fontSize: 10, color: 'var(--text-sub)', marginTop: '2px' }}>
                          ₹{s.pricePerGram?.toLocaleString('en-IN')}/g
                        </div>
                      )}
                    </td>
                    <td className="desktop-only-col" style={{ textAlign: 'right' }}>₹{s.pricePerGram?.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right' }}><span className="text-success fw-600">₹{s.total?.toLocaleString('en-IN')}</span></td>
                  </tr>
                ))}
                {soldItems.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-sub)' }}>தகவல் இல்லை</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports
