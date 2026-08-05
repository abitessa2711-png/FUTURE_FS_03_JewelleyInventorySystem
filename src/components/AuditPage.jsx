import React, { useState } from 'react'
import { Package, Activity } from 'lucide-react'

const AuditPage = ({ products = [], soldItems = [], ledger = [] }) => {
  const [auditedIds, setAuditedIds] = useState(() => {
    const saved = localStorage.getItem('manually_audited_ledger_ids')
    return saved ? new Set(JSON.parse(saved)) : new Set()
  })
  const [searchQuery, setSearchQuery] = useState('')

  const toggleAuditStatus = (id) => {
    const newSet = new Set(auditedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setAuditedIds(newSet)
    localStorage.setItem('manually_audited_ledger_ids', JSON.stringify([...newSet]))
  }

  const totalQuantity = (products || []).reduce((sum, p) => sum + (parseInt(p.quantity, 10) || 0), 0)
  const totalWeight = (products || []).reduce((sum, p) => sum + ((parseInt(p.quantity, 10) || 0) * (parseFloat(p.weight) || 0)), 0)
  const totalSold = (soldItems || []).reduce((sum, s) => sum + (parseInt(s.quantity, 10) || 0), 0)

  // Calculate category-wise split
  const categorySplit = {}
  products.forEach(p => {
    const cat = p.category || 'மற்றவை'
    if (!categorySplit[cat]) {
      categorySplit[cat] = { qty: 0, weight: 0 }
    }
    categorySplit[cat].qty += (parseInt(p.quantity, 10) || 0)
    categorySplit[cat].weight += ((parseInt(p.quantity, 10) || 0) * (parseFloat(p.weight) || 0))
  })

  // Group active stock for detailed list view
  const activeStockGroups = {}
  products.forEach(p => {
    const key = `${p.category}||${p.subcategory || ''}||${p.variant || ''}||${p.detail || ''}||${parseFloat(p.weight).toFixed(3)}`
    if (!activeStockGroups[key]) {
      activeStockGroups[key] = {
        category: p.category,
        subcategory: p.subcategory,
        variant: p.variant,
        detail: p.detail,
        unitWeight: parseFloat(p.weight) || 0,
        quantity: 0,
        totalWeight: 0
      }
    }
    activeStockGroups[key].quantity += (parseInt(p.quantity, 10) || 0)
    activeStockGroups[key].totalWeight += ((parseInt(p.quantity, 10) || 0) * (parseFloat(p.weight) || 0))
  })

  const filteredGroups = Object.values(activeStockGroups).filter(g => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase().trim()
    return (g.category || '').toLowerCase().includes(q) ||
           (g.subcategory || '').toLowerCase().includes(q) ||
           (g.variant || '').toLowerCase().includes(q) ||
           (g.detail || '').toLowerCase().includes(q)
  }).sort((a, b) => {
    if (a.category !== b.category) return (a.category || '').localeCompare(b.category || '')
    if (a.subcategory !== b.subcategory) return (a.subcategory || '').localeCompare(b.subcategory || '')
    if (a.variant !== b.variant) return (a.variant || '').localeCompare(b.variant || '')
    return (a.detail || '').localeCompare(b.detail || '')
  })

  const cardStyle = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    textAlign: 'center', gap: '12px'
  }

  return (
    <div className="fade-in">
      <h1 style={{ marginBottom: '8px' }}>சரக்கு கணக்கு பதிவேடு (Ledger Dashboard)</h1>
      <p style={{ color: 'var(--text-sub)', marginBottom: '30px' }}>
        நிறுவனத்தின் மொத்த இருப்பு, சேர்க்கப்பட்ட சரக்கு மற்றும் விற்பனை செய்யப்பட்ட பொருட்களின் வரலாறு.
      </p>

      <div className="audit-cards-grid">
        
        <div className="card" style={cardStyle}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(52,152,219,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={26} color="#3498DB" />
          </div>
          <h2 style={{ color: 'var(--text-sub)', margin: 0, fontSize: 18 }}>மொத்த இருப்பு (அளவு)</h2>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--text-main)', lineHeight: '1' }}>{totalQuantity}</div>
        </div>

        <div className="card" style={cardStyle}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={26} color="var(--gold)" />
          </div>
          <h2 style={{ color: 'var(--text-sub)', margin: 0, fontSize: 18 }}>மொத்த இருப்பு (எடை)</h2>
          <div style={{ fontSize: '30px', fontWeight: 'bold', color: 'var(--gold)', lineHeight: '1' }}>{totalWeight.toFixed(3)}g</div>
        </div>

        <div className="card" style={cardStyle}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(46,204,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={26} color="#2ECC71" />
          </div>
          <h2 style={{ color: 'var(--text-sub)', margin: 0, fontSize: 18 }}>மொத்த விற்பனை (அளவு)</h2>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#2ECC71', lineHeight: '1' }}>{totalSold}</div>
        </div>

      </div>

      {/* Category-wise Inventory Weights */}
      <div className="card" style={{ marginBottom: '30px', padding: '20px 24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📦 பிரிவு வாரியாக மொத்த எடை (Category-wise Inventory Weights)</span>
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginTop: '20px' }}>
          {Object.entries(categorySplit).sort((a, b) => b[1].weight - a[1].weight).map(([catName, stats]) => (
            <div key={catName} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)', marginBottom: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>{catName}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-sub)' }}>எண்ணிக்கை (Qty):</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{stats.qty} pcs</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '6px' }}>
                <span style={{ color: 'var(--text-sub)' }}>மொத்த எடை (Weight):</span>
                <span style={{ fontWeight: 700, color: 'var(--gold)' }}>{stats.weight.toFixed(3)}g</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="flex-between mb-16" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: 18, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <span>📋 விரிவான சரக்கு இருப்பு பட்டியல் (Detailed Inventory Stock List)</span>
          </h2>
          <input
            type="text"
            placeholder="தேடல் (வகை / விவரம் மூலம்) / Search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '280px', height: '36px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-main)', fontSize: '13px' }}
          />
        </div>
        
        <div className="table-wrap" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>பிரிவு (Category)</th>
                <th>துணை பிரிவு (Subcategory)</th>
                <th>மாதிரி (Variant)</th>
                <th>விவரம் (Detail)</th>
                <th style={{ textAlign: 'right' }}>எண்ணிக்கை (Qty)</th>
                <th style={{ textAlign: 'right' }}>ஒற்றை எடை (Unit Wt)</th>
                <th style={{ textAlign: 'right' }}>மொத்த எடை (Total Wt)</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((g, idx) => (
                <tr key={idx} className="table-row">
                  <td className="fw-600">{g.category}</td>
                  <td style={{ color: 'var(--text-sub)' }}>{g.subcategory || '—'}</td>
                  <td className="fw-600">{g.variant || '—'}</td>
                  <td style={{ color: 'var(--text-sub)' }}>{g.detail || '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{g.quantity} pcs</td>
                  <td style={{ textAlign: 'right', color: 'var(--text-sub)' }}>{g.unitWeight.toFixed(3)}g</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--gold)' }}>{g.totalWeight.toFixed(3)}g</td>
                </tr>
              ))}
              {filteredGroups.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-sub)' }}>
                    இருப்பு பொருட்கள் ஏதுமில்லை
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

export default AuditPage
