import React, { useState } from 'react'
import { Package, Activity, ChevronDown, ChevronRight, Folder, Layers, Tag, Trash2, Search, Calendar, AlertTriangle } from 'lucide-react'

const AuditPage = ({ products = [], soldItems = [], ledger = [], onDeleteProduct, onDeleteSale, role = 'admin' }) => {
  const [expandedCats, setExpandedCats] = useState(new Set())
  const [expandedSubs, setExpandedSubs] = useState(new Set())
  const [expandedVars, setExpandedVars] = useState(new Set())
  const [auditSearch, setAuditSearch] = useState('')
  const [activeAuditTab, setActiveAuditTab] = useState('stock') // 'stock' or 'sales'

  const toggleCat = (catName) => {
    const newSet = new Set(expandedCats)
    if (newSet.has(catName)) {
      newSet.delete(catName)
    } else {
      newSet.add(catName)
    }
    setExpandedCats(newSet)
  }

  const toggleSub = (subKey) => {
    const newSet = new Set(expandedSubs)
    if (newSet.has(subKey)) {
      newSet.delete(subKey)
    } else {
      newSet.add(subKey)
    }
    setExpandedSubs(newSet)
  }

  const toggleVar = (varKey) => {
    const newSet = new Set(expandedVars)
    if (newSet.has(varKey)) {
      newSet.delete(varKey)
    } else {
      newSet.add(varKey)
    }
    setExpandedVars(newSet)
  }

  const activeProducts = (products || []).filter(p => (parseInt(p.quantity, 10) || 0) > 0)

  const totalQuantity = activeProducts.reduce((sum, p) => sum + (parseInt(p.quantity, 10) || 0), 0)
  const totalWeight = activeProducts.reduce((sum, p) => sum + ((parseInt(p.quantity, 10) || 0) * (parseFloat(p.weight) || 0)), 0)
  const totalSold = (soldItems || []).reduce((sum, s) => sum + (parseInt(s.quantity, 10) || 0), 0)
  const totalSoldWeight = (soldItems || []).reduce((sum, s) => sum + (parseFloat(s.weight || 0) || 0), 0)

  // Calculate category-wise split
  const categorySplit = {}
  activeProducts.forEach(p => {
    const cat = p.category || 'மற்றவை'
    if (!categorySplit[cat]) {
      categorySplit[cat] = { qty: 0, weight: 0 }
    }
    categorySplit[cat].qty += (parseInt(p.quantity, 10) || 0)
    categorySplit[cat].weight += ((parseInt(p.quantity, 10) || 0) * (parseFloat(p.weight) || 0))
  })

  // Group active stock hierarchically: Category -> Subcategory -> Variant -> Items
  const hierarchy = {}
  activeProducts.forEach(p => {
    const cat = p.category || 'மற்றவை'
    const sub = p.subcategory || 'வகைகள்'
    const variantKey = p.variant || '—'
    const unitWt = parseFloat(p.weight) || 0
    const qty = parseInt(p.quantity, 10) || 0
    const totalWt = qty * unitWt

    if (!hierarchy[cat]) {
      hierarchy[cat] = {
        name: cat,
        qty: 0,
        weight: 0,
        subcategories: {}
      }
    }
    hierarchy[cat].qty += qty
    hierarchy[cat].weight += totalWt

    if (!hierarchy[cat].subcategories[sub]) {
      hierarchy[cat].subcategories[sub] = {
        name: sub,
        qty: 0,
        weight: 0,
        variants: {}
      }
    }
    hierarchy[cat].subcategories[sub].qty += qty
    hierarchy[cat].subcategories[sub].weight += totalWt

    if (!hierarchy[cat].subcategories[sub].variants[variantKey]) {
      hierarchy[cat].subcategories[sub].variants[variantKey] = {
        name: variantKey,
        qty: 0,
        weight: 0,
        items: []
      }
    }
    hierarchy[cat].subcategories[sub].variants[variantKey].qty += qty
    hierarchy[cat].subcategories[sub].variants[variantKey].weight += totalWt
    hierarchy[cat].subcategories[sub].variants[variantKey].items.push(p)
  })

  const cardStyle = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    textAlign: 'center', gap: '12px'
  }

  // Filtered sales for audit
  const filteredSales = (soldItems || []).filter(s => {
    if (!auditSearch) return true
    const q = auditSearch.toLowerCase().trim()
    return (s.customerName || '').toLowerCase().includes(q) ||
           (s.category || '').toLowerCase().includes(q) ||
           (s.variant || '').toLowerCase().includes(q) ||
           (s.detail || '').toLowerCase().includes(q) ||
           String(s.billId || '').toLowerCase().includes(q)
  }).slice().reverse()

  return (
    <div className="fade-in">
      <div className="flex-between mb-16">
        <div>
          <h1 style={{ marginBottom: '4px' }}>கணக்காய்வு தணிக்கை (Audit & Ledger Dashboard)</h1>
          <p style={{ color: 'var(--text-sub)', margin: 0 }}>
            இருப்பு சரிபார்ப்பு, தவறான பதிவுகளை நீக்குதல் மற்றும் முழுமையான பரிவர்த்தனை தணிக்கை.
          </p>
        </div>

        {/* Audit Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <button 
            className={`btn ${activeAuditTab === 'stock' ? 'btn-gold' : 'btn-ghost'}`} 
            style={{ fontSize: '12px', height: '34px', padding: '0 12px' }}
            onClick={() => setActiveAuditTab('stock')}
          >
            📦 இருப்பு தணிக்கை (Stock Audit)
          </button>
          <button 
            className={`btn ${activeAuditTab === 'sales' ? 'btn-gold' : 'btn-ghost'}`} 
            style={{ fontSize: '12px', height: '34px', padding: '0 12px' }}
            onClick={() => setActiveAuditTab('sales')}
          >
            🧾 விற்பனை தணிக்கை (Sales Audit)
          </button>
        </div>
      </div>

      <div className="audit-cards-grid">
        
        <div className="card" style={cardStyle}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(52,152,219,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={26} color="#3498DB" />
          </div>
          <h2 style={{ color: 'var(--text-sub)', margin: 0, fontSize: 16 }}>மொத்த இருப்பு (அளவு)</h2>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-main)', lineHeight: '1' }}>{totalQuantity} pcs</div>
        </div>

        <div className="card" style={cardStyle}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={26} color="var(--gold)" />
          </div>
          <h2 style={{ color: 'var(--text-sub)', margin: 0, fontSize: 16 }}>மொத்த இருப்பு (எடை)</h2>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--gold)', lineHeight: '1' }}>{totalWeight.toFixed(3)}g</div>
        </div>

        <div className="card" style={cardStyle}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(46,204,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={26} color="#2ECC71" />
          </div>
          <h2 style={{ color: 'var(--text-sub)', margin: 0, fontSize: 16 }}>மொத்த விற்பனை (அளவு & எடை)</h2>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2ECC71', lineHeight: '1' }}>
            {totalSold} pcs | {totalSoldWeight.toFixed(3)}g
          </div>
        </div>

      </div>

      {activeAuditTab === 'stock' ? (
        <>
          {/* Category-wise Inventory Weights */}
          <div className="card" style={{ marginBottom: '24px', padding: '20px 24px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📦 பிரிவு வாரியாக மொத்த எடை (Category-wise Summary)</span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px', marginTop: '16px' }}>
              {Object.entries(categorySplit).sort((a, b) => b[1].weight - a[1].weight).map(([catName, stats]) => (
                <div key={catName} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)', marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>{catName}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-sub)' }}>எண்ணிக்கை (Qty):</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{stats.qty} pcs</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px' }}>
                    <span style={{ color: 'var(--text-sub)' }}>மொத்த எடை (Weight):</span>
                    <span style={{ fontWeight: 700, color: 'var(--gold)' }}>{stats.weight.toFixed(3)}g</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hierarchical Stock with Inline Deletion */}
          <div className="card" style={{ padding: '24px' }}>
            <div className="flex-between" style={{ marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: 17, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <span>📋 வகைப்பாடு சரக்கு இருப்பு & தவறான பதிவு நீக்கம் (Audited Stock Hierarchy & Delete)</span>
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-sub)' }}>
                பிரிவை விரித்து தவறான உருப்படிகளை உடனே நீக்கலாம் (Click to expand & delete)
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.values(hierarchy).sort((a, b) => b.weight - a.weight).map(cat => {
                const isCatExpanded = expandedCats.has(cat.name)
                
                return (
                  <div key={cat.name} style={{ border: '1px solid var(--border)', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.01)', overflow: 'hidden' }}>
                    {/* Category Row */}
                    <div 
                      onClick={() => toggleCat(cat.name)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', cursor: 'pointer', background: isCatExpanded ? 'rgba(212, 175, 55, 0.06)' : 'transparent', transition: 'all 0.2s ease' }}
                      className="tree-category-row"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {isCatExpanded ? <ChevronDown size={18} color="var(--gold)" /> : <ChevronRight size={18} color="var(--text-sub)" />}
                        <Folder size={18} color="var(--gold)" />
                        <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)' }}>{cat.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '20px', fontSize: '13px', fontWeight: 600 }}>
                        <span style={{ color: 'var(--text-sub)' }}>{cat.qty} pcs</span>
                        <span style={{ color: 'var(--gold)' }}>{cat.weight.toFixed(3)}g</span>
                      </div>
                    </div>

                    {/* Subcategories (Visible only when Category is expanded) */}
                    {isCatExpanded && (
                      <div style={{ background: 'rgba(0,0,0,0.1)', borderTop: '1px solid var(--border)', padding: '12px 18px' }}>
                        {Object.values(cat.subcategories).length === 0 ? (
                          <div style={{ padding: '10px', color: 'var(--text-sub)', fontSize: '13px' }}>பிரிவுகள் ஏதுமில்லை</div>
                        ) : (
                          Object.values(cat.subcategories).sort((a, b) => b.weight - a.weight).map(sub => {
                            const subKey = `${cat.name}||${sub.name}`
                            const isSubExpanded = expandedSubs.has(subKey)
                            
                            return (
                              <div key={sub.name} style={{ margin: '8px 0', border: '1px solid var(--border)', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.01)', overflow: 'hidden' }}>
                                {/* Subcategory Row */}
                                <div 
                                  onClick={() => toggleSub(subKey)}
                                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', cursor: 'pointer', background: isSubExpanded ? 'rgba(255, 255, 255, 0.02)' : 'transparent' }}
                                  className="tree-subcategory-row"
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {isSubExpanded ? <ChevronDown size={16} color="var(--text-main)" /> : <ChevronRight size={16} color="var(--text-sub)" />}
                                    <Layers size={16} color="var(--text-sub)" />
                                    <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>{sub.name}</span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', fontWeight: 600 }}>
                                    <span style={{ color: 'var(--text-sub)' }}>{sub.qty} pcs</span>
                                    <span style={{ color: 'var(--text-main)' }}>{sub.weight.toFixed(3)}g</span>
                                  </div>
                                </div>

                                {/* Variants List (Visible only when Subcategory is expanded) */}
                                {isSubExpanded && (
                                  <div style={{ background: 'rgba(0, 0, 0, 0.15)', borderTop: '1px solid var(--border)', padding: '10px 16px' }}>
                                    {Object.values(sub.variants).sort((a, b) => b.weight - a.weight).map(variant => {
                                      const varKey = `${subKey}||${variant.name}`
                                      const isVarExpanded = expandedVars.has(varKey)
                                      
                                      return (
                                        <div key={variant.name} style={{ marginBottom: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                                          <div 
                                            onClick={() => toggleVar(varKey)}
                                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', cursor: 'pointer' }}
                                          >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                              {isVarExpanded ? <ChevronDown size={14} color="var(--gold)" /> : <ChevronRight size={14} color="var(--text-sub)" />}
                                              <Tag size={13} color="var(--gold)" />
                                              <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)' }}>{variant.name}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '14px', fontSize: '12px', fontWeight: 600 }}>
                                              <span style={{ color: 'var(--text-sub)' }}>{variant.qty} pcs</span>
                                              <span style={{ color: 'var(--gold)' }}>{variant.weight.toFixed(3)}g</span>
                                            </div>
                                          </div>

                                          {/* Individual Stock Items with Direct Delete Option */}
                                          {isVarExpanded && (
                                            <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border)' }}>
                                              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                                                <thead>
                                                  <tr style={{ color: 'var(--text-sub)', borderBottom: '1px solid var(--border)' }}>
                                                    <th style={{ textAlign: 'left', padding: '6px 4px' }}>ID</th>
                                                    <th style={{ textAlign: 'left', padding: '6px 4px' }}>தேதி (Date)</th>
                                                    <th style={{ textAlign: 'left', padding: '6px 4px' }}>விவரம் (Detail)</th>
                                                    <th style={{ textAlign: 'right', padding: '6px 4px' }}>எடை (Unit g)</th>
                                                    <th style={{ textAlign: 'center', padding: '6px 4px' }}>Qty</th>
                                                    <th style={{ textAlign: 'right', padding: '6px 4px' }}>மொத்த எடை</th>
                                                    <th style={{ textAlign: 'center', width: '60px', padding: '6px 4px' }}>நீக்கு (Del)</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {variant.items.map(item => (
                                                    <tr key={item.id} style={{ borderBottom: '1px dashed rgba(255,255,255,0.05)' }}>
                                                      <td style={{ padding: '8px 4px', color: 'var(--text-sub)', fontWeight: 600 }}>#{item.id}</td>
                                                      <td style={{ padding: '8px 4px', color: 'var(--text-sub)' }}>
                                                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : '—'}
                                                      </td>
                                                      <td style={{ padding: '8px 4px', color: 'var(--text-main)', fontWeight: 500 }}>{item.detail || '—'}</td>
                                                      <td style={{ textAlign: 'right', padding: '8px 4px', fontWeight: 600 }}>{parseFloat(item.weight || 0).toFixed(3)}g</td>
                                                      <td style={{ textAlign: 'center', padding: '8px 4px', fontWeight: 600, color: 'var(--gold)' }}>{item.quantity}</td>
                                                      <td style={{ textAlign: 'right', padding: '8px 4px', fontWeight: 700, color: 'var(--gold)' }}>
                                                        {((item.quantity || 0) * (parseFloat(item.weight) || 0)).toFixed(3)}g
                                                      </td>
                                                      <td style={{ textAlign: 'center', padding: '8px 4px' }}>
                                                        <button 
                                                          className="btn btn-danger-ghost"
                                                          style={{ padding: '4px', minWidth: 'auto', height: '26px' }}
                                                          onClick={() => {
                                                            if (window.confirm(`ID #${item.id} (${variant.name}: ${item.weight}g) சரக்கு இருப்பை நீக்க வேண்டுமா?`)) {
                                                              if (onDeleteProduct) onDeleteProduct(item.id)
                                                            }
                                                          }}
                                                          title="இந்த தவறான இருப்பை நீக்கு (Delete Stock Entry)"
                                                        >
                                                          <Trash2 size={13} />
                                                        </button>
                                                      </td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      ) : (
        /* Sales Audit Tab with Delete Option */
        <div className="card" style={{ padding: '24px' }}>
          <div className="flex-between mb-16" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: 18, color: 'var(--gold)', margin: 0 }}>
                🧾 விற்பனை பரிவர்த்தனைகள் தணிக்கை (Sales Audit & Reversals)
              </h2>
              <p style={{ color: 'var(--text-sub)', fontSize: '13px', margin: '4px 0 0 0' }}>
                தவறாக விற்கப்பட்ட பதிவுகளை நீக்கினால், அத்தொகை நீக்கப்பட்டு சரக்கு இருப்பு மீண்டும் சேர்க்கப்படும்.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 10px', height: '36px', minWidth: '240px' }}>
              <Search size={14} color="var(--text-sub)" />
              <input 
                type="text"
                placeholder="வாடிக்கையாளர், பொருள், Bill ID..."
                value={auditSearch}
                onChange={e => setAuditSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', height: '100%', fontSize: '12px', outline: 'none', marginLeft: '6px', width: '100%', color: 'var(--text-main)' }}
              />
            </div>
          </div>

          <div className="table-wrap" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ width: '50px', padding: '10px' }}>S.No</th>
                  <th style={{ padding: '10px' }}>தேதி (Date)</th>
                  <th style={{ padding: '10px' }}>Bill ID</th>
                  <th style={{ padding: '10px' }}>வாடிக்கையாளர்</th>
                  <th style={{ padding: '10px' }}>பொருள் விவரம்</th>
                  <th style={{ textAlign: 'right', padding: '10px' }}>Qty | Wt</th>
                  <th style={{ textAlign: 'right', padding: '10px' }}>தொகை (₹)</th>
                  <th style={{ width: '80px', textAlign: 'center', padding: '10px' }}>நீக்கு (Delete)</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((s, idx) => (
                  <tr key={s.id || idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px', color: 'var(--text-sub)', fontWeight: 600 }}>{idx + 1}</td>
                    <td style={{ padding: '10px', fontSize: '12px', color: 'var(--text-sub)', whiteSpace: 'nowrap' }}>
                      {s.date ? new Date(s.date).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={{ padding: '10px', fontSize: '11px', color: 'var(--text-sub)' }}>{s.billId || '—'}</td>
                    <td style={{ padding: '10px' }}>
                      <div className="fw-600">{s.customerName || 'Walk-in'}</div>
                      {s.mobile && <div style={{ fontSize: '11px', color: 'var(--text-sub)' }}>{s.mobile}</div>}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <div className="fw-600">{s.variant || s.subcategory}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-sub)' }}>{s.category} {s.detail && ` · ${s.detail}`}</div>
                    </td>
                    <td style={{ textAlign: 'right', padding: '10px', fontWeight: 600 }}>{s.quantity || 0} pcs | {parseFloat(s.weight || 0).toFixed(3)}g</td>
                    <td style={{ textAlign: 'right', padding: '10px', fontWeight: 700, color: 'var(--gold)' }}>₹{Number(s.total || 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'center', padding: '10px' }}>
                      <button 
                        className="btn btn-danger-ghost"
                        style={{ padding: '6px', minWidth: 'auto', height: '28px' }}
                        onClick={() => {
                          if (window.confirm(`விற்பனை பதிவு #${s.id} (${s.variant}: ${s.weight}g) நீக்க வேண்டுமா? இது சரக்கு இருப்பை தானாகவே திரும்பச் சேர்க்கும்.`)) {
                            if (onDeleteSale) onDeleteSale(s.id)
                          }
                        }}
                        title="விற்பனையை நீக்கி இருப்பை மீட்டெடு (Delete Sale & Restore Stock)"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-sub)' }}>
                      விற்பனை பதிவுகள் ஏதுமில்லை.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditPage
