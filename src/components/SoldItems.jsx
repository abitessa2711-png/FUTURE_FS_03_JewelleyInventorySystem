import React, { useState } from 'react'
import { Receipt, Search, User, Trash2, ChevronDown, ChevronRight, Calendar, Edit3, X, Check, MessageCircle, ShieldCheck } from 'lucide-react'
import BillModal, { generateWhatsAppBillText } from './BillModal'
import GstAuditPurgeModal from './GstAuditPurgeModal'

const SoldItems = ({ soldItems = [], onDelete, onUpdateDate, onPurgeSales, role = 'admin' }) => {
  const [selectedBill, setSelectedBill] = useState(null)
  const [editingBill, setEditingBill] = useState(null)
  const [editDateValue, setEditDateValue] = useState('')
  const [isUpdatingDate, setIsUpdatingDate] = useState(false)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')
  const [expandedBills, setExpandedBills] = useState({})
  const [showGstModal, setShowGstModal] = useState(false)

  const toggleExpand = (billId) => {
    setExpandedBills(prev => ({ ...prev, [billId]: !prev[billId] }))
  }

  // 1. Group sales by billId so multi-item purchases appear as ONE single bill transaction
  const groupedMap = {}
  soldItems.forEach(item => {
    const billKey = item.billId || `SINGLE-${item.id}`
    if (!groupedMap[billKey]) {
      groupedMap[billKey] = {
        billId: item.billId || `ID-${item.id}`,
        rawBillId: item.billId,
        id: item.id,
        customerName: item.customerName || 'Walk-in',
        mobile: item.mobile || '',
        date: item.date,
        items: [],
        totalQuantity: 0,
        totalWeight: 0,
        metadata: item.metadata || {}
      }
    }
    groupedMap[billKey].items.push(item)
    groupedMap[billKey].totalQuantity += (parseInt(item.quantity || 0) || 0)
    groupedMap[billKey].totalWeight += (parseFloat(item.weight || 0) || 0)
  })

  const billList = Object.values(groupedMap).map(b => {
    const meta = b.metadata || {}
    const itemsGross = b.items.reduce((sum, it) => sum + (parseFloat(it.total || 0) || 0), 0)
    const grossTotal = parseFloat(meta.overallBillTotal || 0) > 0 ? parseFloat(meta.overallBillTotal) : itemsGross
    const oldSilAmt = parseFloat(meta.oldSilverAmount || 0)
    const discAmt = parseFloat(meta.billDiscount || 0)
    const chitAmt = parseFloat(meta.chitAmount || 0)
    const netTotal = Math.max(0, grossTotal - oldSilAmt - discAmt - chitAmt)

    return {
      ...b,
      grossTotal,
      oldSilAmt,
      discAmt,
      chitAmt,
      netTotal
    }
  })

  // 2. Filter grouped bills
  const filtered = billList.filter(b => {
    const q = (search || '').trim().toLowerCase()
    const d = b.date ? b.date.split('T')[0] : ''
    
    const matchQ = !q || 
      (b.customerName || '').toLowerCase().includes(q) ||
      (b.mobile || '').toLowerCase().includes(q) ||
      (b.billId || '').toLowerCase().includes(q) ||
      b.items.some(it => 
        (it.variant || '').toLowerCase().includes(q) || 
        (it.category || '').toLowerCase().includes(q) || 
        (it.detail || '').toLowerCase().includes(q)
      )

    const matchFrom = !dateFrom || d >= dateFrom
    const matchTo   = !dateTo   || d <= dateTo
    return matchQ && matchFrom && matchTo
  }).slice().reverse()

  const totalQuantity = filtered.reduce((s, i) => s + (i.totalQuantity || 0), 0)
  const totalWeight = filtered.reduce((s, i) => s + (parseFloat(i.totalWeight || 0) || 0), 0)
  const totalAmount = filtered.reduce((s, i) => s + (parseFloat(i.netTotal || 0) || 0), 0)

  const handleViewBill = (b) => {
    setSelectedBill({
      id: b.rawBillId || b.billId,
      customerName: b.customerName,
      mobile: b.mobile,
      date: b.date,
      items: b.items,
      metadata: b.metadata
    })
  }

  const handleOpenEditDate = (b) => {
    setEditingBill(b)
    try {
      const d = b.date ? new Date(b.date) : new Date()
      // format as YYYY-MM-DDTHH:mm
      const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      setEditDateValue(localIso)
    } catch(e) {
      setEditDateValue(new Date().toISOString().slice(0, 16))
    }
  }

  const handleSaveDate = async () => {
    if (!editingBill || !editDateValue || !onUpdateDate) return
    setIsUpdatingDate(true)
    try {
      const itemIds = (editingBill.items || []).map(it => it.id).filter(Boolean)
      await onUpdateDate(editingBill.rawBillId || editingBill.billId || editingBill.id, editDateValue, itemIds)
      setEditingBill(null)
    } finally {
      setIsUpdatingDate(false)
    }
  }

  const handleDirectWhatsApp = (b) => {
    let cleanPhone = (b.mobile || '').replace(/[^0-9]/g, '')
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone
    }

    const billMsg = generateWhatsAppBillText({
      id: b.rawBillId || b.billId,
      customerName: b.customerName,
      mobile: b.mobile,
      date: b.date,
      items: b.items,
      metadata: b.metadata
    })

    const encoded = encodeURIComponent(billMsg)
    const waUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`

    window.open(waUrl, '_blank')
  }

  return (
    <div className="animate-fade-in">
      <div className="flex-between mb-16" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>விற்பனை வரலாறு (Sales Bills)</h2>
          <p className="text-sub">
            {filtered.length} பில்கள் (Bills) · 
            மொத்த எண்ணிக்கை: {totalQuantity} pcs · 
            மொத்த எடை: {Number(totalWeight).toFixed(3)}g · 
            மொத்த வசூல்: ₹{Number(totalAmount).toFixed(2)}
          </p>
        </div>

        {(role === 'admin' || role === 'auditor') && (
          <button 
            className="btn btn-gold" 
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px' }}
            onClick={() => setShowGstModal(true)}
            title="Sales Backup PDF & Permanent Purge"
          >
            <ShieldCheck size={16} />
            <span>பேக்கப் & நிரந்தர நீக்கம் (Sales Backup)</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div className="flex" style={{ gap: 12, flexWrap: 'wrap' }}>
          <div className="flex" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '0 12px', flex: 1, minWidth: 200 }}>
            <Search size={14} color="var(--text-sub)" />
            <input
              type="text"
              placeholder="Search customer, bill no, product..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', height: 38, background: 'transparent', flex: 1 }}
            />
          </div>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ height: 40, width: 160 }} />
          <input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   style={{ height: 40, width: 160 }} />
          {(search || dateFrom || dateTo) && (
            <button className="btn btn-ghost" onClick={() => { setSearch(''); setDateFrom(''); setDateTo('') }}>Clear</button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '12px 14px' }}>
        <div className="table-wrap">
          <table className="sold-items-table" style={{ width: '100%', tableLayout: 'auto', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ width: '32px', padding: '8px 4px', textAlign: 'center' }}>#</th>
                <th style={{ width: '85px', padding: '8px 6px' }}>தேதி (Date)</th>
                <th style={{ width: '110px', padding: '8px 6px' }}>வாடிக்கையாளர் / பில்</th>
                <th style={{ padding: '8px 6px' }}>விற்ற பொருட்கள் (Items)</th>
                <th style={{ textAlign: 'center', width: '65px', padding: '8px 4px' }}>எண்ணிக்கை</th>
                <th style={{ textAlign: 'right', width: '85px', padding: '8px 6px' }}>மொத்த எடை</th>
                <th style={{ textAlign: 'right', width: '105px', padding: '8px 6px' }}>நிகர தொகை</th>
                <th style={{ width: '90px', textAlign: 'center', padding: '8px 4px' }}>செயல்கள்</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => {
                const isExpanded = !!expandedBills[b.billId]
                return (
                  <React.Fragment key={b.billId || i}>
                    <tr style={{ background: isExpanded ? 'rgba(212,175,55,0.03)' : 'transparent', borderBottom: '1px solid var(--border)' }}>
                      <td style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-sub)', textAlign: 'center', padding: '8px 4px' }}>{i + 1}</td>
                      <td style={{ fontSize: 11, color: 'var(--text-sub)', whiteSpace: 'nowrap', padding: '8px 6px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{b.date ? new Date(b.date).toLocaleDateString('en-IN') : '—'}</div>
                        <div style={{ fontSize: 10, opacity: 0.75 }}>
                          {b.date ? new Date(b.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </td>
                      <td style={{ padding: '8px 6px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '11px', letterSpacing: '0.2px' }}>
                          {b.rawBillId || b.billId}
                        </div>
                        <div className="fw-600" style={{ fontSize: '12px', marginTop: '1px' }}>{b.customerName || 'Walk-in'}</div>
                        {b.mobile && <div style={{ fontSize: 10, color: 'var(--text-sub)' }}>Ph: {b.mobile}</div>}
                      </td>
                      <td style={{ padding: '8px 6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {b.items.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => toggleExpand(b.billId)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--gold)' }}
                            >
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          )}
                          <div style={{ fontSize: '12px', lineHeight: '1.3' }}>
                            {b.items.length === 1 ? (
                              <span>
                                <strong style={{ color: 'var(--text-main)' }}>{b.items[0].variant || b.items[0].subcategory}</strong>
                                <span style={{ fontSize: '10px', color: 'var(--text-sub)', marginLeft: '3px' }}>
                                  ({b.items[0].category})
                                </span>
                              </span>
                            ) : (
                              <span style={{ cursor: 'pointer' }} onClick={() => toggleExpand(b.billId)}>
                                <strong style={{ color: 'var(--gold)' }}>{b.items.length} பொருட்கள்</strong>: {b.items.map(it => it.variant || it.subcategory).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600, fontSize: '12px', padding: '8px 4px' }}>{b.totalQuantity} pcs</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--gold)', fontSize: '12px', padding: '8px 6px' }}>
                        {Number(b.totalWeight).toFixed(3)}g
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)', fontSize: '13px', padding: '8px 6px' }}>
                        ₹{Number(b.netTotal).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px 4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '3px' }}>
                          <button
                            className="btn btn-secondary-ghost"
                            style={{ padding: '3px', minWidth: '26px', height: '26px' }}
                            onClick={() => handleViewBill(b)}
                            title="பில் காண்க / அச்சிடு / WhatsApp அனுப்பு (View / Print / WhatsApp Bill)"
                          >
                            <Receipt size={13} />
                          </button>
                          
                          {/* Edit Date Button */}
                          <button
                            className="btn btn-secondary-ghost"
                            style={{ padding: '3px', minWidth: '26px', height: '26px', color: 'var(--gold)' }}
                            onClick={() => handleOpenEditDate(b)}
                            title="தேதியை மாற்று (Change / Edit Bill Date)"
                          >
                            <Calendar size={13} />
                          </button>

                          {(role === 'admin' || role === 'auditor') && (
                            <button
                              className="btn btn-danger-ghost"
                              style={{ padding: '3px', minWidth: '26px', height: '26px' }}
                              onClick={() => {
                                if (window.confirm(`இந்த பில்லை (${b.rawBillId || b.billId}) நீக்க வேண்டுமா? இதில் உள்ள ${b.items.length} பொருட்களும் மீண்டும் இருப்பில் சேர்க்கப்படும்.`)) {
                                  onDelete(b.rawBillId || b.id)
                                }
                              }}
                              title="Delete Bill"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expandable sub-items if multiple items in bill */}
                    {isExpanded && b.items.length > 1 && (
                      <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <td colSpan={9} style={{ padding: '8px 16px 12px 48px' }}>
                          <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', background: 'rgba(0,0,0,0.1)' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-sub)', marginBottom: '4px' }}>பொருட்கள் பட்டியல் (Items in this Bill):</div>
                            <table style={{ width: '100%', fontSize: '12px' }}>
                              <thead>
                                <tr style={{ color: 'var(--text-sub)', borderBottom: '1px solid var(--border)' }}>
                                  <th style={{ textAlign: 'left', padding: '4px 0' }}>பொருள்</th>
                                  <th style={{ textAlign: 'left', padding: '4px 0' }}>பிரிவு</th>
                                  <th style={{ textAlign: 'center', padding: '4px 0' }}>எண்ணிக்கை</th>
                                  <th style={{ textAlign: 'right', padding: '4px 0' }}>எடை (g)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {b.items.map((it, idx) => (
                                  <tr key={idx} style={{ borderBottom: '1px dashed rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '4px 0', fontWeight: 600 }}>{it.variant || it.subcategory} {it.detail ? `· ${it.detail}` : ''}</td>
                                    <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>{it.category}</td>
                                    <td style={{ textAlign: 'center', padding: '4px 0' }}>{it.quantity} pcs</td>
                                    <td style={{ textAlign: 'right', padding: '4px 0', fontWeight: 600, color: 'var(--gold)' }}>{parseFloat(it.weight || 0).toFixed(3)}g</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-sub)' }}>
                    விற்பனைப் பதிவுகள் எதுவும் இல்லை
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Date Modal */}
      {editingBill && (
        <div 
          className="modal-overlay" 
          onClick={() => setEditingBill(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div 
            className="modal-content animate-fade-in" 
            onClick={e => e.stopPropagation()}
            style={{ width: '440px', maxWidth: '100%', background: 'var(--card-bg, #1a1a24)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}
          >
            <div className="flex-between mb-16">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="var(--gold)" />
                <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--text-main)' }}>பில் தேதி திருத்துதல் (Edit Sale Date)</h3>
              </div>
              <button className="btn btn-ghost" style={{ padding: '4px', height: 'auto' }} onClick={() => setEditingBill(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '16px', fontSize: '13px' }}>
              <div style={{ color: 'var(--text-sub)', fontSize: '11px' }}>பில் எண் (Bill ID): <strong style={{ color: 'var(--gold)' }}>{editingBill.rawBillId || editingBill.billId}</strong></div>
              <div style={{ marginTop: '2px', color: 'var(--text-main)' }}>வாடிக்கையாளர்: <strong>{editingBill.customerName}</strong></div>
              <div style={{ marginTop: '2px', color: 'var(--text-sub)', fontSize: '12px' }}>தற்போதைய தேதி: {editingBill.date ? new Date(editingBill.date).toLocaleString('en-IN') : '—'}</div>
            </div>

            <div className="form-group mb-16">
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gold)' }}>புதிய விற்பனை தேதி & நேரம் (New Date & Time):</label>
              <input 
                type="datetime-local" 
                value={editDateValue} 
                onChange={e => setEditDateValue(e.target.value)} 
                style={{ height: '42px', fontSize: '15px', fontWeight: 600, marginTop: '6px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button 
                type="button" 
                className="btn btn-ghost" 
                style={{ fontSize: '11px', padding: '4px 8px', height: 'auto' }}
                onClick={() => {
                  const now = new Date()
                  const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                  setEditDateValue(localIso)
                }}
              >
                இன்றைய தேதி (Now)
              </button>
              <button 
                type="button" 
                className="btn btn-ghost" 
                style={{ fontSize: '11px', padding: '4px 8px', height: 'auto' }}
                onClick={() => {
                  const yest = new Date(Date.now() - 86400000)
                  const localIso = new Date(yest.getTime() - yest.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                  setEditDateValue(localIso)
                }}
              >
                நேற்றைய தேதி (Yesterday)
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => setEditingBill(null)} disabled={isUpdatingDate}>
                ரத்து (Cancel)
              </button>
              <button className="btn btn-gold" onClick={handleSaveDate} disabled={isUpdatingDate || !editDateValue}>
                {isUpdatingDate ? 'சேமிக்கப்படுகிறது...' : 'தேதியை மாற்று (Save Date)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGstModal && (
        <GstAuditPurgeModal 
          soldItems={soldItems} 
          onPurgeSales={onPurgeSales} 
          onClose={() => setShowGstModal(false)} 
          role={role} 
        />
      )}

      {selectedBill && (
        <BillModal bill={selectedBill} onClose={() => setSelectedBill(null)} />
      )}
    </div>
  )
}

export default SoldItems
