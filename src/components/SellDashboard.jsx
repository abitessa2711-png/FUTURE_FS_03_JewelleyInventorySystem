import React, { useState } from 'react'
import { MASTER_DATA } from '../data/masterData'
import { ShoppingCart, User, Trash2, Eye } from 'lucide-react'
import BillModal from './BillModal'

const CATEGORIES = Object.keys(MASTER_DATA)

const SellDashboard = ({ products = [], processSale }) => {
  const [formData, setFormData] = useState({
    category: '', subcategory: '', variant: '', detail: '', weight: '', quantity: '', itemTotal: '', oldSilverAmt: '', discountAmt: ''
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
  
  // Daily Metal Rates on the Right Side
  const [goldRate, setGoldRate] = useState(() => localStorage.getItem('today_gold_rate') || '')
  const [silverRate, setSilverRate] = useState(() => localStorage.getItem('today_silver_rate') || '')
  
  // Old Silver Trade-in state (overall trade-in)
  const [includeOldSilver, setIncludeOldSilver] = useState(false)
  const [oldSilverWeight, setOldSilverWeight] = useState('')
  const [oldSilverAmount, setOldSilverAmount] = useState('')

  const getSubs = () => {
    if (!formData.category || !MASTER_DATA[formData.category]) return []
    return Object.keys(MASTER_DATA[formData.category])
  }
  const getVariants = () => {
    if (!formData.category || !formData.subcategory || !MASTER_DATA[formData.category]) return []
    const d = MASTER_DATA[formData.category][formData.subcategory]
    if (!d) return []
    return Array.isArray(d) ? d : (typeof d === 'object' ? Object.keys(d) : [])
  }

  // Helper to determine product category emoji for premium look
  const getCategoryEmoji = (cat) => {
    const c = (cat || '').toLowerCase()
    if (c.includes('gold') || c.includes('தங்கம்')) return '🟡'
    if (c.includes('silver') || c.includes('வெள்ளி') || c.includes('கொலுசு') || c.includes('மெட்டி') || c.includes('தண்டை') || c.includes('வளையல்') || c.includes('திருகு') || c.includes('கொடி') || c.includes('டாலர்') || c.includes('தாயத்து') || c.includes('கம்மல்') || c.includes('மோதிரம்') || c.includes('காயின்') || c.includes('காப்பு') || c.includes('செயின்') || c.includes('பாத்திரங்கள்')) return '⚪'
    return '📦'
  }

  // Calculate default price suggestion if rate is entered
  const calculateDefaultTotal = (cat, wt) => {
    const c = (cat || '').toLowerCase()
    const w = parseFloat(wt || 0)
    if (w <= 0) return ''
    if (c.includes('gold') || c.includes('தங்கம்')) {
      const gr = parseFloat(goldRate || 0)
      return gr > 0 ? (w * gr).toFixed(2) : ''
    } else {
      const sr = parseFloat(silverRate || 0)
      return sr > 0 ? (w * sr).toFixed(2) : ''
    }
  }

  // Derived: Filter products based on selected dropdown hierarchy.
  const filteredStocks = products.filter(s => {
    const hasStock = (s.weight && s.weight > 0) || (s.quantity && s.quantity > 0)
    if (!hasStock) return false

    if (!weightSearch) {
      if (formData.category && s.category !== formData.category) return false
      if (formData.subcategory && s.subcategory !== formData.subcategory) return false
      if (formData.variant && s.variant !== formData.variant) return false
      return true
    }

    const searchVal = weightSearch.trim().toLowerCase();
    const sWeight = s.weight || 0;
    const sDetail = s.detail || '';
    const sId = s.id || '';
    
    return sWeight.toString().includes(searchVal) || 
           sWeight.toFixed(3).includes(searchVal) || 
           sDetail.toLowerCase().includes(searchVal) ||
           sId.toString() === searchVal;
  });

  const availableStock = products.find(p => p.id === parseInt(selectedStockId))

  const handleReset = () => {
    setFormData({
      category: '', subcategory: '', variant: '', detail: '', weight: '', quantity: '', itemTotal: '', oldSilverAmt: '', discountAmt: ''
    })
    setSelectedStockId('')
    setWeightSearch('')
  }

  const addToCart = () => {
    const w = parseFloat(formData.weight || 0)
    const q = parseInt(formData.quantity || 0)
    const manualTotal = parseFloat(formData.itemTotal || 0)
    const oldSilAmt = parseFloat(formData.oldSilverAmt || 0)
    const discAmt = parseFloat(formData.discountAmt || 0)
    
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

    const total = Math.max(0, manualTotal - oldSilAmt - discAmt)

    setCart([...cart, { 
      ...formData, 
      productId: availableStock.id,
      weight: w, 
      quantity: q,
      subtotal: manualTotal,
      oldSilverAmt: oldSilAmt,
      discountAmount: discAmt,
      total: total 
    }])
    
    // Reset selection part
    setFormData({ ...formData, weight: '', quantity: '', itemTotal: '', oldSilverAmt: '', discountAmt: '' })
    setSelectedStockId('')
    setWeightSearch('')
  }

  const updateCartItemTotal = (index, newTotal) => {
    setCart(prev => prev.map((item, idx) => {
      if (idx !== index) return item
      const totalNum = parseFloat(newTotal || 0)
      return {
        ...item,
        total: totalNum,
        subtotal: totalNum + (parseFloat(item.oldSilverAmt) || 0) + (parseFloat(item.discountAmount) || 0)
      }
    }))
  }

  const handleSale = async (printAfterSave = true) => {
    if (!cart.length) return
    setLoading(true)
    try {
      const selectedIsoDate = new Date(saleDate).toISOString()
      const metadata = {
        goldRate: parseFloat(goldRate || 0),
        silverRate: parseFloat(silverRate || 0),
        oldSilverWeight: includeOldSilver ? parseFloat(oldSilverWeight || 0) : 0,
        oldSilverAmount: includeOldSilver ? parseFloat(oldSilverAmount || 0) : 0
      }
      const bill = await processSale(customer.name || 'Walk-in', customer.mobile, cart, selectedIsoDate, metadata)
      if (printAfterSave) {
        setShowBill(bill)
        setLastBill(bill)
      } else {
        alert('விற்பனை விவரம் வெற்றிகரமாகச் சேமிக்கப்பட்டது!')
      }
      setCart([])
      setCustomer({ name: '', mobile: '' })
      setIncludeOldSilver(false)
      setOldSilverWeight('')
      setOldSilverAmount('')
      setSaleDate(new Date().toLocaleString('sv-SE').slice(0, 16).replace(' ', 'T'))
    } catch (err) {
      alert('விற்பனை பிழை: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const grossTotal = cart.reduce((sum, item) => sum + (parseFloat(item.subtotal) || parseFloat(item.total) || 0), 0)
  const itemOldSilverTotal = cart.reduce((sum, item) => sum + (parseFloat(item.oldSilverAmt) || 0), 0)
  const tradeInOldSilver = includeOldSilver ? parseFloat(oldSilverAmount || 0) : 0
  const totalOldSilverDeduction = itemOldSilverTotal + tradeInOldSilver
  const totalDiscountDeduction = cart.reduce((sum, item) => sum + (parseFloat(item.discountAmount) || 0), 0)
  const netTotal = Math.max(0, grossTotal - totalOldSilverDeduction - totalDiscountDeduction)

  return (
    <div className="animate-fade-in">
      <div className="flex-between mb-16">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>விற்பனை & பில் (Billing)</h2>
          <p className="text-sub">Process customer sales and generate invoices</p>
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
              Reset
            </button>
          </div>
          <div className="form-grid form-grid-2col">
            <div className="form-group">
              <label>பிரிவு (Category)</label>
              <select value={formData.category} onChange={e => {
                const cat = e.target.value;
                setFormData({ ...formData, category: cat, subcategory: '', variant: '', detail: '' })
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

            <div className="form-group grid-span-2">
              <label>இருப்புத் தேடல் (எடை/விவரம்/ID மூலம் தேட) / Search Stock</label>
              <input 
                type="text" 
                placeholder="எடை, விவரம் அல்லது ID-ஐ தட்டச்சு செய்யவும்..." 
                value={weightSearch} 
                onChange={e => {
                  const val = e.target.value;
                  setWeightSearch(val);
                  const matches = products.filter(s => {
                    const hasStock = (s.weight && s.weight > 0) || (s.quantity && s.quantity > 0);
                    if (!hasStock) return false;
                    const sWeight = s.weight || 0;
                    const sDetail = s.detail || '';
                    const sId = s.id || '';
                    return sWeight.toString().includes(val) || 
                           sWeight.toFixed(3).includes(val) ||
                           sDetail.toLowerCase().includes(val.toLowerCase()) ||
                           sId.toString() === val;
                  });
                  if (matches.length === 1) {
                    const s = matches[0];
                    setSelectedStockId(s.id.toString());
                    const defTot = calculateDefaultTotal(s.category, s.weight);
                    setFormData({ 
                      ...formData, 
                      category: s.category,
                      subcategory: s.subcategory,
                      variant: s.variant,
                      detail: s.detail, 
                      weight: (s.weight || 0).toString(), 
                      quantity: "1",
                      itemTotal: defTot
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
                const s = products.find(p => p.id === parseInt(id));
                if (s) {
                  const defTot = calculateDefaultTotal(s.category, s.weight);
                  setFormData({ 
                    ...formData, 
                    category: s.category,
                    subcategory: s.subcategory,
                    variant: s.variant,
                    detail: s.detail, 
                    weight: (s.weight || 0).toString(), 
                    quantity: "1",
                    itemTotal: defTot
                  });
                }
              }} disabled={filteredStocks.length === 0}>
                <option value="">— {filteredStocks.length > 0 ? 'Select Stock Entry' : 'No Stock Available'} —</option>
                {filteredStocks.slice(0, 100).map(s => (
                  <option key={s.id} value={s.id}>
                    ID: {s.id} | {getCategoryEmoji(s.category)} {s.category} {' > '} {s.subcategory} {' > '} {s.variant} | {s.detail || 'No Detail'} | {s.quantity} pcs | {s.weight}g
                  </option>
                ))}
              </select>
            </div>

            {filteredStocks.length > 0 && (
              <div className="grid-span-2" style={{ marginTop: '-4px', marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-sub)', marginBottom: '6px' }}>
                  இருப்பில் உள்ள பொருட்கள்:
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
                          const defTot = calculateDefaultTotal(s.category, s.weight);
                          setFormData({ 
                            ...formData, 
                            category: s.category,
                            subcategory: s.subcategory,
                            variant: s.variant,
                            detail: s.detail, 
                            weight: (s.weight || 0).toString(), 
                            quantity: "1",
                            itemTotal: defTot
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
                      மேலும் {filteredStocks.length - 50} பொருட்கள் உள்ளன
                    </div>
                  )}
                </div>
              </div>
            )}

            {availableStock && (
              <div className="grid-span-2" style={{ marginTop: '-8px', marginBottom: '8px', fontSize: '13px', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ color: 'var(--text-sub)' }}>
                  இருப்பில் உள்ளது: {' '}
                  <span 
                    style={{ cursor: 'pointer', background: 'rgba(197, 160, 94, 0.15)', color: 'var(--gold)', padding: '2px 6px', borderRadius: '4px', marginRight: '6px', fontWeight: 600 }}
                    onClick={() => {
                      const defTot = calculateDefaultTotal(availableStock.category, availableStock.weight);
                      setFormData({ ...formData, weight: availableStock.weight.toString(), itemTotal: defTot });
                    }}
                  >
                    {availableStock.weight}g
                  </span>
                  |{' '}
                  <span 
                    style={{ cursor: 'pointer', background: 'rgba(197, 160, 94, 0.15)', color: 'var(--gold)', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px', fontWeight: 600 }}
                    onClick={() => {
                      const defTot = calculateDefaultTotal(availableStock.category, availableStock.weight);
                      setFormData(prev => ({ ...prev, quantity: availableStock.quantity.toString(), weight: availableStock.weight.toString(), itemTotal: defTot }));
                    }}
                  >
                    {availableStock.quantity} pcs
                  </span>
                </span>
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  style={{ height: '24px', fontSize: '11px', padding: '0 8px', borderRadius: '4px' }}
                  onClick={() => {
                    const defTot = calculateDefaultTotal(availableStock.category, availableStock.weight);
                    setFormData(prev => ({ ...prev, weight: availableStock.weight.toString(), quantity: availableStock.quantity.toString(), itemTotal: defTot }));
                  }}
                >
                  இரண்டையும் போடு
                </button>
              </div>
            )}

            <div className="form-group">
              <label>விற்கப்படும் எடை (Weight g)</label>
              <input 
                type="number" 
                step="0.001" 
                placeholder="0.000"
                value={formData.weight} 
                onChange={e => {
                  const newWt = e.target.value;
                  const defTot = calculateDefaultTotal(formData.category, newWt);
                  setFormData({ ...formData, weight: newWt, itemTotal: defTot || formData.itemTotal });
                }} 
              />
            </div>
            <div className="form-group">
              <label>விற்கப்படும் எண்ணிக்கை (Qty)</label>
              <input 
                type="number" 
                placeholder="1"
                value={formData.quantity} 
                onChange={e => {
                  const q = parseInt(e.target.value || 0);
                  const w = availableStock ? (q * availableStock.weight) : 0;
                  const newWt = w > 0 ? w.toString() : formData.weight;
                  const defTot = calculateDefaultTotal(formData.category, newWt);
                  setFormData(prev => ({ 
                    ...prev, 
                    quantity: e.target.value,
                    weight: newWt,
                    itemTotal: defTot || prev.itemTotal
                  }));
                }} 
              />
            </div>
            <div className="form-group grid-span-2">
              <label>பொருளின் மொத்த தொகை (Item Total Amount ₹ - Optional)</label>
              <input 
                type="number" 
                step="0.01" 
                placeholder="0.00" 
                value={formData.itemTotal} 
                onChange={e => setFormData({ ...formData, itemTotal: e.target.value })} 
                style={{ borderColor: formData.itemTotal ? 'var(--gold)' : 'var(--border)', fontWeight: 700, fontSize: '15px', color: formData.itemTotal ? 'var(--gold)' : 'var(--text-main)' }}
              />
            </div>
            <div className="form-group grid-span-2">
              <label>பழைய வெள்ளி தொகை (Old Silver Amount ₹ - Optional)</label>
              <input 
                type="number" 
                step="0.01" 
                placeholder="0.00" 
                value={formData.oldSilverAmt} 
                onChange={e => setFormData({ ...formData, oldSilverAmt: e.target.value })} 
                style={{ borderColor: formData.oldSilverAmt ? 'var(--success)' : 'var(--border)', fontWeight: 600, color: formData.oldSilverAmt ? 'var(--success)' : 'var(--text-main)' }}
              />
            </div>
            <div className="form-group grid-span-2">
              <label>தள்ளுபடி தொகை (Discount Amount ₹ - Optional)</label>
              <input 
                type="number" 
                step="0.01" 
                placeholder="0.00" 
                value={formData.discountAmt} 
                onChange={e => setFormData({ ...formData, discountAmt: e.target.value })} 
                style={{ borderColor: formData.discountAmt ? 'var(--danger)' : 'var(--border)', fontWeight: 600, color: formData.discountAmt ? 'var(--danger)' : 'var(--text-main)' }}
              />
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

          {/* Today's Metal Rates on Right Side */}
          <div className="form-grid form-grid-2col mb-16">
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

          {/* Old Silver Trade-in */}
          <div style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border)', padding: '12px 14px', borderRadius: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
              <input 
                type="checkbox" 
                checked={includeOldSilver} 
                onChange={e => setIncludeOldSilver(e.target.checked)} 
                style={{ width: '18px', height: '18px', accentColor: 'var(--gold)', cursor: 'pointer', margin: 0 }}
              />
              <span>பழைய வெள்ளி கழிவு (Old Silver Trade-in Deduction)</span>
            </label>
            
            {includeOldSilver && (
              <div className="form-grid form-grid-2col" style={{ marginTop: '12px', gap: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '12px' }}>பழைய வெள்ளி எடை (Weight g)</label>
                  <input 
                    type="number" 
                    step="0.001" 
                    placeholder="எ.கா: 12.500"
                    value={oldSilverWeight} 
                    onChange={e => setOldSilverWeight(e.target.value)} 
                    style={{ height: '38px', fontSize: '13px' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '12px' }}>பழைய வெள்ளி தொகை (Amount ₹) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="எ.கா: 1500.00"
                    value={oldSilverAmount} 
                    onChange={e => setOldSilverAmount(e.target.value)} 
                    style={{ height: '38px', fontSize: '13px', borderColor: 'var(--gold)', color: 'var(--gold)', fontWeight: 700 }}
                  />
                </div>
              </div>
            )}
          </div>

          <div style={{ minHeight: '180px', border: '1px solid var(--border)', borderRadius: 10, padding: '10px', background: 'rgba(0,0,0,0.01)', overflowY: 'auto', marginBottom: '15px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-sub)' }}>பட்டியல் காலியாக உள்ளது</div>
            ) : (
              <table className="cart-table" style={{ width: '100%', fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>பொருள் (Item)</th>
                    <th style={{ textAlign: 'center', width: '120px' }}>எண்ணிக்கை | எடை</th>
                    <th style={{ width: '120px', textAlign: 'right' }}>தொகை (Total ₹)</th>
                    <th style={{ width: '35px' }}></th>
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
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.quantity} pcs | {item.weight}g</td>
                      <td style={{ textAlign: 'right' }}>
                        <input 
                          type="number" 
                          step="0.01" 
                          placeholder="Total ₹" 
                          value={item.total || ''} 
                          onChange={e => updateCartItemTotal(idx, e.target.value)}
                          style={{ width: '105px', height: '32px', textAlign: 'right', padding: '2px 8px', fontSize: '13px', fontWeight: 700, background: 'rgba(197, 160, 94, 0.1)', border: '1px solid var(--gold)', borderRadius: '6px', color: 'var(--gold)' }}
                          title="Click to edit total amount directly"
                        />
                      </td>
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
            <div style={{ margin: '15px 0', padding: '16px', background: 'rgba(212,175,55,0.04)', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '16px' }}>
              <div className="flex-between fw-600" style={{ fontSize: '13px', color: 'var(--text-sub)' }}>
                <span>மொத்த எண்ணிக்கை (Total Qty):</span><span>{cart.reduce((sum, item) => sum + (item.quantity || 0), 0)} pcs</span>
              </div>
              <div className="flex-between fw-600" style={{ fontSize: '13px', color: 'var(--text-sub)', marginTop: '4px' }}>
                <span>மொத்த எடை (Total Weight):</span><span>{cart.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0).toFixed(3)} g</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', margin: '10px 0' }} />
              <div className="flex-between fw-600" style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                <span>மொத்த மதிப்பு (Gross Total):</span><span>₹{grossTotal.toFixed(2)}</span>
              </div>
              {totalOldSilverDeduction > 0 && (
                <div className="flex-between fw-600" style={{ fontSize: '13px', color: 'var(--success)', marginTop: '4px' }}>
                  <span>பழைய வெள்ளி கழிவு {oldSilverWeight ? `(${oldSilverWeight}g)` : ''}:</span><span>- ₹{totalOldSilverDeduction.toFixed(2)}</span>
                </div>
              )}
              {totalDiscountDeduction > 0 && (
                <div className="flex-between fw-600" style={{ fontSize: '13px', color: 'var(--danger)', marginTop: '4px' }}>
                  <span>தள்ளுபடி (Discount):</span><span>- ₹{totalDiscountDeduction.toFixed(2)}</span>
                </div>
              )}
              <div style={{ borderTop: '2px solid var(--border)', margin: '10px 0' }} />
              <div className="flex-between fw-700" style={{ fontSize: '18px', color: 'var(--gold)' }}>
                <span>நிகர மதிப்பு (Net Pay):</span>
                <span>₹{netTotal.toFixed(2)}</span>
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
