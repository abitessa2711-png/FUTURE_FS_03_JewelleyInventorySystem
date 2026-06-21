import React, { useState } from 'react'
import { MASTER_DATA } from '../data/masterData'
import { ShoppingCart, User, CreditCard, Trash2, Eye } from 'lucide-react'
import BillModal from './BillModal'

const CATEGORIES = Object.keys(MASTER_DATA)

const SellDashboard = ({ products = [], processSale }) => {
  const [formData, setFormData] = useState({
    category: '', subcategory: '', variant: '', detail: '', weight: '', quantity: '', rate: '', discountAmt: '', gstAmt: ''
  })
  const [customer, setCustomer] = useState({ name: 'Walk-in', mobile: '' })
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(false)
  const [showBill, setShowBill] = useState(null)
  const [lastBill, setLastBill] = useState(null)
  const [selectedStockId, setSelectedStockId] = useState('')

  const getSubs = () => formData.category ? Object.keys(MASTER_DATA[formData.category]) : []
  const getVariants = () => {
    if (!formData.category || !formData.subcategory) return []
    const d = MASTER_DATA[formData.category][formData.subcategory]
    return Array.isArray(d) ? d : (typeof d === 'object' ? Object.keys(d) : [])
  }

  // Derived: All stock entries matching the selected variant
  const matchingStocks = products.filter(p => 
    p.category === formData.category && 
    p.subcategory === formData.subcategory && 
    p.variant === formData.variant &&
    (p.weight > 0 || (p.quantity && p.quantity > 0))
  )

  const availableStock = products.find(p => p.id === parseInt(selectedStockId))

  const finalItemTotal = parseFloat(formData.rate || 0)

  const addToCart = () => {
    const w = parseFloat(formData.weight || 0)
    const q = parseInt(formData.quantity || 0)
    const totalRate = parseFloat(formData.rate || 0)
    const gAmt = parseFloat(formData.gstAmt || 0)
    
    if (!selectedStockId || !availableStock) {
      alert('இந்த பொருள் இருப்பில் இல்லை')
      return
    }
    if (w <= 0 && q <= 0) {
      alert('எடை அல்லது எண்ணிக்கை தேவை')
      return
    }
    if (isNaN(totalRate) || totalRate <= 0) {
      alert('விற்பனை விலை கட்டாயம்')
      return
    }

    if (availableStock) {
      if (w > 0 && availableStock.weight < w) {
        alert('போதுமான இருப்பு இல்லை')
        return
      }
      if (q > 0 && availableStock.quantity < q) {
        alert('போதுமான இருப்பு இல்லை')
        return
      }
    }

    const pricePerGram = w > 0 ? (totalRate / w) : 0
    const total = totalRate + gAmt

    setCart([...cart, { 
      ...formData, 
      productId: availableStock.id,
      weight: w, 
      quantity: q,
      pricePerGram: pricePerGram,
      subtotal: totalRate,
      discountAmount: 0,
      gstAmount: gAmt,
      total: total 
    }])
    
    // Reset selection part
    setFormData({ ...formData, weight: '', quantity: '', rate: '', discountAmt: '', gstAmt: '' })
    setSelectedStockId('')
  }

  const handleSale = async () => {
    if (!cart.length) return
    setLoading(true)
    try {
      const bill = await processSale(customer.name || 'Walk-in', customer.mobile, cart)
      setShowBill(bill)
      setLastBill(bill)
      setCart([])
      setCustomer({ name: 'Walk-in', mobile: '' })
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
        <div className="flex" style={{ gap: '10px' }}>
          {lastBill && (
            <button className="btn btn-secondary" onClick={() => setShowBill(lastBill)}>
              <Eye size={16} /> கடைசி பில் (View Last Bill)
            </button>
          )}
          <div className="stat-icon" style={{ background: 'var(--accent)18', color: 'var(--accent)' }}>
            <ShoppingCart size={24} />
          </div>
        </div>
      </div>

      <div className="sell-layout-grid">
        {/* Sale Form */}
        <div className="card">
          <div className="card-title">பொருள் தேர்வு (Item Selection)</div>
          <div className="form-grid form-grid-2col">
            <div className="form-group">
              <label>பிரிவு (Category)</label>
              <select value={formData.category} onChange={e => {
                setFormData({ ...formData, category: e.target.value, subcategory: '', variant: '', detail: '' })
                setSelectedStockId('')
              }}>
                <option value="">— Select —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>துணை பிரிவு (Sub)</label>
              <select value={formData.subcategory} onChange={e => {
                setFormData({ ...formData, subcategory: e.target.value, variant: '', detail: '' })
                setSelectedStockId('')
              }} disabled={!formData.category}>
                <option value="">— Select —</option>
                {getSubs().map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group grid-span-2">
              <label>மாடல் (Variant)</label>
              <select value={formData.variant} onChange={e => {
                setFormData({ ...formData, variant: e.target.value, detail: '' })
                setSelectedStockId('')
              }} disabled={!formData.subcategory}>
                <option value="">— Select —</option>
                {getVariants().map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div className="form-group grid-span-2">
              <label>இருப்புத் தெரிவு (Select Specific Stock) <span style={{ color: 'red' }}>*</span></label>
              <select value={selectedStockId} onChange={e => {
                const id = e.target.value;
                setSelectedStockId(id);
                const s = products.find(p => p.id === parseInt(id));
                if (s) setFormData({ ...formData, detail: s.detail, weight: s.weight.toString(), quantity: "1" });
              }} disabled={matchingStocks.length === 0}>
                <option value="">— {matchingStocks.length > 0 ? 'Select Stock Entry' : 'No Stock Available'} —</option>
                {matchingStocks.map(s => (
                  <option key={s.id} value={s.id}>
                    ID: {s.id} | {s.detail || 'No Detail'} | {s.quantity} pcs | {s.weight}g | {new Date(s.createdAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            {availableStock && (
              <div className="grid-span-2" style={{ marginTop: '-8px', marginBottom: '8px', fontSize: '13px', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ color: 'var(--text-sub)' }}>
                  இருப்பில் உள்ளது (Click to fill):{' '}
                  <span 
                    style={{ cursor: 'pointer', background: 'rgba(197, 160, 94, 0.15)', color: 'var(--gold)', padding: '2px 6px', borderRadius: '4px', marginRight: '6px', fontWeight: 600 }}
                    onClick={() => setFormData({ ...formData, weight: availableStock.weight.toString() })}
                    title="Use Weight"
                  >
                    {availableStock.weight}g
                  </span>
                  |{' '}
                  <span 
                    style={{ cursor: 'pointer', background: 'rgba(197, 160, 94, 0.15)', color: 'var(--gold)', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px', fontWeight: 600 }}
                    onClick={() => setFormData({ ...formData, quantity: availableStock.quantity.toString(), weight: availableStock.weight.toString() })}
                    title="Use Quantity"
                  >
                    {availableStock.quantity} pcs
                  </span>
                </span>
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  style={{ height: '24px', fontSize: '11px', padding: '0 8px', borderRadius: '4px' }}
                  onClick={() => setFormData({ ...formData, weight: availableStock.weight.toString(), quantity: availableStock.quantity.toString() })}
                >
                  இரண்டையும் போடு (Use Both)
                </button>
              </div>
            )}

            <div className="form-group">
              <label>விற்கப்படும் எடை (Weight g)</label>
              <input type="number" step="0.001" value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} />
            </div>
            <div className="form-group">
              <label>விற்கப்படும் எண்ணிக்கை (Qty)</label>
              <input type="number" value={formData.quantity} onChange={e => {
                const q = parseInt(e.target.value || 0);
                const w = availableStock ? (q * availableStock.weight) : 0;
                setFormData({ ...formData, quantity: e.target.value, weight: w.toString() });
              }} />
            </div>
            
            <div className="form-group">
              <label>விற்பனை விலை (Sell Price) <span style={{ color: 'red' }}>*</span></label>
              <input type="number" placeholder="Enter Total Price" value={formData.rate} onChange={e => setFormData({ ...formData, rate: e.target.value })} style={{ fontSize: '18px', fontWeight: 700 }} />
            </div>
            
            <div className="form-group">
              <label>GST (₹)</label>
              <input type="number" placeholder="0" value={formData.gstAmt} onChange={e => setFormData({ ...formData, gstAmt: e.target.value })} />
            </div>
          </div>
          
          <div style={{ margin: '15px 0', padding: '15px', background: 'rgba(212,175,55,0.08)', borderRadius: '10px', border: '1px dashed var(--gold)' }}>
            <div className="flex-between fw-700" style={{ fontSize: '20px' }}>
              <span>மொத்த விலை (Total):</span><span className="text-gold">₹{finalItemTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button 
            className="btn btn-gold btn-lg btn-full" 
            onClick={addToCart}
            disabled={!selectedStockId || !formData.rate || parseFloat(formData.rate) <= 0}
          >
            + பட்டியலில் சேர் (Add to Cart)
          </button>
        </div>

        {/* Cart & Customer */}
        <div className="card">
          <div className="card-title">விற்பனைப் பட்டியல் (Cart)</div>

          <div style={{ minHeight: '200px', border: '1px solid var(--border)', borderRadius: 10, padding: '10px', background: 'rgba(0,0,0,0.01)', overflowY: 'auto', marginBottom: '15px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-sub)' }}>பட்டியல் காலியாக உள்ளது</div>
            ) : (
              <table className="cart-table" style={{ width: '100%', fontSize: '13px' }}>
                <thead><tr><th>Item</th><th style={{ textAlign: 'center' }}>Qty|Wt</th><th style={{ textAlign: 'right' }}>Price</th><th></th></tr></thead>
                <tbody>
                  {cart.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="fw-600">{item.variant}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>{item.detail}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>{item.quantity} | {item.weight}g</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{item.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-danger-ghost" style={{ padding: 4 }} onClick={() => setCart(cart.filter((_, i) => i !== idx))}><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div>
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
