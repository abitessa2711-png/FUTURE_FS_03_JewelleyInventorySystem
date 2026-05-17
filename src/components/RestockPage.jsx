import React, { useState, useMemo } from 'react'
import { RefreshCw, Package, PlusCircle, AlertTriangle } from 'lucide-react'
import { MASTER_DATA } from '../data/masterData'

const CATEGORIES = Object.keys(MASTER_DATA)

const RestockPage = ({ products = [], onAddProduct }) => {
  const [formData, setFormData] = useState({ category: '', subcategory: '', variant: '', detail: '', weight: '', quantity: '' })
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)

  // Compute low stock groups
  const lowStockGroups = useMemo(() => {
    const groups = {}
    products.forEach(p => {
      const key = `${p.category}||${p.subcategory}||${p.variant}`
      if (!groups[key]) groups[key] = { ...p, totalQty: 0, totalWeight: 0, entries: 0 }
      groups[key].totalQty    += (p.quantity || 0)
      groups[key].totalWeight += (parseFloat(p.weight) || 0)
      groups[key].entries++
    })
    return Object.values(groups)
      .filter(g => g.totalQty < 3 || g.totalWeight < 5)
      .sort((a, b) => a.totalQty - b.totalQty)
  }, [products])

  const getSubs     = () => formData.category ? Object.keys(MASTER_DATA[formData.category]) : []
  const getVariants = () => {
    if (!formData.category || !formData.subcategory) return []
    const d = MASTER_DATA[formData.category][formData.subcategory]
    return Array.isArray(d) ? d : (typeof d === 'object' ? Object.keys(d) : [])
  }

  const prefill = (item) => {
    setFormData({
      category:    item.category    || '',
      subcategory: item.subcategory || '',
      variant:     item.variant     || '',
      detail:      item.detail      || '',
      weight:      '',
      quantity:    ''
    })
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.category || !formData.subcategory || !formData.variant) {
      alert('Please fill required fields')
      return
    }
    setLoading(true)
    try {
      onAddProduct({
        ...formData,
        weight:   parseFloat(formData.weight   || 0),
        quantity: parseInt(formData.quantity   || 0)
      })
      setFormData({ category: '', subcategory: '', variant: '', detail: '', weight: '', quantity: '' })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex-between mb-16">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>மீண்டும் நிரப்பு</h2>
          <p className="text-sub">Restock low inventory items · {lowStockGroups.length} items need attention</p>
        </div>
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} color="#EF4444" />
          <span style={{ color: '#EF4444', fontWeight: 600, fontSize: 14 }}>{lowStockGroups.length} Low Stock</span>
        </div>
      </div>

      {/* Low Stock Alert List */}
      {lowStockGroups.length > 0 && (
        <div className="card" style={{ marginBottom: 24, borderColor: 'rgba(239,68,68,0.2)' }}>
          <div className="card-title" style={{ color: '#EF4444' }}>குறைந்த இருப்பு பட்டியல் (Items Needing Restock)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {lowStockGroups.map((item, i) => (
              <div
                key={i}
                className="card"
                style={{ padding: '14px', borderColor: 'rgba(239,68,68,0.3)', cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => prefill(item)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div className="fw-600" style={{ fontSize: 13 }}>{item.variant}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>{item.category} · {item.subcategory}</div>
                  </div>
                  <span style={{
                    fontSize: 10,
                    background: item.totalQty === 0 ? '#EF4444' : 'rgba(239,68,68,0.15)',
                    color: item.totalQty === 0 ? 'white' : '#EF4444',
                    borderRadius: 4,
                    padding: '2px 6px',
                    fontWeight: 700
                  }}>
                    {item.totalQty === 0 ? 'OUT' : 'LOW'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  <div style={{ textAlign: 'center', flex: 1, background: 'rgba(239,68,68,0.06)', borderRadius: 8, padding: '6px 0' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#EF4444' }}>{item.totalQty}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-sub)' }}>pcs left</div>
                  </div>
                  <div style={{ textAlign: 'center', flex: 1, background: 'rgba(212,175,55,0.06)', borderRadius: 8, padding: '6px 0' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>{item.totalWeight.toFixed(1)}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-sub)' }}>g left</div>
                  </div>
                </div>
                <button className="btn btn-gold btn-full" style={{ height: 30, fontSize: 12 }}>
                  <PlusCircle size={12} /> Click to Restock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {lowStockGroups.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', marginBottom: 24 }}>
          <Package size={60} style={{ margin: '0 auto 16px', color: 'var(--gold)', opacity: 0.5 }} />
          <h3 style={{ marginBottom: 8 }}>All Stock Levels are Healthy!</h3>
          <p className="text-sub">No items need restocking right now. You can still add new stock below.</p>
        </div>
      )}

      {/* Restock / Add Form */}
      <div className="card">
        <div className="card-title"><RefreshCw size={15} /> சரக்கு சேர் (Add / Restock)</div>

        {success && (
          <div className="toast-success" style={{ marginBottom: 16 }}>
            <Package size={16} /> Stock restocked successfully!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>பிரிவு (Category) *</label>
              <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value, subcategory: '', variant: '' })} required>
                <option value="">— Select Category —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>துணை பிரிவு (Subcategory) *</label>
              <select value={formData.subcategory} onChange={e => setFormData({ ...formData, subcategory: e.target.value, variant: '' })} disabled={!formData.category} required>
                <option value="">— Select Sub —</option>
                {getSubs().map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>மாடல் (Variant) *</label>
              <select value={formData.variant} onChange={e => setFormData({ ...formData, variant: e.target.value })} disabled={!formData.subcategory} required>
                <option value="">— Select Variant —</option>
                {getVariants().map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>விவரம் (Detail)</label>
              <input
                type="text"
                placeholder="e.g. 10g, Antique, etc."
                value={formData.detail}
                onChange={e => setFormData({ ...formData, detail: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>எடை (Weight g) *</label>
              <input
                type="number" step="0.001" min="0"
                placeholder="0.000"
                value={formData.weight}
                onChange={e => setFormData({ ...formData, weight: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>எண்ணிக்கை (Quantity pcs) *</label>
              <input
                type="number" min="0"
                placeholder="0"
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-gold btn-lg" style={{ marginTop: 20, minWidth: 220 }} disabled={loading}>
            <RefreshCw size={16} /> {loading ? 'சேமிக்கப்படுகிறது...' : 'Restock / Add Stock'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default RestockPage
