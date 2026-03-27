import React, { useState, useEffect } from 'react'
import { MASTER_DATA } from '../data/masterData'
import { ShoppingCart, User, CreditCard, Trash2 } from 'lucide-react'
import BillModal from './BillModal'

const CATEGORIES = Object.keys(MASTER_DATA)

const SellDashboard = ({ products = [], processSale }) => {
  const [formData, setFormData] = useState({
    category: '', subcategory: '', variant: '', detail: '', weight: '', quantity: '', rate: '', discount: '0'
  })
  const [customer, setCustomer] = useState({ name: '', mobile: '' })
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(false)
  const [showBill, setShowBill] = useState(null)

  const getSubs = () => formData.category ? Object.keys(MASTER_DATA[formData.category]) : []
  const getVariants = () => {
    if (!formData.category || !formData.subcategory) return []
    const d = MASTER_DATA[formData.category][formData.subcategory]
    return Array.isArray(d) ? d : (typeof d === 'object' ? Object.keys(d) : [])
  }
  const getDetails = () => (formData.category === 'கொலுசு' && formData.subcategory === 'அளவு' && formData.variant)
    ? (MASTER_DATA['கொலுசு']['விவரம்'][formData.variant] || []) : []

  // Derived: Current Available Stock for selected combination
  const availableStock = products.find(p => 
    p.category === formData.category && 
    p.subcategory === formData.subcategory && 
    p.variant === formData.variant && 
    (p.detail || "") === (formData.detail || "")
  )

  const weight = parseFloat(formData.weight || 0)
  const rate = parseFloat(formData.rate || 0)
  const discountPercent = parseFloat(formData.discount || 0)
  
  const subtotal = weight * rate
  const discountAmount = subtotal * (discountPercent / 100)
  const taxableAmount = subtotal - discountAmount
  const gstAmount = taxableAmount * 0.03 // GST 3%
  const finalItemTotal = taxableAmount + gstAmount

  const addToCart = () => {
    const w = parseFloat(formData.weight || 0)
    const q = parseInt(formData.quantity || 0)
    const r = parseFloat(formData.rate)
    
    if (!formData.category || !formData.variant) {
      alert('தயவுசெய்து பொருளைத் தேர்ந்தெடுக்கவும்')
      return
    }
    if (w <= 0 && q <= 0) {
      alert('எடை (Weight) அல்லது எண்ணிக்கை (Qty) தேவை')
      return
    }
    if (isNaN(r) || r <= 0) {
      alert('விலை/g கட்டாயம் (Rate is mandatory)')
      return
    }

    if (availableStock) {
      if (w > 0 && availableStock.weight < w) {
        alert(`போதுமான எடை இல்லை! (Insufficient weight) Available: ${availableStock.weight}g`)
        return
      }
      if (q > 0 && availableStock.quantity < q) {
        alert(`போதுமான எண்ணிக்கை இல்லை! (Insufficient qty) Available: ${availableStock.quantity} pcs`)
        return
      }
    } else {
      alert('இந்த பொருள் இருப்பில் இல்லை! (Out of stock)')
      return
    }

    // Check if enough stock considering cart
    const inCartWeight = cart.filter(c => 
      c.category === formData.category && c.variant === formData.variant && (c.detail || "") === (formData.detail || "")
    ).reduce((s, i) => s + i.weight, 0)
    
    const inCartQty = cart.filter(c => 
      c.category === formData.category && c.variant === formData.variant && (c.detail || "") === (formData.detail || "")
    ).reduce((s, i) => s + i.quantity, 0)

    if (availableStock.weight < (w + inCartWeight)) {
      alert(`கூடுதல் எடை இருப்பு இல்லை! Available: ${availableStock.weight - inCartWeight}g`)
      return
    }
    if (availableStock.quantity < (q + inCartQty)) {
      alert(`கூடுதல் எண்ணிக்கை இருப்பு இல்லை! Available: ${availableStock.quantity - inCartQty} pcs`)
      return
    }

    setCart([...cart, { 
      ...formData, 
      weight: w, 
      quantity: q,
      pricePerGram: r,
      discountPercent: discountPercent,
      discountAmount: discountAmount,
      subtotal: subtotal,
      gstAmount: gstAmount,
      total: finalItemTotal 
    }])
    setFormData({ ...formData, weight: '', quantity: '', rate: '', discount: '0' })
  }

  const handleSale = async () => {
    if (!cart.length) return
    setLoading(true)
    try {
      const bill = await processSale(customer.name || 'Walk-in', customer.mobile, cart)
      setShowBill(bill)
      setCart([])
      setCustomer({ name: '', mobile: '' })
    } catch (err) {
      alert('விற்பனை பிழை: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const cartTotal = cart.reduce((s, i) => s + i.total, 0)

  return (
    <div className="animate-fade-in">
      <div className="flex-between mb-16">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>விற்பனை & பில்</h2>
          <p className="text-sub">Process customer sales and generate bills</p>
        </div>
        <div className="stat-icon" style={{ background: 'var(--accent)18', color: 'var(--accent)' }}>
          <ShoppingCart size={24} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Sale Form */}
        <div className="card">
          <div className="card-title">பொருள் தேர்வு (Item Selection)</div>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label>பிரிவு (Category)</label>
              <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value, subcategory: '', variant: '', detail: '' })}>
                <option value="">— Select —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>துணை பிரிவு (Sub)</label>
              <select value={formData.subcategory} onChange={e => setFormData({ ...formData, subcategory: e.target.value, variant: '', detail: '' })} disabled={!formData.category}>
                <option value="">— Select —</option>
                {getSubs().map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>மாடல் (Variant)</label>
              <select value={formData.variant} onChange={e => setFormData({ ...formData, variant: e.target.value, detail: '' })} disabled={!formData.subcategory}>
                <option value="">— Select —</option>
                {getVariants().map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            
            {getDetails().length > 0 && (
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>விவரம் (Detail)</label>
                <div className="flex" style={{ gap: 10, flexWrap: 'wrap' }}>
                  {getDetails().map(d => (
                    <label key={d} className="flex" style={{ gap: 6, fontSize: '13px', cursor: 'pointer' }}>
                      <input type="radio" name="detail" checked={formData.detail === d} onChange={() => setFormData({ ...formData, detail: d })} style={{ width: 16, height: 16 }} />
                      {d}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label>எடை (Weight g)</label>
              <input type="number" step="0.001" placeholder="0.000" value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} />
            </div>
            <div className="form-group">
              <label>எண்ணிக்கை (Qty pcs)</label>
              <input type="number" placeholder="0" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
            </div>
            {availableStock && (
              <div style={{ gridColumn: 'span 2', fontSize: '12px', color: 'var(--gold)', marginTop: -10, marginBottom: 5 }}>
                இருப்பு (Available): <strong>{availableStock.quantity} pcs | {availableStock.weight.toFixed(2)}g</strong>
              </div>
            )}
            <div className="form-group">
              <label>விலை/g (Rate) <span style={{ color: 'red' }}>*</span></label>
              <input type="number" placeholder="0" value={formData.rate} onChange={e => setFormData({ ...formData, rate: e.target.value })} />
            </div>
            <div className="form-group">
              <label>தள்ளுபடி (Disc %)</label>
              <input type="number" placeholder="0" value={formData.discount} onChange={e => setFormData({ ...formData, discount: e.target.value })} />
            </div>
          </div>
          
          <div style={{ margin: '15px 0', padding: '12px', background: 'rgba(212,175,55,0.05)', borderRadius: '10px', fontSize: '13px' }}>
            <div className="flex-between"><span>Subtotal:</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
            <div className="flex-between"><span>Discount:</span><span className="text-danger">- ₹{discountAmount.toLocaleString('en-IN')}</span></div>
            <div className="flex-between fw-600"><span>GST (3%):</span><span className="text-success">+ ₹{gstAmount.toLocaleString('en-IN')}</span></div>
            <div className="flex-between fw-700" style={{ fontSize: '16px', marginTop: '5px', borderTop: '1px solid var(--border)', paddingTop: '5px' }}>
              <span>Total:</span><span className="text-gold">₹{finalItemTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button 
            className="btn btn-gold btn-lg btn-full" 
            onClick={addToCart}
            disabled={!formData.rate || parseFloat(formData.rate) <= 0 || (parseFloat(formData.weight || 0) <= 0 && parseInt(formData.quantity || 0) <= 0)}
          >
            + பட்டியலில் சேர் (Add to Cart)
          </button>
        </div>

        {/* Cart & Customer */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-title">விற்பனைப் பட்டியல் (Cart)</div>
          
          <div className="form-grid mb-16" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
            <div className="form-group">
              <label><User size={12} /> வாடிக்கையாளர் பெயர்</label>
              <input type="text" placeholder="Name" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>மொபைல்</label>
              <input type="text" placeholder="Mobile" value={customer.mobile} onChange={e => setCustomer({ ...customer, mobile: e.target.value })} />
            </div>
          </div>

          <div style={{ flex: 1, minHeight: '200px', border: '1px solid var(--border)', borderRadius: 10, padding: '12px', background: 'rgba(0,0,0,0.02)', overflowY: 'auto' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-sub)' }}>பட்டியல் காலியாக உள்ளது</div>
            ) : (
              <table style={{ fontSize: '13px' }}>
                <thead><tr><th>Item</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Wt</th><th style={{ textAlign: 'right' }}>Total</th><th></th></tr></thead>
                <tbody>
                  {cart.map((item, id) => (
                    <tr key={id}>
                      <td><div className="fw-600">{item.variant}</div><div style={{ fontSize: 11, color: 'var(--text-sub)' }}>{item.category}</div></td>
                      <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>{item.weight}g</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--gold)' }}>₹{item.total.toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-danger-ghost" style={{ padding: 4 }} onClick={() => setCart(cart.filter((_, i) => i !== id))}><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ marginTop: '20px' }}>
            <div className="flex-between mb-16">
              <span className="fw-600" style={{ fontSize: 18 }}>மொத்தம் (Total)</span>
              <span className="text-gold" style={{ fontSize: 24, fontWeight: 800 }}>₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>
            <button className="btn btn-primary btn-lg btn-full" disabled={!cart.length || loading} onClick={handleSale}>
              <CreditCard size={18} /> {loading ? 'செயலாக்கப்படுகிறது...' : '💳 விற்பனை & பில் (Sell & Bill)'}
            </button>
          </div>
        </div>
      </div>

      {showBill && <BillModal bill={showBill} onClose={() => setShowBill(null)} />}
    </div>
  )
}

export default SellDashboard
