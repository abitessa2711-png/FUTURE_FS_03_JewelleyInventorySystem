import React, { useState } from 'react'
import { MASTER_DATA } from '../data/masterData'
import { Plus, TrendingUp, User, ClipboardList } from 'lucide-react'

const CATEGORIES = Object.keys(MASTER_DATA)

const PurchaseModule = ({ purchases = [], onAddPurchase }) => {
  const [formData, setFormData] = useState({
    supplierName: '',
    category: '',
    subcategory: '',
    variant: '',
    detail: '',
    weight: '',
    rate: '',
    date: new Date().toISOString().slice(0, 16) // Format for datetime-local input
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const getSubs = () => formData.category ? Object.keys(MASTER_DATA[formData.category]) : []
  const getVariants = () => {
    if (!formData.category || !formData.subcategory) return []
    const d = MASTER_DATA[formData.category][formData.subcategory]
    return Array.isArray(d) ? d : (typeof d === 'object' ? Object.keys(d) : [])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.supplierName || !formData.category || !formData.subcategory || !formData.variant || !formData.rate || !formData.weight) {
      alert('தயவுசெய்து கட்டாய புலங்களை நிரப்பவும் (Please fill required fields)')
      return
    }

    setLoading(true)
    try {
      const weight = parseFloat(formData.weight || 0)
      const rate = parseFloat(formData.rate || 0)
      const amount = weight * rate

      await onAddPurchase({
        ...formData,
        weight,
        rate,
        amount,
        quantity: 1, // Default quantity to 1 for stock entry
        date: new Date(formData.date).toISOString()
      })

      setFormData({
        supplierName: '',
        category: '',
        subcategory: '',
        variant: '',
        detail: '',
        weight: '',
        rate: '',
        date: new Date().toISOString().slice(0, 16)
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
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
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>கொள்முதல் மேலாண்மை (Purchase Module)</h2>
          <p className="text-sub">Manage supplier purchases and track purchase history</p>
        </div>
        <div className="stat-icon" style={{ background: 'var(--gold)18', color: 'var(--gold)' }}>
          <TrendingUp size={24} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Purchase Form */}
        <div className="card">
          <div className="card-title">புதிய கொள்முதல் (Add Purchase)</div>
          
          {success && (
            <div className="toast-success">
              <Plus size={18} /> கொள்முதல் வெற்றிகரமாக பதிவு செய்யப்பட்டது!
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label>வழங்குனர் பெயர் (Supplier Name) *</label>
              <input 
                type="text" 
                placeholder="Supplier Name"
                value={formData.supplierName} 
                onChange={e => setFormData({ ...formData, supplierName: e.target.value })} 
                required 
              />
            </div>

            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
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
                <label>துணை பிரிவு (Sub) *</label>
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
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label>மாடல் (Variant) *</label>
              <select 
                value={formData.variant} 
                onChange={e => setFormData({ ...formData, variant: e.target.value })} 
                disabled={!formData.subcategory}
                required
              >
                <option value="">— Select Variant —</option>
                {getVariants().map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label>விவரம் (Detail)</label>
              <input 
                type="text" 
                placeholder="e.g. 24 inch, Antique, etc."
                value={formData.detail}
                onChange={e => setFormData({ ...formData, detail: e.target.value })}
              />
            </div>

            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
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
                <label>விலை/g (Rate/g) *</label>
                <input 
                  type="number" step="0.01" min="0"
                  placeholder="0.00"
                  value={formData.rate}
                  onChange={e => setFormData({ ...formData, rate: e.target.value })}
                  required 
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label>கொள்முதல் தேதி (Date & Time) *</label>
              <input 
                type="datetime-local" 
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                required 
              />
            </div>

            <div style={{ padding: '14px', background: 'rgba(212,175,55,0.06)', borderRadius: '8px', border: '1px dashed var(--gold)', marginBottom: 20 }}>
              <div className="flex-between fw-700" style={{ fontSize: '18px' }}>
                <span>மொத்த மதிப்பு (Amount):</span>
                <span className="text-gold">₹{((parseFloat(formData.weight) || 0) * (parseFloat(formData.rate) || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <button type="submit" className="btn btn-gold btn-lg btn-full" disabled={loading}>
              {loading ? 'சேமிக்கப்படுகிறது...' : '+ கொள்முதல் சேர் (Add Purchase)'}
            </button>
          </form>
        </div>

        {/* Purchase History */}
        <div className="card">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={16} />
            <span>கொள்முதல் வரலாறு (Purchase History)</span>
          </div>

          <div className="table-wrap" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Supplier / Date</th>
                  <th>Item Details</th>
                  <th style={{ textAlign: 'right' }}>Weight</th>
                  <th style={{ textAlign: 'right' }}>Rate/g</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.id} className="table-row">
                    <td>
                      <div className="fw-600">{p.supplierName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>
                        {new Date(p.date).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                    <td>
                      <div className="fw-600">{p.variant}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>
                        {p.category} {p.detail ? `· ${p.detail}` : ''}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>{p.weight}g</td>
                    <td style={{ textAlign: 'right' }}>₹{p.rate?.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--gold)' }}>
                      ₹{p.amount?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
                {purchases.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-sub)' }}>
                      கொள்முதல் தகவல்கள் இல்லை (No purchases recorded)
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

export default PurchaseModule
