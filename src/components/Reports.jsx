import React, { useState } from 'react'
import { Package, ShoppingBag, Trash2, Search, TrendingUp } from 'lucide-react'

const Reports = ({ products = [], soldItems = [], bills = [], role, deleteProduct }) => {
  const [filter, setFilter] = useState('')

  const filtered = products.filter(p =>
    (p.category || '').toLowerCase().includes(filter.toLowerCase()) ||
    (p.variant   || '').toLowerCase().includes(filter.toLowerCase()) ||
    (p.subcategory || '').toLowerCase().includes(filter.toLowerCase())
  )

  const totalStockWeight = products.reduce((s, p) => s + (p.weight || 0), 0)
  const totalStockQty    = products.reduce((s, p) => s + (p.quantity || 0), 0)
  const totalSalesCount  = soldItems.length
  const totalRevenue     = soldItems.reduce((s, i) => s + (i.total || 0), 0)

  return (
    <div className="animate-fade-in">
      <div className="flex-between mb-16">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>அறிக்கைகள் & கணக்கு</h2>
          <p className="text-sub">Full Inventory & Sales History</p>
        </div>
      </div>

      {/* Mini Stats Belt */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        {/* Inventory Report */}
        <div className="card">
          <div className="flex-between mb-16">
            <div className="card-title" style={{ border: 'none', marginBottom: 0, paddingBottom: 0 }}>சரக்கு விபரம் (Inventory)</div>
            <div className="flex" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '0 10px', width: 200 }}>
              <Search size={14} color="var(--text-sub)" />
              <input 
                type="text" placeholder="Search..." 
                value={filter} onChange={e => setFilter(e.target.value)}
                style={{ border: 'none', height: 34, background: 'transparent' }} 
              />
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item / Category</th>
                  <th>Sub</th>
                  <th style={{ textAlign: 'right' }}>Weight</th>
                  {role === 'admin' && <th></th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td><div className="fw-600">{p.variant}</div><div style={{ fontSize: 11, color: 'var(--text-sub)' }}>{p.category}</div></td>
                    <td>{p.subcategory}</td>
                    <td style={{ textAlign: 'right' }}><span className="text-gold fw-600">{p.quantity} pcs | {p.weight}g</span></td>
                    {role === 'admin' && (
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-danger-ghost" style={{ padding: 4 }} onClick={() => window.confirm('Delete?') && deleteProduct(p.id)}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
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
                  <th style={{ textAlign: 'right' }}>Rate/g</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {soldItems.slice(-30).reverse().map((s, i) => (
                  <tr key={i}>
                    <td><div className="fw-600">{s.customerName || 'Walk-in'}</div><div style={{ fontSize: 11, color: 'var(--text-sub)' }}>{s.date?.split('T')[0]}</div></td>
                    <td><div className="fw-600">{s.variant}</div><div style={{ fontSize: 11, color: 'var(--text-sub)' }}>{s.category} {s.detail ? `- ${s.detail}` : ''}</div></td>
                    <td style={{ textAlign: 'right' }}>{s.quantity || 0} pcs | {s.weight || 0}g</td>
                    <td style={{ textAlign: 'right' }}>₹{s.pricePerGram?.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right' }}><span className="text-success fw-600">₹{s.total?.toLocaleString('en-IN')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports
