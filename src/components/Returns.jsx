import React, { useState } from 'react'
import { RotateCcw, CheckCircle, Package } from 'lucide-react'

const Returns = ({ products = [], sales = [], returns = [], onAddReturn }) => {
  const [form, setForm] = useState({ saleId: '', productId: '', qty: '', weight: '', reason: '', refund: '' })
  const [success, setSuccess] = useState('')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // Compute sale details for selection
  const soldItemsList = sales.map(s => ({
    id: s.id,
    billId: s.billId || 'No Bill',
    label: `${s.billId || 'Walk-in'} — ${s.variant} (${s.category})`,
    productId: s.productId,
    maxQty: s.quantity || 0,
    maxWeight: parseFloat(s.weight || 0),
    saleId: s.billId,
    customer: s.customerName
  }))

  const handleSubmit = e => {
    e.preventDefault()
    if (!form.productId || !form.reason) return
    
    // Find the original product to get details
    const product = products.find(p => p.id === parseInt(form.productId))
    const pCode = product ? `${product.variant} - ${product.category}` : `ID: ${form.productId}`
    
    const id = `RET-${String(returns.length + 1).padStart(3, '0')}`
    const ret = {
      id, 
      date: new Date().toISOString().slice(0, 10),
      saleId: form.saleId.trim(),
      productId: parseInt(form.productId),
      productCode: pCode,
      qty: parseInt(form.qty) || 0,
      weight: parseFloat(form.weight) || 0,
      reason: form.reason.trim(),
      refund: parseFloat(form.refund) || 0,
    }
    
    onAddReturn(ret)
    setSuccess(`Return processed successfully (${id})`)
    setForm({ saleId: '', productId: '', qty: '', weight: '', reason: '', refund: '' })
    setTimeout(() => setSuccess(''), 5000)
  }

  return (
    <div className="animate-fade-in">
      <div className="flex-between mb-16">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>திரும்பப் பெறல்</h2>
          <p className="text-sub">Process customer returns and refunds</p>
        </div>
        <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
          <RotateCcw size={24} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', alignItems: 'start' }}>
        {/* Form */}
        <div className="card">
          <div className="card-title">பொருள் திரும்பப் பெறுதல் (Return Entry)</div>
          
          {success && (
            <div className="toast-success">
              <CheckCircle size={18} /> {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>விற்பனை குறிப்பு (Sale Reference)</label>
              <select value={form.saleId} onChange={e => {
                const s = soldItemsList.find(x => x.id === e.target.value)
                if (s) {
                  setForm({ ...form, saleId: s.billId, productId: s.productId.toString(), qty: s.maxQty.toString(), weight: s.maxWeight.toString() })
                } else {
                  set('saleId', e.target.value)
                }
              }}>
                <option value="">— Select Previous Sale —</option>
                {soldItemsList.map(s => (
                  <option key={s.id} value={s.id}>{s.label} ({s.customer})</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>பொருள் (Product) <span style={{ color: '#EF4444' }}>*</span></label>
              <select value={form.productId} onChange={e => set('productId', e.target.value)} required>
                <option value="">— Select Product —</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.variant} ({p.category})</option>)}
              </select>
            </div>

            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div className="form-group">
                <label>திரும்பும் எண்ணிக்கை (Qty)</label>
                <input type="number" min="0" value={form.qty} onChange={e => set('qty', e.target.value)} placeholder="0" />
              </div>
              <div className="form-group">
                <label>திரும்பும் எடை (Weight g)</label>
                <input type="number" step="0.001" min="0" value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="0.000" />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>காரணம் (Reason) <span style={{ color: '#EF4444' }}>*</span></label>
              <select value={form.reason} onChange={e => set('reason', e.target.value)} required>
                <option value="">— Select Reason —</option>
                <option value="குறைபாடு">குறைபாடு (Defective)</option>
                <option value="சேதம்">சேதம் (Damaged)</option>
                <option value="அளவு பொருந்தவில்லை">அளவு பொருந்தவில்லை (Size Issue)</option>
                <option value="வேறு காரணம்">வேறு காரணம் (Other)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label>திரும்ப வழங்கும் தொகை (Refund ₹)</label>
              <input type="number" min="0" value={form.refund} onChange={e => set('refund', e.target.value)} placeholder="0.00" />
            </div>

            <button type="submit" className="btn btn-sell btn-lg btn-full">
              <RotateCcw size={18} /> திரும்பப் பதிவு செய் (Process Return)
            </button>
          </form>
        </div>

        {/* Returns Table */}
        <div className="card">
          <div className="card-title">திரும்பப்பெற்ற வரலாறு (Returns History)</div>
          
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Return ID</th>
                  <th>Product</th>
                  <th style={{ textAlign: 'right' }}>Qty | Wt</th>
                  <th>Reason</th>
                  <th style={{ textAlign: 'right' }}>Refund</th>
                  <th style={{ textAlign: 'right' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {returns.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 'bold', fontSize: '13px' }}>{r.id}</td>
                    <td>
                      <div className="fw-600">{r.productCode}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>{r.saleId ? `Ref: ${r.saleId}` : ''}</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>{r.qty} pcs | {r.weight}g</td>
                    <td style={{ color: '#EF4444' }}>{r.reason}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--gold)' }}>
                      ₹{(r.refund || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'right', fontSize: '13px', color: 'var(--text-sub)' }}>
                      {r.date}
                    </td>
                  </tr>
                ))}
                {returns.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-sub)' }}>
                      <Package size={30} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                      திரும்பப்பெற்ற பொருட்கள் இல்லை (No Returns found)
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

export default Returns
