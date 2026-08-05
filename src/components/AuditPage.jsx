import React, { useState } from 'react'
import { Package, Activity, ChevronDown, ChevronRight, Folder, Layers, Tag } from 'lucide-react'

const AuditPage = ({ products = [], soldItems = [], ledger = [] }) => {
  const [expandedCats, setExpandedCats] = useState(new Set())
  const [expandedSubs, setExpandedSubs] = useState(new Set())

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

  // Group active stock hierarchically: Category -> Subcategory -> Variant/Detail
  const hierarchy = {}
  products.forEach(p => {
    const cat = p.category || 'மற்றவை'
    const sub = p.subcategory || 'வகைகள்'
    const variantKey = p.variant || '—'
    const detailKey = p.detail || ''
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

    const varKey = detailKey ? `${variantKey} (${detailKey})` : variantKey
    if (!hierarchy[cat].subcategories[sub].variants[varKey]) {
      hierarchy[cat].subcategories[sub].variants[varKey] = {
        name: varKey,
        unitWeight: unitWt,
        qty: 0,
        weight: 0
      }
    }
    hierarchy[cat].subcategories[sub].variants[varKey].qty += qty
    hierarchy[cat].subcategories[sub].variants[varKey].weight += totalWt
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

      <div className="card" style={{ marginTop: '20px', padding: '24px' }}>
        <h2 style={{ fontSize: 18, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
          <span>📋 வகைப்பாடு இருப்பு விவரம் (Hierarchical Category Stock)</span>
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Object.values(hierarchy).sort((a, b) => b.weight - a.weight).map(cat => {
            const isCatExpanded = expandedCats.has(cat.name)
            
            return (
              <div key={cat.name} style={{ border: '1px solid var(--border)', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.01)', overflow: 'hidden' }}>
                {/* Category Row */}
                <div 
                  onClick={() => toggleCat(cat.name)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', background: isCatExpanded ? 'rgba(212, 175, 55, 0.06)' : 'transparent', transition: 'all 0.2s ease' }}
                  className="tree-category-row"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {isCatExpanded ? <ChevronDown size={18} color="var(--gold)" /> : <ChevronRight size={18} color="var(--text-sub)" />}
                    <Folder size={18} color="var(--gold)" />
                    <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-main)' }}>{cat.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '14px', fontWeight: 600 }}>
                    <span style={{ color: 'var(--text-sub)' }}>{cat.qty} pcs</span>
                    <span style={{ color: 'var(--gold)' }}>{cat.weight.toFixed(3)}g</span>
                  </div>
                </div>

                {/* Subcategories (Visible only when Category is expanded) */}
                {isCatExpanded && (
                  <div style={{ background: 'rgba(0,0,0,0.1)', borderTop: '1px solid var(--border)', padding: '12px 20px' }}>
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
                                <table className="audit-variant-table" style={{ width: '100%', fontSize: '13px' }}>
                                  <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                      <th style={{ textAlign: 'left', padding: '6px 0', color: 'var(--text-sub)' }}>வகை (Variant)</th>
                                      <th style={{ textAlign: 'right', padding: '6px 0', color: 'var(--text-sub)' }}>எண்ணிக்கை</th>
                                      <th style={{ textAlign: 'right', padding: '6px 0', color: 'var(--text-sub)' }}>மொத்த எடை</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {Object.values(sub.variants).sort((a, b) => b.weight - a.weight).map(variant => (
                                      <tr key={variant.name} style={{ borderBottom: '1px dashed rgba(255,255,255,0.03)' }}>
                                        <td data-label="வகை" style={{ padding: '8px 0', fontWeight: 600 }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Tag size={12} color="var(--gold)" />
                                            {variant.name}
                                          </div>
                                        </td>
                                        <td data-label="எண்ணிக்கை" style={{ textAlign: 'right', padding: '8px 0', fontWeight: 600 }}>{variant.qty} pcs</td>
                                        <td data-label="மொத்த எடை" style={{ textAlign: 'right', padding: '8px 0', fontWeight: 700, color: 'var(--gold)' }}>{variant.weight.toFixed(3)}g</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
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
    </div>
  )
}

export default AuditPage
