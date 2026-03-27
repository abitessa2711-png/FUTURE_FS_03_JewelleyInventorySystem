import React, { useState } from 'react'
import { MASTER_DATA } from '../data/masterData'
import { Plus, Package } from 'lucide-react'

const CATEGORIES = Object.keys(MASTER_DATA)

const AddStock = ({ onAddProduct }) => {
  const [formData, setFormData] = useState({
    category: '', subcategory: '', variant: '', detail: '', weight: '', quantity: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setLoadingSuccess] = useState(false)

  const getSubs = () => formData.category ? Object.keys(MASTER_DATA[formData.category]) : []
  
  const getVariants = () => {
    if (!formData.category || !formData.subcategory) return []
    const d = MASTER_DATA[formData.category][formData.subcategory]
    return Array.isArray(d) ? d : (typeof d === 'object' ? Object.keys(d) : [])
  }

  const getDetails = () => {
    if (formData.category === 'கொலுசு' && formData.subcategory === 'அளவு' && formData.variant) {
      return MASTER_DATA['கொலுசு']['விவரம்'][formData.variant] || []
    }
    return []
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.category || !formData.subcategory || !formData.variant) {
      alert('தயவுசெய்து கட்டாய புலங்களை நிரப்பவும் (Please fill required fields)')
      return
    }

    setLoading(true)
    try {
      await onAddProduct({
        ...formData,
        detail: formData.detail || "",
        weight: parseFloat(formData.weight || 0),
        quantity: parseInt(formData.quantity || 0)
      })
      setFormData({ category: '', subcategory: '', variant: '', detail: '', weight: '', quantity: '' })
      setLoadingSuccess(true)
      setTimeout(() => setLoadingSuccess(false), 3000)
    } catch (err) {
      alert('சேமிப்பதில் பிழை: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex-between mb-16">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>சரக்கு சேர்த்தல்</h2>
          <p className="text-sub">Add new inventory items to the database</p>
        </div>
        <div className="stat-icon" style={{ background: 'var(--gold)18', color: 'var(--gold)' }}>
          <Plus size={24} />
        </div>
      </div>

      <div className="card">
        <div className="card-title">பொருள் விவரங்கள் (Product Details)</div>
        
        {success && (
          <div className="toast-success">
            <Package size={18} /> இருப்பு வெற்றிகரமாக சேர்க்கப்பட்டது! (Added successfully)
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>பிரிவு (Category) *</label>
              <select 
                value={formData.category} 
                onChange={e => setFormData({ ...formData, category: e.target.value, subcategory: '', variant: '', detail: '' })} 
                required
              >
                <option value="">— Select Category —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>துணை பிரிவு (Subcategory) *</label>
              <select 
                value={formData.subcategory} 
                onChange={e => setFormData({ ...formData, subcategory: e.target.value, variant: '', detail: '' })} 
                disabled={!formData.category}
                required
              >
                <option value="">— Select Sub —</option>
                {getSubs().map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>மாடல் (Variant) *</label>
              <select 
                value={formData.variant} 
                onChange={e => setFormData({ ...formData, variant: e.target.value, detail: '' })} 
                disabled={!formData.subcategory}
                required
              >
                <option value="">— Select Variant —</option>
                {getVariants().map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            {getDetails().length > 0 && (
              <div className="form-group">
                <label>விவரம் (Detail)</label>
                <select 
                  value={formData.detail} 
                  onChange={e => setFormData({ ...formData, detail: e.target.value })}
                >
                  <option value="">— Select Detail —</option>
                  {getDetails().map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}

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

            <div className="form-group" style={{ justifyContent: 'flex-end', paddingTop: '22px' }}>
              <button type="submit" className="btn btn-gold btn-lg btn-full" disabled={loading}>
                {loading ? 'சேமிக்கப்படுகிறது...' : '+ இருப்பில் சேர் (Add Stock)'}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      <div className="mt-16 card" style={{ background: 'rgba(212,175,55,0.03)', border: '1px dashed var(--gold)' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-sub)', textAlign: 'center' }}>
          <strong>Note:</strong> ஒரே மாதிரியான பொருட்கள் சேர்க்கப்பட்டால், அவற்றின் எடை தானாகவே கூட்டப்படும். 
          (Matching items will be merged by weight automatically.)
        </p>
      </div>
    </div>
  )
}

export default AddStock
