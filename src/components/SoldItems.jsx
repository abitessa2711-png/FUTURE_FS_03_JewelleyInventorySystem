import React, { useState } from 'react'
import { Receipt, Search, User } from 'lucide-react'

const SoldItems = ({ soldItems = [] }) => {
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')

  const filtered = soldItems.filter(s => {
    const q = search.toLowerCase()
    const d = s.date ? s.date.split('T')[0] : ''
    const matchQ = !q || [s.customerName, s.variant, s.category, s.mobile].some(v => (v || '').toLowerCase().includes(q))
    const matchFrom = !dateFrom || d >= dateFrom
    const matchTo   = !dateTo   || d <= dateTo
    return matchQ && matchFrom && matchTo
  }).slice().reverse()

  const totalRevenue = filtered.reduce((s, i) => s + (i.total || 0), 0)

  return (
    <div className="animate-fade-in">
      <div className="flex-between mb-16">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>விற்பனை வரலாறு</h2>
          <p className="text-sub">{filtered.length} transactions · ₹{totalRevenue.toLocaleString('en-IN')} revenue</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div className="flex" style={{ gap: 12, flexWrap: 'wrap' }}>
          <div className="flex" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '0 12px', flex: 1, minWidth: 200 }}>
            <Search size={14} color="var(--text-sub)" />
            <input
              type="text"
              placeholder="Search customer, item..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', height: 38, background: 'transparent', flex: 1 }}
            />
          </div>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ height: 40, width: 160 }} />
          <input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   style={{ height: 40, width: 160 }} />
          {(search || dateFrom || dateTo) && (
            <button className="btn btn-ghost" onClick={() => { setSearch(''); setDateFrom(''); setDateTo('') }}>Clear</button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Bill ID</th>
                <th>Customer</th>
                <th>Item</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Qty | Wt</th>
                <th style={{ textAlign: 'right' }}>Rate/g</th>
                <th style={{ textAlign: 'right' }}>Discount</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={i}>
                  <td style={{ fontSize: 12, color: 'var(--text-sub)', whiteSpace: 'nowrap' }}>
                    {s.date ? new Date(s.date).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text-sub)' }}>{s.billId || '—'}</td>
                  <td>
                    <div className="fw-600">{s.customerName || 'Walk-in'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>{s.mobile || ''}</div>
                  </td>
                  <td>
                    <div className="fw-600">{s.variant}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>{s.detail || ''}</div>
                  </td>
                  <td style={{ fontSize: 13 }}>{s.category}</td>
                  <td style={{ textAlign: 'right', fontSize: 13 }}>{s.quantity || 0} | {s.weight || 0}g</td>
                  <td style={{ textAlign: 'right', fontSize: 13 }}>₹{s.pricePerGram?.toLocaleString('en-IN') || '—'}</td>
                  <td style={{ textAlign: 'right', color: '#22C55E', fontSize: 13 }}>₹{s.discountAmount || 0}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="text-success fw-600">₹{s.total?.toLocaleString('en-IN')}</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: 48, color: 'var(--text-sub)' }}>
                    <Receipt size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <div>No sales found</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SoldItems
