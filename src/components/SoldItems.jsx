import React, { useState } from 'react'
import { Receipt, Search, User, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import BillModal from './BillModal'

const SoldItems = ({ soldItems = [], onDelete, role = 'admin' }) => {
  const [selectedBill, setSelectedBill] = useState(null)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')
  const [expandedBills, setExpandedBills] = useState({})

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
    const netTotal = Math.max(0, grossTotal - oldSilAmt - discAmt)

    return {
      ...b,
      grossTotal,
      oldSilAmt,
      discAmt,
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

  return (
    <div className="animate-fade-in">
      <div className="flex-between mb-16">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>விற்பனை வரலாறு (Sales Bills)</h2>
          <p className="text-sub">
            {filtered.length} பில்கள் (Bills) · 
            மொத்த எண்ணிக்கை: {totalQuantity} pcs · 
            மொத்த எடை: {Number(totalWeight).toFixed(3)}g · 
            மொத்த வசூல்: ₹{Number(totalAmount).toFixed(2)}
          </p>
        </div>
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

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: '45px' }}>S.No</th>
                <th>தேதி (Date)</th>
                <th>பில் எண் (Bill ID)</th>
                <th>வாடிக்கையாளர் (Customer)</th>
                <th>விற்ற பொருட்கள் (Sold Items)</th>
                <th style={{ textAlign: 'center', width: '90px' }}>எண்ணிக்கை</th>
                <th style={{ textAlign: 'right', width: '110px' }}>மொத்த எடை</th>
                <th style={{ textAlign: 'right', width: '130px' }}>நிகர தொகை (Net Pay)</th>
                <th style={{ width: '90px', textAlign: 'center' }}>செயல்கள்</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => {
                const isExpanded = !!expandedBills[b.billId]
                return (
                  <React.Fragment key={b.billId || i}>
                    <tr style={{ background: isExpanded ? 'rgba(212,175,55,0.03)' : 'transparent' }}>
                      <td style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-sub)' }}>{i + 1}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-sub)', whiteSpace: 'nowrap' }}>
                        {b.date ? new Date(b.date).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)' }}>
                        {b.rawBillId || b.billId}
                      </td>
                      <td>
                        <div className="fw-600">{b.customerName || 'Walk-in'}</div>
                        {b.mobile && <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>{b.mobile}</div>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {b.items.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => toggleExpand(b.billId)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--gold)' }}
                            >
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          )}
                          <div style={{ fontSize: '13px' }}>
                            {b.items.length === 1 ? (
                              <span>
                                <strong>{b.items[0].variant || b.items[0].subcategory}</strong>
                                <span style={{ fontSize: '11px', color: 'var(--text-sub)', marginLeft: '4px' }}>
                                  ({b.items[0].category})
                                </span>
                              </span>
                            ) : (
                              <span style={{ cursor: 'pointer' }} onClick={() => toggleExpand(b.billId)}>
                                <strong>{b.items.length} பொருட்கள்</strong>: {b.items.map(it => it.variant || it.subcategory).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{b.totalQuantity} pcs</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--gold)' }}>
                        {Number(b.totalWeight).toFixed(3)}g
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)', fontSize: '14px' }}>
                        ₹{Number(b.netTotal).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                          <button
                            className="btn btn-secondary-ghost"
                            style={{ padding: '6px', minWidth: 'auto', height: '30px' }}
                            onClick={() => handleViewBill(b)}
                            title="பில் காண்க / அச்சிடு (View / Print Bill)"
                          >
                            <Receipt size={14} />
                          </button>
                          {(role === 'admin' || role === 'auditor') && (
                            <button
                              className="btn btn-danger-ghost"
                              style={{ padding: '6px', minWidth: 'auto', height: '30px' }}
                              onClick={() => {
                                if (window.confirm(`இந்த பில்லை (${b.rawBillId || b.billId}) நீக்க வேண்டுமா? இதில் உள்ள ${b.items.length} பொருட்களும் மீண்டும் இருப்பில் சேர்க்கப்படும்.`)) {
                                  onDelete(b.rawBillId || b.id)
                                }
                              }}
                              title="Delete Bill"
                            >
                              <Trash2 size={14} />
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

      {selectedBill && (
        <BillModal bill={selectedBill} onClose={() => setSelectedBill(null)} />
      )}
    </div>
  )
}

export default SoldItems
