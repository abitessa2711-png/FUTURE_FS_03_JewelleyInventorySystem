import React, { useState } from 'react'
import { Package, Activity } from 'lucide-react'

const AuditPage = ({ products = [], soldItems = [], ledger = [] }) => {
  const [auditedIds, setAuditedIds] = useState(() => {
    const saved = localStorage.getItem('manually_audited_ledger_ids')
    return saved ? new Set(JSON.parse(saved)) : new Set()
  })

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
  const totalWeight = (products || []).reduce((sum, p) => sum + (parseFloat(p.weight) || 0), 0)
  const totalSold = (soldItems || []).reduce((sum, s) => sum + (parseInt(s.quantity, 10) || 0), 0)

  // Calculate category-wise split
  const categorySplit = {}
  products.forEach(p => {
    const cat = p.category || 'மற்றவை'
    if (!categorySplit[cat]) {
      categorySplit[cat] = { qty: 0, weight: 0 }
    }
    categorySplit[cat].qty += (parseInt(p.quantity, 10) || 0)
    categorySplit[cat].weight += (parseFloat(p.weight) || 0)
  })

  // Split ledger entries by type
  const addedItems = ledger.filter(item => item.type === 'ADD')
  const soldEntries = ledger.filter(item => item.type === 'SELL')

  // 1. Group all actual sales from soldItems (which contains total amount) chronologically
  const salesPoolForSell = {}
  const sortedSales = [...(soldItems || [])].sort((a, b) => new Date(a.date) - new Date(b.date))
  
  sortedSales.forEach(sale => {
    const key = `${sale.category}||${sale.subcategory || ''}||${sale.variant || ''}||${parseFloat(sale.weight).toFixed(2)}`
    if (!salesPoolForSell[key]) salesPoolForSell[key] = []
    salesPoolForSell[key].push(sale.total)
  })

  // 2. Track consumption indices for matching ledger SELL entries
  const sellIndices = {}
  const sellAmounts = {}
  const sortedSoldEntries = [...soldEntries].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  
  sortedSoldEntries.forEach(item => {
    const key = `${item.category_name}||${item.subcategory_name || ''}||${item.variant_name || ''}||${parseFloat(item.weight).toFixed(2)}`
    if (salesPoolForSell[key]) {
      const idx = sellIndices[key] || 0
      if (idx < salesPoolForSell[key].length) {
        sellAmounts[item.id] = salesPoolForSell[key][idx]
        sellIndices[key] = idx + 1
      }
    }
  })

  // 3. Track matching for addedItems
  const soldPool = {}
  soldEntries.forEach(s => {
    const key = `${s.category_name}||${s.subcategory_name || ''}||${s.variant_name || ''}||${parseFloat(s.weight).toFixed(2)}`
    soldPool[key] = (soldPool[key] || 0) + parseFloat(s.weight)
  })

  const matchedAddIds = new Set()
  // Sort additions oldest-first to consume matching sales chronologically
  const sortedAdds = [...addedItems].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  
  sortedAdds.forEach(a => {
    const key = `${a.category_name}||${a.subcategory_name || ''}||${a.variant_name || ''}||${parseFloat(a.weight).toFixed(2)}`
    const weightToMatch = parseFloat(a.weight)
    
    if (soldPool[key] && soldPool[key] >= weightToMatch - 0.001) {
      matchedAddIds.add(a.id)
      soldPool[key] -= weightToMatch
    }
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

      <div className="audit-tables-grid">
        
        {/* ➕ Added Items Section */}
        <div className="card">
          <h2 style={{ marginBottom: '16px', fontSize: 18, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>➕ சேர்க்கப்பட்ட பொருட்கள்</span>
          </h2>
          <div className="table-wrap" style={{ maxHeight: '450px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>பொருள் விவரம்</th>
                  <th style={{ textAlign: 'right' }}>எடை (g)</th>
                  <th className="hide-mobile" style={{ textAlign: 'center' }}>நிலை (Status)</th>
                  <th className="hide-mobile" style={{ textAlign: 'right' }}>தேதி</th>
                </tr>
              </thead>
              <tbody>
                {addedItems.map(item => {
                  const isSold = matchedAddIds.has(item.id)
                  const isAuditEntry = item.variant_name === 'மாற்று இருப்பு' || 
                                       item.detail?.includes('மாற்று இருப்பு') || 
                                       item.category_name === 'மற்றவை'
                  const isAudited = auditedIds.has(item.id)

                  return (
                    <tr key={item.id} className="table-row" style={isSold ? { opacity: 0.85 } : {}}>
                      <td>
                        <div className="fw-600" style={isSold ? { textDecoration: 'line-through', color: 'var(--text-sub)' } : {}}>
                          {item.variant_name || '—'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>
                          {item.category_name} {item.subcategory_name ? `· ${item.subcategory_name}` : ''}
                        </div>
                        
                        {/* Mobile view badge */}
                        <div className="show-mobile" style={{ display: 'none', marginTop: '6px' }}>
                          {isAuditEntry ? (
                            <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', background: 'rgba(231, 76, 60, 0.15)', color: '#E74C3C', fontWeight: 600 }}>⚙️ தணிக்கை</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleAuditStatus(item.id)}
                              style={{ border: 'none', background: isAudited ? 'rgba(46, 204, 113, 0.15)' : 'rgba(212, 175, 55, 0.15)', color: isAudited ? '#2ECC71' : 'var(--gold)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
                            >
                              {isAudited ? '✅ தணிக்கை' : '👤 நிர்வாகி'}
                            </button>
                          )}
                        </div>

                        <div className="show-mobile" style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: '4px' }}>
                          தேதி: {new Date(item.created_at).toLocaleDateString('en-IN')}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: isSold ? '#EF4444' : 'var(--gold)' }}>
                        {parseFloat(item.weight || 0).toFixed(2)}g
                        {isSold && (
                          <span style={{ fontSize: 9, fontWeight: 500, display: 'block', color: '#EF4444', marginTop: '2px' }}>
                            (விற்பனை செய்யப்பட்டது)
                          </span>
                        )}
                      </td>
                      <td className="hide-mobile" style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                        {isAuditEntry ? (
                          <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', background: 'rgba(231, 76, 60, 0.15)', color: '#E74C3C', fontWeight: 600 }} title="தணிக்கை திருத்தம் (Audit Entry)">
                            ⚙️ தணிக்கை (Audit)
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleAuditStatus(item.id)}
                            style={{ border: 'none', background: isAudited ? 'rgba(46, 204, 113, 0.15)' : 'rgba(212, 175, 55, 0.08)', color: isAudited ? '#2ECC71' : 'var(--text-sub)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease' }}
                            title="நிலையை மாற்ற கிளிக் செய்யவும் (Click to toggle)"
                          >
                            {isAudited ? '✅ சரிபார்க்கப்பட்டது (Audited)' : '👤 நிர்வாகி (Added)'}
                          </button>
                        )}
                      </td>
                      <td className="hide-mobile" style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-sub)', whiteSpace: 'nowrap' }}>
                        {new Date(item.created_at).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  )
                })}
                {addedItems.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-sub)' }}>
                      பதிவுகள் இல்லை
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ➖ Sold Items Section */}
        <div className="card">
          <h2 style={{ marginBottom: '16px', fontSize: 18, color: '#EF4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>➖ விற்பனை செய்யப்பட்ட பொருட்கள்</span>
          </h2>
          <div className="table-wrap" style={{ maxHeight: '450px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>பொருள் விவரம்</th>
                  <th style={{ textAlign: 'right' }}>எடை (g)</th>
                  <th className="hide-mobile" style={{ textAlign: 'right' }}>தேதி</th>
                </tr>
              </thead>
              <tbody>
                {soldEntries.map(item => {
                  return (
                    <tr key={item.id} className="table-row">
                      <td>
                        <div className="fw-600">{item.variant_name || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>
                          {item.category_name} {item.subcategory_name ? `· ${item.subcategory_name}` : ''}
                        </div>
                        <div className="show-mobile" style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: '4px' }}>
                          தேதி: {new Date(item.created_at).toLocaleDateString('en-IN')}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {parseFloat(item.weight || 0).toFixed(2)}g
                      </td>
                      <td className="hide-mobile" style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-sub)', whiteSpace: 'nowrap' }}>
                        {new Date(item.created_at).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  )
                })}
                {soldEntries.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-sub)' }}>
                      பதிவுகள் இல்லை
                    </td>
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

export default AuditPage
