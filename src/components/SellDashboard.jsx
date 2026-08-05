import React, { useState } from 'react'
import { MASTER_DATA } from '../data/masterData'
import { ShoppingCart, User, CreditCard, Trash2, Eye } from 'lucide-react'
import BillModal from './BillModal'

const CATEGORIES = Object.keys(MASTER_DATA)

const SellDashboard = ({ products = [], processSale }) => {
  const [formData, setFormData] = useState({
    category: '', subcategory: '', variant: '', detail: '', weight: '', quantity: '', rate: '', discountAmt: '', gstAmt: ''
  })
  const [customer, setCustomer] = useState({ name: '', mobile: '' })
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(false)
  const [showBill, setShowBill] = useState(null)
  const [lastBill, setLastBill] = useState(null)
  const [selectedStockId, setSelectedStockId] = useState('')
  const [weightSearch, setWeightSearch] = useState('')
  const [saleDate, setSaleDate] = useState(() => {
    return new Date().toLocaleString('sv-SE').slice(0, 16).replace(' ', 'T')
  })

  const getSubs = () => formData.category ? Object.keys(MASTER_DATA[formData.category]) : []
  const getVariants = () => {
    if (!formData.category || !formData.subcategory) return []
    const d = MASTER_DATA[formData.category][formData.subcategory]
    return Array.isArray(d) ? d : (typeof d === 'object' ? Object.keys(d) : [])
  }

  // Helper to determine product category emoji for premium look
  // Helper to determine product category emoji for premium look
  const getCategoryEmoji = (cat) => {
    const c = (cat || '').toLowerCase()
    if (c.includes('gold') || c.includes('தங்கம்')) return '🟡'
    if (c.includes('silver') || c.includes('வெள்ளி') || c.includes('கொலுசு') || c.includes('மெட்டி') || c.includes('தண்டை') || c.includes('வளையல்') || c.includes('திருகு') || c.includes('கொடி') || c.includes('டாலர்') || c.includes('தாயத்து') || c.includes('கம்மல்') || c.includes('மோதிரம்') || c.includes('காயின்') || c.includes('காப்பு') || c.includes('செயின்') || c.includes('பாத்திரங்கள்')) return '⚪'
    return '📦'
  }

  // Derived: Filter products based on selected dropdown hierarchy.
  // If no category/subcategory/variant is selected, we include all available stocks.
  const matchingStocks = products.filter(p => {
    if (formData.category && p.category !== formData.category) return false
    if (formData.subcategory && p.subcategory !== formData.subcategory) return false
    if (formData.variant && p.variant !== formData.variant) return false
    return p.weight > 0 || (p.quantity && p.quantity > 0)
  })

  const filteredStocks = matchingStocks.filter(s => {
    if (!weightSearch) return true;
    const searchVal = weightSearch.trim().toLowerCase();
    return s.weight.toString().includes(searchVal) || 
           s.weight.toFixed(3).includes(searchVal) || 
           (s.detail && s.detail.toLowerCase().includes(searchVal)) ||
           s.id.toString() === searchVal;
  });

  const availableStock = products.find(p => p.id === parseInt(selectedStockId))

  const handleReset = () => {
    setFormData({
      category: '', subcategory: '', variant: '', detail: '', weight: '', quantity: '', rate: '', discountAmt: '', gstAmt: ''
    })
    setSelectedStockId('')
    setWeightSearch('')
  }

  const weight = parseFloat(formData.weight || 0)
  const rate = parseFloat(formData.rate || 0)
  const finalItemTotal = weight * rate

  const addToCart = () => {
    const w = parseFloat(formData.weight || 0)
    const q = parseInt(formData.quantity || 0)
    const r = 0
    const dAmt = 0
    const gAmt = 0
    
    if (!selectedStockId || !availableStock) {
      alert('இந்த பொருள் இருப்பில் இல்லை')
      return
    }
    if (w <= 0 && q <= 0) {
      alert('எடை அல்லது எண்ணிக்கை தேவை')
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

    const sub = w * r
    const total = sub - dAmt + gAmt

    setCart([...cart, { 
      ...formData, 
      productId: availableStock.id,
      weight: w, 
      quantity: q,
      pricePerGram: r,
      subtotal: sub,
      discountAmount: dAmt,
      gstAmount: gAmt,
      total: total 
    }])
    
    // Reset selection part
    setFormData({ ...formData, weight: '', quantity: '', rate: '', discountAmt: '' })
    setSelectedStockId('')
    setWeightSearch('')
  }

  const handleSale = async () => {
    if (!cart.length) return
    setLoading(true)
    try {
      const selectedIsoDate = new Date(saleDate).toISOString()
      const bill = await processSale(customer.name || 'Walk-in', customer.mobile, cart, selectedIsoDate)
      setShowBill(bill)
      setLastBill(bill)
      setCart([])
      setCustomer({ name: '', mobile: '' })
      setSaleDate(new Date().toLocaleString('sv-SE').slice(0, 16).replace(' ', 'T'))
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
          <div className="flex-between mb-12">
            <div className="card-title" style={{ margin: 0 }}>பொருள் தேர்வு (Item Selection)</div>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ fontSize: '11px', padding: '4px 8px', height: 'auto' }}
              onClick={handleReset}
            >
              Reset Filters / Clear
            </button>
          </div>
          <div className="form-grid form-grid-2col">
            <div className="form-group">
              <label>பிரிவு (Category)</label>
              <select value={formData.category} onChange={e => {
                setFormData({ ...formData, category: e.target.value, subcategory: '', variant: '', detail: '' })
                setSelectedStockId('')
                setWeightSearch('')
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
                setWeightSearch('')
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
                setWeightSearch('')
              }} disabled={!formData.subcategory}>
                <option value="">— Select —</option>
                {getVariants().map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            {matchingStocks.length > 0 && (
              <div className="form-group grid-span-2">
                <label>இருப்புத் தேடல் (எடை/விவரம்/ID மூலம் தேட) / Search Stock (by Weight/Detail/ID)</label>
                <input 
                  type="text" 
                  placeholder="எடை, விவரம் அல்லது ID-ஐ தட்டச்சு செய்யவும்..." 
                  value={weightSearch} 
                  onChange={e => {
                    const val = e.target.value;
                    setWeightSearch(val);
                    const matches = matchingStocks.filter(s => 
                      s.weight.toString().includes(val) || 
                      s.weight.toFixed(3).includes(val) ||
                      (s.detail && s.detail.toLowerCase().includes(val.toLowerCase())) ||
                      s.id.toString() === val
                    );
                    if (matches.length === 1) {
                      const s = matches[0];
                      setSelectedStockId(s.id.toString());
                      setFormData({ 
                        ...formData, 
                        category: s.category,
                        subcategory: s.subcategory,
                        variant: s.variant,
                        detail: s.detail, 
                        weight: s.weight.toString(), 
                        quantity: "1" 
                      });
                    }
                  }}
                />
              </div>
            )}

            <div className="form-group grid-span-2">
              <label>இருப்புத் தெரிவு (Select Specific Stock) <span style={{ color: 'red' }}>*</span></label>
              <select value={selectedStockId} onChange={e => {
                const id = e.target.value;
                setSelectedStockId(id);
                const s = products.find(p => p.id === parseInt(id));
                if (s) {
                  setFormData({ 
                    ...formData, 
                    category: s.category,
                    subcategory: s.subcategory,
                    variant: s.variant,
                    detail: s.detail, 
                    weight: s.weight.toString(), 
                    quantity: "1" 
                  });
                }
              }} disabled={matchingStocks.length === 0}>
                <option value="">— {matchingStocks.length > 0 ? 'Select Stock Entry' : 'No Stock Available'} —</option>
                {filteredStocks.slice(0, 100).map(s => (
                  <option key={s.id} value={s.id}>
                    ID: {s.id} | {getCategoryEmoji(s.category)} {s.category} {' > '} {s.subcategory} {' > '} {s.variant} | {s.detail || 'No Detail'} | {s.quantity} pcs | {s.weight}g
                  </option>
                ))}
              </select>
            </div>

            {matchingStocks.length > 0 && (
              <div className="grid-span-2" style={{ marginTop: '-4px', marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-sub)', marginBottom: '6px' }}>
                  இருப்பில் உள்ள பொருட்கள் (Available Items - Click to select):
                </label>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '8px', 
                  maxHeight: '150px', 
                  overflowY: 'auto', 
                  padding: '8px', 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '10px' 
                }}>
                  {filteredStocks.slice(0, 50).map(s => {
                    const isSelected = selectedStockId === s.id.toString();
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedStockId(s.id.toString());
                          setFormData({ 
                            ...formData, 
                            category: s.category,
                            subcategory: s.subcategory,
                            variant: s.variant,
                            detail: s.detail, 
                            weight: s.weight.toString(), 
                            quantity: "1" 
                          });
                        }}
                        style={{
                          background: isSelected ? 'rgba(197, 160, 94, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected ? '1px solid var(--gold)' : '1px solid var(--border)',
                          color: isSelected ? 'var(--gold)' : 'var(--text-main)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                          fontWeight: isSelected ? 600 : 500
                        }}
                        className="stock-select-badge"
                      >
                        <span style={{ color: isSelected ? 'var(--gold)' : 'var(--text-sub)', fontSize: '10px' }}>#{s.id}</span>
                        <span>{getCategoryEmoji(s.category)} {s.variant || s.subcategory || s.category}: {s.weight}g</span>
                        {s.quantity > 1 && <span style={{ opacity: 0.8 }}>({s.quantity} pcs)</span>}
                        {s.detail && <span style={{ opacity: 0.6, fontSize: '11px' }}>- {s.detail}</span>}
                      </button>
                    );
                  })}
                  {filteredStocks.length > 50 && (
                    <div style={{ width: '100%', color: 'var(--text-sub)', fontSize: '11px', textAlign: 'center', marginTop: '4px' }}>
                      மேலும் {filteredStocks.length - 50} பொருட்கள் உள்ளன, எடையை இன்னும் தெளிவாக தட்டச்சு செய்யவும் (Type more digits to filter)
                    </div>
                  )}
                  {filteredStocks.length === 0 && (
                    <div style={{ color: 'var(--text-sub)', fontSize: '12px', padding: '4px' }}>பொருந்தும் இருப்புகள் எதுவும் இல்லை (No matching stocks)</div>
                  )}
                </div>
              </div>
            )}

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
          </div>

          <button 
            className="btn btn-gold btn-lg btn-full" 
            onClick={addToCart}
            disabled={!selectedStockId}
            style={{ marginTop: '14px' }}
          >
            + பட்டியலில் சேர் (Add to Cart)
          </button>
        </div>

        {/* Cart & Customer */}
        <div className="card">
          <div className="card-title">விற்பனைப் பட்டியல் (Cart)</div>
          
          <div className="form-grid form-grid-cust mb-16">
            <div className="form-group">
              <label><User size={12} /> வாடிக்கையாளர் பெயர்</label>
              <input type="text" placeholder="Name" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>மொபைல்</label>
              <input type="text" placeholder="Mobile" value={customer.mobile} onChange={e => setCustomer({ ...customer, mobile: e.target.value })} />
            </div>
          </div>

          <div className="form-group mb-16">
            <label>விற்பனை தேதி (Sale Date & Time) *</label>
            <input 
              type="datetime-local" 
              value={saleDate} 
              onChange={e => setSaleDate(e.target.value)} 
              required
            />
          </div>

          <div style={{ minHeight: '200px', border: '1px solid var(--border)', borderRadius: 10, padding: '10px', background: 'rgba(0,0,0,0.01)', overflowY: 'auto', marginBottom: '15px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-sub)' }}>பட்டியல் காலியாக உள்ளது</div>
            ) : (
              <table className="cart-table" style={{ width: '100%', fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style={{ textAlign: 'right' }}>Qty | Wt</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="fw-600">{item.variant || item.subcategory}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>
                          {item.category} {item.detail && ` · ${item.detail}`}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.quantity} pcs | {item.weight}g</td>
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
            <div style={{ margin: '15px 0', padding: '15px', background: 'rgba(212,175,55,0.04)', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '16px' }}>
              <div className="flex-between fw-600" style={{ fontSize: '14px' }}>
                <span>மொத்த எண்ணிக்கை (Total Qty):</span><span>{cart.reduce((sum, item) => sum + (item.quantity || 0), 0)} pcs</span>
              </div>
              <div className="flex-between fw-600" style={{ fontSize: '14px', marginTop: '6px' }}>
                <span>மொத்த எடை (Total Weight):</span><span>{cart.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0).toFixed(3)} g</span>
              </div>
            </div>
            <button className="btn btn-primary btn-lg btn-full" disabled={!cart.length || loading} onClick={handleSale}>
              <CreditCard size={18} /> {loading ? 'செயலாக்கப்படுகிறது...' : '💳 விற்பனை பற்றுச்சீட்டு (Log Sale)'}
            </button>
          </div>
        </div>
      </div>

      {showBill && <BillModal bill={showBill} onClose={() => setShowBill(null)} />}
    </div>
  )
}

export default SellDashboard
