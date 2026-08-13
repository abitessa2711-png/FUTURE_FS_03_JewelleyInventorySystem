import React, { useState, useEffect } from 'react'
import { Trash2, Search, Filter, Calendar, RotateCcw } from 'lucide-react'

const StockDashboard = ({ products = [], onDelete, role = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubcategory, setSelectedSubcategory] = useState('')
  const [selectedVariant, setSelectedVariant] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const availableProducts = (products || []).filter(p => (p.quantity || 0) > 0)

  // Get unique categories for filter
  const categories = [...new Set(availableProducts.map(p => p.category).filter(Boolean))].sort()

  // Get unique subcategories based on selected category
  const subcategories = selectedCategory
    ? [...new Set(availableProducts.filter(p => p.category === selectedCategory).map(p => p.subcategory).filter(Boolean))].sort()
    : []

  // Get unique variants based on selected category and subcategory
  const variants = (selectedCategory && selectedSubcategory)
    ? [...new Set(availableProducts.filter(p => p.category === selectedCategory && p.subcategory === selectedSubcategory).map(p => p.variant).filter(Boolean))].sort()
    : []

  // Auto-resolve subcategory when there is only 1 option
  useEffect(() => {
    if (selectedCategory) {
      const subs = [...new Set(availableProducts.filter(p => p.category === selectedCategory).map(p => p.subcategory).filter(Boolean))].sort()
      if (subs.length === 1) {
        setSelectedSubcategory(subs[0])
      } else if (!subs.includes(selectedSubcategory)) {
        setSelectedSubcategory('')
      }
    } else {
      setSelectedSubcategory('')
    }
  }, [selectedCategory, availableProducts])

  // Auto-resolve variant when there is only 1 option
  useEffect(() => {
    if (selectedCategory && selectedSubcategory) {
      const vars = [...new Set(availableProducts.filter(p => p.category === selectedCategory && p.subcategory === selectedSubcategory).map(p => p.variant).filter(Boolean))].sort()
      if (vars.length === 1) {
        setSelectedVariant(vars[0])
      } else if (!vars.includes(selectedVariant)) {
        setSelectedVariant('')
      }
    } else {
      setSelectedVariant('')
    }
  }, [selectedCategory, selectedSubcategory, availableProducts])

  // Filter products based on search query, category, subcategory, variant, and date range
  const filteredProducts = availableProducts.filter(p => {
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true
    const matchesSubcategory = selectedSubcategory ? p.subcategory === selectedSubcategory : true
    const matchesVariant = selectedVariant ? p.variant === selectedVariant : true
    
    // Date filter
    const itemDate = p.createdAt ? p.createdAt.split('T')[0] : ''
    const matchesDateFrom = !dateFrom || (itemDate && itemDate >= dateFrom)
    const matchesDateTo = !dateTo || (itemDate && itemDate <= dateTo)

    if (!matchesDateFrom || !matchesDateTo) return false
    if (!searchQuery) return matchesCategory && matchesSubcategory && matchesVariant

    // Tokenize search query by spaces to support searching Category, Subcategory, and Variant together
    const terms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean)
    
    const matchesSearch = terms.every(term => {
      return (p.category || '').toLowerCase().includes(term) ||
             (p.subcategory || '').toLowerCase().includes(term) ||
             (p.variant || '').toLowerCase().includes(term) ||
             (p.detail || '').toLowerCase().includes(term) ||
             String(p.weight || '').includes(term)
    })

    return matchesCategory && matchesSubcategory && matchesVariant && matchesSearch
  })

  // Calculations for stats card
  const totalWeight = filteredProducts.reduce((s, p) => s + ((p.quantity || 0) * (parseFloat(p.weight) || 0)), 0)
  const totalQuantity = filteredProducts.reduce((s, p) => s + (p.quantity || 0), 0)

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setSelectedSubcategory('')
    setSelectedVariant('')
    setDateFrom('')
    setDateTo('')
  }

  const hasActiveFilters = Boolean(searchQuery || selectedCategory || selectedSubcategory || selectedVariant || dateFrom || dateTo)

  return (
    <div className="animate-fade-in">
      <div className="flex-between mb-16">
        <div>
          <h1 style={{ margin: 0 }}>இருப்பு விவரங்கள் (Stock List)</h1>
          <p className="text-sub" style={{ marginTop: '4px' }}>
            Live Stock · {filteredProducts.length} பதிவுகள் · மொத்த எண்ணிக்கை {totalQuantity} pcs · மொத்த எடை {totalWeight.toFixed(3)}g
          </p>
        </div>
      </div>

      {/* Search and Filter Card */}
      <div className="card mb-16" style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
          
          <div className="search-input-wrap" style={{ margin: 0, width: '100%' }}>
            <span className="search-icon">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="மாடல், அளவு அல்லது விவரம் மூலம் தேடுங்கள்..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
              style={{ width: '100%' }}
            />
          </div>

          {/* Category Filter */}
          <div className="filter-select-wrap" style={{ margin: 0, width: '100%' }}>
            <span className="filter-icon">
              <Filter size={16} />
            </span>
            <select
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value)
                setSelectedSubcategory('')
                setSelectedVariant('')
              }}
              className="filter-select"
              style={{ width: '100%' }}
            >
              <option value="">— அனைத்து பிரிவுகள் (All Category) —</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Subcategory Filter */}
          {subcategories.length > 1 && (
            <div className="filter-select-wrap" style={{ margin: 0, width: '100%', opacity: selectedCategory ? 1 : 0.6 }}>
              <span className="filter-icon">
                <Filter size={16} />
              </span>
              <select
                value={selectedSubcategory}
                onChange={e => {
                  setSelectedSubcategory(e.target.value)
                  setSelectedVariant('')
                }}
                disabled={!selectedCategory}
                className="filter-select"
                style={{ width: '100%' }}
              >
                <option value="">— துணை பிரிவு (All Subcategory) —</option>
                {subcategories.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          )}

          {/* Variant Filter */}
          {variants.length > 1 && (
            <div className="filter-select-wrap" style={{ margin: 0, width: '100%', opacity: (selectedCategory && selectedSubcategory) ? 1 : 0.6 }}>
              <span className="filter-icon">
                <Filter size={16} />
              </span>
              <select
                value={selectedVariant}
                onChange={e => setSelectedVariant(e.target.value)}
                disabled={!selectedCategory || !selectedSubcategory}
                className="filter-select"
                style={{ width: '100%' }}
              >
                <option value="">— மாதிரி / வகை (All Variant) —</option>
                {variants.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          )}

        </div>

        {/* Date Range Calendar Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-sub)' }}>
            <Calendar size={16} color="var(--gold)" />
            <span>தேதி வடிகட்டி (Date Range):</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 10px', height: '36px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>முதல் (From):</span>
            <input 
              type="date" 
              value={dateFrom} 
              onChange={e => setDateFrom(e.target.value)} 
              style={{ border: 'none', background: 'transparent', height: '100%', fontSize: '12px', outline: 'none', color: 'var(--text-main)', cursor: 'pointer' }} 
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 10px', height: '36px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>வரை (To):</span>
            <input 
              type="date" 
              value={dateTo} 
              onChange={e => setDateTo(e.target.value)} 
              style={{ border: 'none', background: 'transparent', height: '100%', fontSize: '12px', outline: 'none', color: 'var(--text-main)', cursor: 'pointer' }} 
            />
          </div>

          {hasActiveFilters && (
            <button 
              className="btn btn-ghost" 
              style={{ height: '36px', fontSize: '12px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={handleClearFilters}
            >
              <RotateCcw size={13} /> Reset Filters
            </button>
          )}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-sub)' }}>
          தகவல் இல்லை — No matching stock found for the selected filters.
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <div className="table-wrap" style={{ maxHeight: '550px', overflowY: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th className="hide-mobile" style={{ width: '50px', textAlign: 'center' }}>வ.எண்</th>
                  <th className="hide-mobile" style={{ width: '100px' }}>
                    தேதி<br />
                    <span style={{ fontSize: '10px', opacity: 0.7, fontWeight: 'normal', textTransform: 'none' }}>Date</span>
                  </th>
                  <th className="hide-mobile">
                    பிரிவு<br />
                    <span style={{ fontSize: '10px', opacity: 0.7, fontWeight: 'normal', textTransform: 'none' }}>Category</span>
                  </th>
                  <th>
                    மாடல் / அளவு<br />
                    <span style={{ fontSize: '10px', opacity: 0.7, fontWeight: 'normal', textTransform: 'none' }}>Variant / Size</span>
                  </th>
                  <th className="hide-mobile">
                    விவரம்<br />
                    <span style={{ fontSize: '10px', opacity: 0.7, fontWeight: 'normal', textTransform: 'none' }}>Detail</span>
                  </th>
                  <th style={{ textAlign: 'right' }}>
                    எடை<br />
                    <span style={{ fontSize: '10px', opacity: 0.7, fontWeight: 'normal', textTransform: 'none' }}>Weight g</span>
                  </th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th className="hide-mobile" style={{ textAlign: 'right' }}>
                    மொத்த எடை<br />
                    <span style={{ fontSize: '10px', opacity: 0.7, fontWeight: 'normal', textTransform: 'none' }}>Total g</span>
                  </th>
                  {role === 'admin' && (
                    <th style={{ width: '70px', textAlign: 'center' }}>
                      செயல்<br />
                      <span style={{ fontSize: '10px', opacity: 0.7, fontWeight: 'normal', textTransform: 'none' }}>Action</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((item, idx) => {
                  const itemTotalWeight = (item.quantity || 0) * (parseFloat(item.weight) || 0)
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="hide-mobile" style={{ textAlign: 'center', color: 'var(--text-sub)', fontWeight: 500 }}>{idx + 1}</td>
                      <td className="hide-mobile" style={{ fontSize: '12px', color: 'var(--text-sub)', whiteSpace: 'nowrap' }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="hide-mobile">
                        <span style={{
                          background: 'rgba(212, 175, 55, 0.08)',
                          color: 'var(--gold)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600
                        }}>
                          {item.category}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        <div>{item.variant || '—'}</div>
                        {item.subcategory && (
                          <div style={{ fontSize: '11px', color: 'var(--text-sub)', fontWeight: 'normal', marginTop: '2px' }}>
                            {item.subcategory}
                          </div>
                        )}
                        <div className="show-mobile" style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 'normal', marginTop: '2px' }}>
                          {item.category}
                        </div>
                        {item.detail && (
                          <div className="show-mobile" style={{ fontSize: '11px', color: 'var(--text-sub)', fontWeight: 'normal', marginTop: '2px' }}>
                            {item.detail}
                          </div>
                        )}
                        <div className="show-mobile" style={{ fontSize: '10px', color: 'var(--text-sub)', marginTop: '2px' }}>
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : ''}
                        </div>
                      </td>
                      <td className="hide-mobile" style={{ color: 'var(--text-sub)' }}>{item.detail || '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 500 }}>
                        {parseFloat(item.weight || 0).toFixed(3)}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--gold)' }}>
                        {item.quantity}
                      </td>
                      <td className="hide-mobile" style={{ textAlign: 'right', fontWeight: 700 }}>
                        {itemTotalWeight.toFixed(3)}
                      </td>
                      {role === 'admin' && (
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn btn-danger-ghost"
                            style={{ padding: '6px', minWidth: 'auto' }}
                            onClick={() => window.confirm('இந்த இருப்பை நீக்க வேண்டுமா?') && onDelete(item.id)}
                            title="நீக்கு"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default StockDashboard
