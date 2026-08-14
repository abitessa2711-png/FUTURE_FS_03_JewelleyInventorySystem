import React, { useState } from 'react'
import { MASTER_DATA } from '../data/masterData'
import { ShoppingCart, User, Trash2, Eye } from 'lucide-react'
import BillModal from './BillModal'

const CATEGORIES = Object.keys(MASTER_DATA || {})

const SellDashboard = ({ products = [], processSale }) => {
  const [formData, setFormData] = useState({
    category: '', subcategory: '', variant: '', detail: '', weight: '', quantity: '1'
  })
  const [customer, setCustomer] = useState({ name: '', mobile: '' })
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(false)
  const [showBill, setShowBill] = useState(null)
  const [lastBill, setLastBill] = useState(null)
  const [selectedStockId, setSelectedStockId] = useState('')
  const [weightSearch, setWeightSearch] = useState('')
  const [saleDate, setSaleDate] = useState(() => {
    try {
      return new Date().toLocaleString('sv-SE').slice(0, 16).replace(' ', 'T')
    } catch (e) {
      return new Date().toISOString().slice(0, 16)
    }
  })
  
  // Daily Metal Rates
  const [goldRate, setGoldRate] = useState(() => localStorage.getItem('today_gold_rate') || '')
  const [silverRate, setSilverRate] = useState(() => localStorage.getItem('today_silver_rate') || '')
  
  // Bill-Level Financials (Direct Entry for Entire Bill)
  const [manualBillTotal, setManualBillTotal] = useState('')
  const [includeOldSilver, setIncludeOldSilver] = useState(false)
  const [oldSilverWeight, setOldSilverWeight] = useState('')
  const [oldSilverAmount, setOldSilverAmount] = useState('')
  const [billDiscount, setBillDiscount] = useState('')

  const getSubs = () => {
    if (!formData.category || !MASTER_DATA[formData.category]) return []
    return Object.keys(MASTER_DATA[formData.category] || {})
  }

  const getVariants = () => {
    if (!formData.category || !formData.subcategory || !MASTER_DATA[formData.category]) return []
    const d = MASTER_DATA[formData.category]?.[formData.subcategory]
    if (!d) return []
    return Array.isArray(d) ? d : (typeof d === 'object' ? Object.keys(d) : [])
  }

  // Helper for category emoji
  const getCategoryEmoji = (cat) => {
    const c = String(cat || '').toLowerCase()
    if (c.includes('gold') || c.includes('தங்கம்')) return '🟡'
    if (c.includes('silver') || c.includes('வெள்ளி') || c.includes('கொலுசு') || c.includes('மெட்டி') || c.includes('தண்டை') || c.includes('வளையல்') || c.includes('திருகு') || c.includes('கொடி') || c.includes('டாலர்') || c.includes('தாயத்து') || c.includes('கம்மல்') || c.includes('மோதிரம்') || c.includes('காயின்') || c.includes('காப்பு') || c.includes('செயின்') || c.includes('பாத்திரங்கள்')) return '⚪'
    return '📦'
  }

  // Calculate default price for an item based on metal rates
  const calculateItemEstTotal = (cat, wt) => {
    const c = String(cat || '').toLowerCase()
    const w = parseFloat(wt || 0)
    if (isNaN(w) || w <= 0) return 0
    if (c.includes('gold') || c.includes('தங்கம்')) {
      const gr = parseFloat(goldRate || 0)
      return (!isNaN(gr) && gr > 0) ? (w * gr) : 0
    } else {
      const sr = parseFloat(silverRate || 0)
      return (!isNaN(sr) && sr > 0) ? (w * sr) : 0
    }
  }

  // Filter products safely for search and dropdown
  const filteredStocks = (products || []).filter(s => {
    if (!s) return false
    const numWeight = parseFloat(s.weight || 0)
    const numQty = parseInt(s.quantity || 0, 10)
    const hasStock = numWeight > 0 || numQty > 0
    if (!hasStock) return false

    if (!weightSearch) {
      if (formData.category && s.category !== formData.category) return false
      if (formData.subcategory && s.subcategory !== formData.subcategory) return false
      if (formData.variant && s.variant !== formData.variant) return false
      return true
    }

    const searchVal = String(weightSearch || '').trim().toLowerCase()
    const sDetail = String(s.detail || '').toLowerCase()
    const sId = String(s.id || '')
    const sWeightStr = !isNaN(numWeight) ? numWeight.toString() : ''
    const sWeightFixed = !isNaN(numWeight) ? numWeight.toFixed(3) : ''
    
    return sWeightStr.includes(searchVal) || 
           sWeightFixed.includes(searchVal) || 
           sDetail.includes(searchVal) ||
           sId === searchVal
  })

  const availableStock = (products || []).find(p => p && p.id === parseInt(selectedStockId, 10))

  const handleReset = () => {
    setFormData({
      category: '', subcategory: '', variant: '', detail: '', weight: '', quantity: '1'
    })
    setSelectedStockId('')
    setWeightSearch('')
  }

  const addToCart = () => {
    const w = parseFloat(formData.weight || 0)
    const q = parseInt(formData.quantity || 1, 10)
    
    if (!selectedStockId || !availableStock) {
      alert('பொருளை தேர்வு செய்யவும் (Please select an item from stock)')
      return
    }
    if (w <= 0 && q <= 0) {
      alert('எடை அல்லது எண்ணிக்கை தேவை (Weight or quantity required)')
      return
    }

    if (availableStock) {
      const avWt = parseFloat(availableStock.weight || 0)
      const avQty = parseInt(availableStock.quantity || 0, 10)
      if (w > 0 && avWt < w) {
        alert('போதுமான இருப்பு எடை இல்லை')
        return
      }
      if (q > 0 && avQty < q) {
        alert('போதுமான இருப்பு எண்ணிக்கை இல்லை')
        return
      }
    }

    const estItemTotal = calculateItemEstTotal(formData.category, w)

    setCart(prev => [...prev, { 
      ...formData, 
      productId: availableStock.id,
      weight: w, 
      quantity: q,
      estTotal: estItemTotal,
      total: estItemTotal
    }])
    
    // Reset selection part
    setFormData({ category: '', subcategory: '', variant: '', detail: '', weight: '', quantity: '1' })
    setSelectedStockId('')
    setWeightSearch('')
  }

  // Calculated Totals for entire bill
  const totalCartQty = cart.reduce((sum, item) => sum + (parseInt(item.quantity || 0, 10) || 0), 0)
  const totalCartWeight = cart.reduce((sum, item) => sum + (parseFloat(item.weight || 0) || 0), 0)
  const autoSuggestedGross = cart.reduce((sum, item) => sum + (parseFloat(item.estTotal || 0) || 0), 0)

  // Gross Total: if user typed manual bill total use that, otherwise use autoSuggestedGross
  const effectiveGrossTotal = manualBillTotal !== '' ? (parseFloat(manualBillTotal) || 0) : autoSuggestedGross
  const oldSilverDeduction = includeOldSilver ? (parseFloat(oldSilverAmount) || 0) : 0
  const discountDeduction = parseFloat(billDiscount) || 0
  const netPayable = Math.max(0, effectiveGrossTotal - oldSilverDeduction - discountDeduction)

  const handleSale = async (printAfterSave = true) => {
    if (!cart.length) {
      alert('பட்டியலில் பொருட்கள் எதுவும் சேர்க்கப்படவில்லை (Cart is empty)')
      return
    }
    setLoading(true)
    try {
      const selectedIsoDate = new Date(saleDate).toISOString()
      const metadata = {
        overallBillTotal: effectiveGrossTotal,
        billDiscount: discountDeduction,
        oldSilverWeight: includeOldSilver ? (parseFloat(oldSilverWeight) || 0) : 0,
        oldSilverAmount: oldSilverDeduction,
        goldRate: parseFloat(goldRate || 0),
        silverRate: parseFloat(silverRate || 0)
      }

      // Distribute bill amount across cart items if needed
      const processedCart = cart.map((item) => {
        let itemPortion = item.estTotal || 0
        if (effectiveGrossTotal > 0 && totalCartWeight > 0) {
          itemPortion = (parseFloat(item.weight || 0) / totalCartWeight) * effectiveGrossTotal
        }
        return {
          ...item,
          total: itemPortion > 0 ? itemPortion : (item.estTotal || 0)
        }
      })

      const bill = await processSale(customer.name || 'Walk-in', customer.mobile, processedCart, selectedIsoDate, metadata)
      if (printAfterSave) {
        setShowBill(bill)
        setLastBill(bill)
      } else {
        alert('விற்பனை விவரம் வெற்றிகரமாகச் சேமிக்கப்பட்டது!')
      }

      // Reset cart & financials
      setCart([])
      setCustomer({ name: '', mobile: '' })
      setManualBillTotal('')
      setIncludeOldSilver(false)
      setOldSilverWeight('')
      setOldSilverAmount('')
      setBillDiscount('')
      try {
        setSaleDate(new Date().toLocaleString('sv-SE').slice(0, 16).replace(' ', 'T'))
      } catch (e) {
        setSaleDate(new Date().toISOString().slice(0, 16))
      }
    } catch (err) {
      alert('விற்பனை பிழை: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex-between mb-16">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>விற்பனை & பில் (Quick Billing)</h2>
          <p className="text-sub">Add multiple items to cart and generate a single unified customer bill</p>
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
        {/* Left Side: Fast Item Selection */}
        <div className="card">
          <div className="flex-between mb-12">
            <div className="card-title" style={{ margin: 0 }}>
              1. பொருள் தேர்வு (Select & Add to Cart)
            </div>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ fontSize: '11px', padding: '4px 8px', height: 'auto' }}
              onClick={handleReset}
            >
              Reset
            </button>
          </div>

          <div className="form-grid form-grid-2col">
            <div className="form-group">
              <label>பிரிவு (Category)</label>
              <select value={formData.category} onChange={e => {
                const cat = e.target.value;
                setFormData({ ...formData, category: cat, subcategory: '', variant: '', detail: '', weight: '', quantity: '1' })
                setSelectedStockId('')
                setWeightSearch('')
              }}>
                <option value="">— Select Category —</option>
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
                <option value="">— Select Subcategory —</option>
                {getSubs().map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group grid-span-2">
              <label>மாடல் / வகை (Variant)</label>
              <select value={formData.variant} onChange={e => {
                setFormData({ ...formData, variant: e.target.value, detail: '' })
                setSelectedStockId('')
                setWeightSearch('')
              }} disabled={!formData.subcategory}>
                <option value="">— Select Variant —</option>
                {getVariants().map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div className="form-group grid-span-2">
              <label>இருப்புத் தேடல் (Search Stock by Weight/Detail/ID)</label>
              <input 
                type="text" 
                placeholder="எடை (எ.கா: 1.990) அல்லது ID தட்டச்சு செய்யவும்..." 
                value={weightSearch} 
                onChange={e => {
                  const val = String(e.target.value || '').trim().toLowerCase();
                  setWeightSearch(e.target.value);
                  const matches = (products || []).filter(s => {
                    if (!s) return false;
                    const sWt = parseFloat(s.weight || 0);
                    const sQty = parseInt(s.quantity || 0, 10);
                    if (sWt <= 0 && sQty <= 0) return false;
                    const sDetail = String(s.detail || '').toLowerCase();
                    const sId = String(s.id || '');
                    const sWtStr = !isNaN(sWt) ? sWt.toString() : '';
                    const sWtFixed = !isNaN(sWt) ? sWt.toFixed(3) : '';
                    return sWtStr.includes(val) || 
                           sWtFixed.includes(val) ||
                           sDetail.includes(val) ||
                           sId === val;
                  });
                  if (matches.length === 1) {
                    const s = matches[0];
                    setSelectedStockId(s.id.toString());
                    setFormData({ 
                      ...formData, 
                      category: s.category || '',
                      subcategory: s.subcategory || '',
                      variant: s.variant || '',
                      detail: s.detail || '', 
                      weight: (s.weight || 0).toString(), 
                      quantity: "1"
                    });
                  }
                }}
              />
            </div>

            <div className="form-group grid-span-2">
              <label>இருப்புத் தெரிவு (Select Specific Stock) <span style={{ color: 'red' }}>*</span></label>
              <select value={selectedStockId} onChange={e => {
                const id = e.target.value;
                setSelectedStockId(id);
                const s = (products || []).find(p => p && p.id === parseInt(id, 10));
                if (s) {
                  setFormData({ 
                    ...formData, 
                    category: s.category || '',
                    subcategory: s.subcategory || '',
                    variant: s.variant || '',
                    detail: s.detail || '', 
                    weight: (s.weight || 0).toString(), 
                    quantity: "1"
                  });
                }
              }} disabled={filteredStocks.length === 0}>
                <option value="">— {filteredStocks.length > 0 ? 'Select Stock Entry' : 'No Stock Available'} —</option>
                {filteredStocks.slice(0, 100).map(s => (
                  <option key={s.id} value={s.id}>
                    ID: {s.id} | {getCategoryEmoji(s.category)} {s.category} {' > '} {s.subcategory} {' > '} {s.variant} | {s.detail || 'No Detail'} | {s.quantity} pcs | {parseFloat(s.weight || 0).toFixed(3)}g
                  </option>
                ))}
              </select>
            </div>

            {filteredStocks.length > 0 && (
              <div className="grid-span-2" style={{ marginTop: '-4px', marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-sub)', marginBottom: '6px' }}>
                  இருப்பில் உள்ள பொருட்கள் (Click to quick-select):
                </label>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '6px', 
                  maxHeight: '140px', 
                  overflowY: 'auto', 
                  padding: '8px', 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '10px' 
                }}>
                  {filteredStocks.slice(0, 50).map(s => {
                    const isSelected = selectedStockId === String(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedStockId(String(s.id));
                          setFormData({ 
                            ...formData, 
                            category: s.category || '',
                            subcategory: s.subcategory || '',
                            variant: s.variant || '',
                            detail: s.detail || '', 
                            weight: (s.weight || 0).toString(), 
                            quantity: "1"
                          });
                        }}
                        style={{
                          background: isSelected ? 'rgba(197, 160, 94, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected ? '1px solid var(--gold)' : '1px solid var(--border)',
                          color: isSelected ? 'var(--gold)' : 'var(--text-main)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: isSelected ? 700 : 500
                        }}
                      >
                        <span style={{ color: isSelected ? 'var(--gold)' : 'var(--text-sub)', fontSize: '10px' }}>#{s.id}</span>
                        <span>{getCategoryEmoji(s.category)} {s.variant || s.subcategory || s.category}: {parseFloat(s.weight || 0).toFixed(3)}g</span>
                        {s.quantity > 1 && <span style={{ opacity: 0.8 }}>({s.quantity} pcs)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {availableStock && (
              <div className="grid-span-2" style={{ marginTop: '-4px', marginBottom: '6px', fontSize: '13px', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ color: 'var(--text-sub)' }}>
                  இருப்பில் உள்ளது: {' '}
                  <strong style={{ color: 'var(--gold)' }}>{parseFloat(availableStock.weight || 0).toFixed(3)}g</strong> | <strong style={{ color: 'var(--gold)' }}>{availableStock.quantity || 0} pcs</strong>
                </span>
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  style={{ height: '24px', fontSize: '11px', padding: '0 8px', borderRadius: '4px' }}
                  onClick={() => {
                    setFormData(prev => ({ 
                      ...prev, 
                      weight: (availableStock.weight || 0).toString(), 
                      quantity: (availableStock.quantity || 1).toString() 
                    }));
                  }}
                >
                  முழு இருப்பு போடு
                </button>
              </div>
            )}

            <div className="form-group">
              <label>விற்கப்படும் எடை (Weight g) <span style={{ color: 'red' }}>*</span></label>
              <input 
                type="number" 
                step="0.001" 
                placeholder="0.000"
                value={formData.weight} 
                onChange={e => setFormData({ ...formData, weight: e.target.value })} 
                style={{ fontWeight: 700, fontSize: '15px' }}
              />
            </div>

            <div className="form-group">
              <label>எண்ணிக்கை (Qty)</label>
              <input 
                type="number" 
                placeholder="1"
                value={formData.quantity} 
                onChange={e => setFormData({ ...formData, quantity: e.target.value })} 
              />
            </div>
          </div>

          <button 
            type="button"
            className="btn btn-gold btn-lg btn-full" 
            onClick={addToCart}
            disabled={!selectedStockId}
            style={{ marginTop: '14px', height: '44px', fontWeight: 700 }}
          >
            + பட்டியலில் சேர் (Add Item to Cart)
          </button>
        </div>

        {/* Right Side: Cart, Customer & Entire Bill Payment Form */}
        <div className="card">
          <div className="flex-between mb-12">
            <div className="card-title" style={{ margin: 0 }}>2. பில் விவரங்கள் & கட்டணம் (Bill Summary)</div>
            {cart.length > 0 && (
              <span style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--gold)', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                {cart.length} பொருட்கள்
              </span>
            )}
          </div>
          
          <div className="form-grid form-grid-cust mb-12">
            <div className="form-group">
              <label><User size={12} /> வாடிக்கையாளர் பெயர்</label>
              <input type="text" placeholder="Customer Name" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>மொபைல் எண்</label>
              <input type="text" placeholder="Mobile Number" value={customer.mobile} onChange={e => setCustomer({ ...customer, mobile: e.target.value })} />
            </div>
          </div>

          <div className="form-group mb-12">
            <label>விற்பனை தேதி & நேரம் (Sale Date & Time) *</label>
            <input 
              type="datetime-local" 
              value={saleDate} 
              onChange={e => setSaleDate(e.target.value)} 
              required
            />
          </div>

          {/* Today's Metal Rates */}
          <div className="form-grid form-grid-2col mb-12">
            <div className="form-group">
              <label>🟡 இன்றைய தங்கம் விலை (Gold Rate/g)</label>
              <input 
                type="number" 
                step="0.01"
                placeholder="0.00" 
                value={goldRate} 
                onChange={e => {
                  setGoldRate(e.target.value);
                  localStorage.setItem('today_gold_rate', e.target.value);
                }} 
              />
            </div>
            <div className="form-group">
              <label>⚪ இன்றைய வெள்ளி விலை (Silver Rate/g)</label>
              <input 
                type="number" 
                step="0.01"
                placeholder="0.00" 
                value={silverRate} 
                onChange={e => {
                  setSilverRate(e.target.value);
                  localStorage.setItem('today_silver_rate', e.target.value);
                }} 
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div style={{ minHeight: '130px', maxHeight: '180px', border: '1px solid var(--border)', borderRadius: 10, padding: '8px', background: 'rgba(0,0,0,0.01)', overflowY: 'auto', marginBottom: '14px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-sub)', fontSize: '13px' }}>
                பட்டியல் காலியாக உள்ளது — இடது பக்கத்தில் பொருட்களை சேர்க்கவும்
              </div>
            ) : (
              <table className="cart-table" style={{ width: '100%', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left' }}>பொருள் (Item)</th>
                    <th style={{ textAlign: 'center', width: '90px' }}>எண்ணிக்கை</th>
                    <th style={{ textAlign: 'right', width: '100px' }}>எடை (g)</th>
                    <th style={{ width: '35px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px dashed var(--border)' }}>
                      <td>
                        <div className="fw-600">{item.variant || item.subcategory}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>
                          {item.category} {item.detail && ` · ${item.detail}`}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.quantity || 1} pcs</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--gold)' }}>{parseFloat(item.weight || 0).toFixed(3)}g</td>
                      <td style={{ textAlign: 'right' }}>
                        <button type="button" className="btn btn-danger-ghost" style={{ padding: 4 }} onClick={() => setCart(cart.filter((_, i) => i !== idx))}><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Bill-Level Amount Inputs (Combined for All Items) */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold)' }}>
                💰 பில் மொத்த தொகை (Total Bill Amount ₹) {autoSuggestedGross > 0 && `· சுட்டிக்காட்டப்பட்ட தொகை: ₹${autoSuggestedGross.toFixed(2)}`}
              </label>
              <input 
                type="number" 
                step="0.01" 
                placeholder={autoSuggestedGross > 0 ? autoSuggestedGross.toFixed(2) : "0.00"}
                value={manualBillTotal} 
                onChange={e => setManualBillTotal(e.target.value)} 
                style={{ height: '42px', fontSize: '16px', fontWeight: 800, borderColor: 'var(--gold)', color: 'var(--gold)' }}
              />
            </div>

            {/* Old Silver / Metal Trade-in */}
            <div style={{ marginBottom: '10px', borderTop: '1px dashed var(--border)', paddingTop: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                <input 
                  type="checkbox" 
                  checked={includeOldSilver} 
                  onChange={e => setIncludeOldSilver(e.target.checked)} 
                  style={{ width: '16px', height: '16px', accentColor: 'var(--gold)', cursor: 'pointer', margin: 0 }}
                />
                <span>பழைய வெள்ளி / தங்கம் கழிவு (Old Metal Trade-in)</span>
              </label>
              
              {includeOldSilver && (
                <div className="form-grid form-grid-2col" style={{ marginTop: '8px', gap: '8px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '11px' }}>பழைய எடை (Weight g)</label>
                    <input 
                      type="number" 
                      step="0.001" 
                      placeholder="எ.கா: 12.500"
                      value={oldSilverWeight} 
                      onChange={e => setOldSilverWeight(e.target.value)} 
                      style={{ height: '36px', fontSize: '13px' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '11px' }}>பழைய தொகை (Amount ₹)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="எ.கா: 1500.00"
                      value={oldSilverAmount} 
                      onChange={e => setOldSilverAmount(e.target.value)} 
                      style={{ height: '36px', fontSize: '13px', borderColor: 'var(--success)', color: 'var(--success)', fontWeight: 700 }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bill Discount Input */}
            <div className="form-group" style={{ margin: 0, borderTop: '1px dashed var(--border)', paddingTop: '10px' }}>
              <label style={{ fontSize: '12px' }}>பில் தள்ளுபடி (Bill Discount Amount ₹ - Optional)</label>
              <input 
                type="number" 
                step="0.01" 
                placeholder="0.00" 
                value={billDiscount} 
                onChange={e => setBillDiscount(e.target.value)} 
                style={{ height: '36px', fontSize: '13px', borderColor: billDiscount ? 'var(--danger)' : 'var(--border)', color: billDiscount ? 'var(--danger)' : 'var(--text-main)', fontWeight: 600 }}
              />
            </div>
          </div>

          {/* Final Financial Summary */}
          <div>
            <div style={{ padding: '14px 16px', background: 'rgba(212,175,55,0.05)', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '14px' }}>
              <div className="flex-between fw-600" style={{ fontSize: '12px', color: 'var(--text-sub)' }}>
                <span>மொத்த உருப்படிகள் (Total Items):</span>
                <span>{totalCartQty} pcs | {Number(totalCartWeight).toFixed(3)}g</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />
              <div className="flex-between fw-600" style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                <span>மொத்த மதிப்பு (Gross Total):</span>
                <span>₹{Number(effectiveGrossTotal).toFixed(2)}</span>
              </div>
              {oldSilverDeduction > 0 && (
                <div className="flex-between fw-600" style={{ fontSize: '13px', color: 'var(--success)', marginTop: '3px' }}>
                  <span>பழைய பொருள் கழிவு {oldSilverWeight ? `(${oldSilverWeight}g)` : ''}:</span>
                  <span>- ₹{Number(oldSilverDeduction).toFixed(2)}</span>
                </div>
              )}
              {discountDeduction > 0 && (
                <div className="flex-between fw-600" style={{ fontSize: '13px', color: 'var(--danger)', marginTop: '3px' }}>
                  <span>தள்ளுபடி (Discount):</span>
                  <span>- ₹{Number(discountDeduction).toFixed(2)}</span>
                </div>
              )}
              <div style={{ borderTop: '2px solid var(--border)', margin: '8px 0' }} />
              <div className="flex-between fw-700" style={{ fontSize: '18px', color: 'var(--gold)' }}>
                <span>நிகர தொகை (Net Pay):</span>
                <span>₹{Number(netPayable).toFixed(2)}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button"
                className="btn btn-secondary btn-lg" 
                style={{ flex: 1, padding: '10px 4px', fontSize: '12px' }}
                disabled={!cart.length || loading} 
                onClick={() => handleSale(false)}
              >
                பதிவு மட்டும் செய் (Save Only)
              </button>
              <button 
                type="button"
                className="btn btn-gold btn-lg" 
                style={{ flex: 1.2, padding: '10px 4px', fontSize: '12px' }}
                disabled={!cart.length || loading} 
                onClick={() => handleSale(true)}
              >
                பில் செய்து அச்சிடு (Save & Print)
              </button>
            </div>
          </div>
        </div>
      </div>

      {showBill && <BillModal bill={showBill} onClose={() => setShowBill(null)} />}
    </div>
  )
}

export default SellDashboard
