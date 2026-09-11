import React, { useState, useMemo } from 'react'
import { X, FileText, Download, Trash2, AlertTriangle, ShieldCheck, Calendar } from 'lucide-react'

const GstAuditPurgeModal = ({ soldItems = [], onPurgeSales, onClose, role }) => {
  const todayStr = new Date().toISOString().split('T')[0]
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState(todayStr)
  const [isPdfDownloaded, setIsPdfDownloaded] = useState(false)
  const [showConfirmPurge, setShowConfirmPurge] = useState(false)
  const [confirmInputText, setConfirmInputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [purgeSuccess, setPurgeSuccess] = useState(false)

  // Group soldItems by billId for the selected date range
  const matchingBills = useMemo(() => {
    if (!dateFrom && !dateTo) return []
    const groups = {}
    soldItems.forEach(item => {
      if (!item.date) return
      const itemDateStr = item.date.split('T')[0]
      if (dateFrom && itemDateStr < dateFrom) return
      if (dateTo && itemDateStr > dateTo) return
      const key = item.billId || item.rawBillId || `SINGLE-${item.id}`
      if (!groups[key]) {
        groups[key] = {
          billId: key,
          rawBillId: item.billId || item.rawBillId,
          customerName: item.customerName,
          mobile: item.mobile,
          date: item.date,
          items: [],
          totalQuantity: 0,
          totalWeight: 0,
          netTotal: 0
        }
      }
      groups[key].items.push(item)
      groups[key].totalQuantity += parseInt(item.quantity || 0, 10)
      groups[key].totalWeight += parseFloat(item.weight || 0)
      groups[key].netTotal += parseFloat(item.total || 0)
    })
    return Object.values(groups)
  }, [soldItems, dateFrom, dateTo])

  const totalBillsCount  = matchingBills.length
  const totalPcsCount    = matchingBills.reduce((s, b) => s + b.totalQuantity, 0)
  const totalWeightGrams = matchingBills.reduce((s, b) => s + b.totalWeight, 0)
  const totalWeightKg    = totalWeightGrams / 1000
  const totalRevenue     = matchingBills.reduce((s, b) => s + b.netTotal, 0)

  const fmtDate = (dStr) => {
    if (!dStr) return '—'
    try {
      const d = new Date(dStr)
      return d.toLocaleDateString('en-IN') + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    } catch { return dStr }
  }

  // ── Step 1: Download PDF as actual file ──────────────────────────────────
  const handleDownloadPdf = () => {
    if (matchingBills.length === 0) return

    const rowsHtml = matchingBills.map((b, idx) => {
      const itemsStr = b.items.map(it => `${it.variant || it.subcategory || it.category} (${it.weight}g)`).join(', ')
      return `<tr style="border-bottom:1px solid #e2e8f0;font-size:11px;">
        <td style="padding:6px;text-align:center;">${idx + 1}</td>
        <td style="padding:6px;white-space:nowrap;">${fmtDate(b.date)}</td>
        <td style="padding:6px;font-weight:bold;">${b.rawBillId || b.billId}</td>
        <td style="padding:6px;"><div style="font-weight:600;">${b.customerName || 'Walk-in'}</div>${b.mobile ? `<div style="font-size:10px;color:#64748b;">${b.mobile}</div>` : ''}</td>
        <td style="padding:6px;">${itemsStr}</td>
        <td style="padding:6px;text-align:center;">${b.totalQuantity} pcs</td>
        <td style="padding:6px;text-align:right;font-weight:bold;">${b.totalWeight.toFixed(3)}g</td>
        <td style="padding:6px;text-align:right;font-weight:bold;color:#047857;">₹${b.netTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      </tr>`
    }).join('')

    const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>Sales Backup Report (${dateFrom || 'Start'} to ${dateTo || 'Today'})</title>
      <style>
        body{font-family:'Segoe UI',sans-serif;padding:20px;color:#0f172a;margin:0;}
        .hdr{border-bottom:2px solid #b45309;padding-bottom:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-end;}
        .title{font-size:22px;font-weight:bold;color:#b45309;margin:0;}
        .sub{font-size:12px;color:#64748b;margin-top:4px;}
        .summary-card{background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-bottom:20px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;}
        .stat-box{text-align:center;}
        .stat-lbl{font-size:11px;text-transform:uppercase;color:#78350f;font-weight:600;}
        .stat-val{font-size:18px;font-weight:bold;color:#92400e;margin-top:2px;}
        table{width:100%;border-collapse:collapse;margin-bottom:20px;}
        th{background:#f1f5f9;text-align:left;padding:8px 6px;font-size:11px;text-transform:uppercase;border-bottom:2px solid #cbd5e1;}
        .footer{border-top:1px solid #e2e8f0;padding-top:16px;font-size:11px;color:#64748b;display:flex;justify-content:space-between;margin-top:30px;}
        @media print{body{padding:0;}}
      </style></head><body>
      <div class="hdr">
        <div>
          <h1 class="title">TAS JEWELLERS</h1>
          <div class="sub">SALES BACKUP & ARCHIVE REPORT</div>
        </div>
        <div style="text-align:right;font-size:11px;">
          <div><strong>Period:</strong> ${dateFrom || 'Start'} to ${dateTo || 'Today'}</div>
          <div><strong>Generated:</strong> ${new Date().toLocaleString('en-IN')}</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="stat-box"><div class="stat-lbl">Total Bills</div><div class="stat-val">${totalBillsCount}</div></div>
        <div class="stat-box"><div class="stat-lbl">Total Qty</div><div class="stat-val">${totalPcsCount} pcs</div></div>
        <div class="stat-box"><div class="stat-lbl">Total Weight (g)</div><div class="stat-val">${totalWeightGrams.toFixed(3)} g</div></div>
        <div class="stat-box" style="border-left:2px dashed #f59e0b;padding-left:16px;">
          <div class="stat-lbl" style="color:#b45309;">Total Weight (KG)</div>
          <div class="stat-val" style="color:#b45309;font-size:20px;">${totalWeightKg.toFixed(3)} kg</div>
        </div>
        <div class="stat-box"><div class="stat-lbl">Total Revenue</div><div class="stat-val" style="color:#047857;">₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div></div>
      </div>
      <table><thead><tr>
        <th style="width:30px;text-align:center;">#</th>
        <th>Date & Time</th><th>Bill ID</th><th>Customer</th>
        <th>Items Sold</th>
        <th style="text-align:center;">Qty</th>
        <th style="text-align:right;">Weight</th>
        <th style="text-align:right;">Amount</th>
      </tr></thead><tbody>${rowsHtml}</tbody></table>
      <div class="footer">
        <div>Verified Sales Backup Report</div>
        <div>Authorized Signature & Stamp: ______________________</div>
      </div>
    </body></html>`

    // Download as actual .html file (opens in browser / can save as PDF)
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `TAS_SalesBackup_${dateFrom || 'All'}_to_${dateTo || 'Today'}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setIsPdfDownloaded(true)
  }

  // ── Step 2: Permanent Purge ───────────────────────────────────────────────
  const handleExecutePurge = async () => {
    if (confirmInputText.trim().toUpperCase() !== 'PURGE') {
      alert("உறுதிப்படுத்த 'PURGE' என டைப் செய்யவும்.")
      return
    }
    if (matchingBills.length === 0) return

    setIsProcessing(true)
    try {
      const itemIdsToPurge = []
      const billIdsToPurge = []

      matchingBills.forEach(b => {
        if (b.rawBillId) billIdsToPurge.push(b.rawBillId)
        if (b.billId && b.billId !== b.rawBillId) billIdsToPurge.push(b.billId)
        b.items.forEach(it => {
          if (it.id !== undefined && it.id !== null) {
            itemIdsToPurge.push(it.id)
            if (!isNaN(Number(it.id))) itemIdsToPurge.push(Number(it.id))
            itemIdsToPurge.push(String(it.id))
          }
        })
      })

      const success = await onPurgeSales(
        [...new Set(itemIdsToPurge)],
        [...new Set(billIdsToPurge)]
      )
      if (success) {
        setPurgeSuccess(true)
        setShowConfirmPurge(false)
        setTimeout(() => onClose(), 1500)
      }
    } catch (err) {
      console.error('Purge error:', err)
      alert('பிழை ஏற்பட்டது: ' + err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content card animate-fade-in" style={{ maxWidth: 680, width: '95%', padding: '24px 28px' }}>

        {/* Header */}
        <div className="flex-between mb-16" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: 8, background: 'rgba(212,175,55,0.12)', borderRadius: 8, color: 'var(--gold)' }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--gold)' }}>
                விற்பனை காப்பகம் & பேக்கப் (Sales Archive & Backup Purge)
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-sub)', margin: '2px 0 0 0' }}>
                Download sales backup file & permanently remove records without restoring stock.
              </p>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: 6 }}><X size={18} /></button>
        </div>

        {/* Date Range */}
        <div className="card" style={{ background: 'var(--bg)', padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={15} color="var(--gold)" />
            தேதி வரம்பைத் தேர்ந்தெடுக்கவும் (Select Date Range):
          </div>
          <div className="flex" style={{ gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 150 }}>
              <label style={{ fontSize: 11, color: 'var(--text-sub)', display: 'block', marginBottom: 4 }}>From Date:</label>
              <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setIsPdfDownloaded(false) }} style={{ width: '100%', height: 38 }} />
            </div>
            <div style={{ flex: 1, minWidth: 150 }}>
              <label style={{ fontSize: 11, color: 'var(--text-sub)', display: 'block', marginBottom: 4 }}>To Date:</label>
              <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setIsPdfDownloaded(false) }} style={{ width: '100%', height: 38 }} />
            </div>
          </div>
        </div>

        {/* Summary */}
        {matchingBills.length > 0 ? (
          <div style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: 12 }}>
              📊 தேர்ந்தெடுக்கப்பட்ட விற்பனை விபரம் (Sales Summary)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>மொத்த பில்கள்</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{totalBillsCount} Bills</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>மொத்த பொருட்கள்</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{totalPcsCount} pcs</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>மொத்த எடை (g)</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}>{totalWeightGrams.toFixed(3)} g</div>
              </div>
              <div style={{ background: 'rgba(212,175,55,0.12)', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--gold)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)' }}>TOTAL (KG)</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--gold)' }}>{totalWeightKg.toFixed(3)} kg</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>மொத்த வசூல்</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--success)' }}>₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-sub" style={{ padding: '24px 0', fontSize: 13 }}>
            தேர்ந்தெடுக்கப்பட்ட தேதி வரம்பில் விற்பனைப் பதிவுகள் எதுவும் இல்லை.
          </div>
        )}

        {/* Action Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Step 1: Download */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={16} color="var(--gold)" />
                படி 1: விற்பனை பேக்கப் கோப்பை பதிவிறக்கவும்
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: 2 }}>
                HTML file download aagum — browser-la open panitu Print → Save as PDF seyalaam.
              </div>
            </div>
            <button
              className="btn btn-gold"
              onClick={handleDownloadPdf}
              disabled={matchingBills.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px' }}
            >
              <Download size={15} />
              {isPdfDownloaded ? '🔄 மீண்டும் பதிவிறக்கு' : '⬇️ Download Backup File'}
            </button>
          </div>

          {/* Step 2: Purge */}
          <div style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.04)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Trash2 size={16} />
                படி 2: விற்பனைப் பதிவுகளை நிரந்தரமாக நீக்குதல்
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: 2 }}>
                ⚠️ இந்த விற்பனைப் பதிவுகள் நிரந்தரமாக நீக்கப்படும். <strong>சரக்கு இருப்பில் மீண்டும் சேர்க்கப்படாது.</strong>
              </div>
            </div>
            <button
              className="btn btn-danger"
              onClick={() => setShowConfirmPurge(true)}
              disabled={matchingBills.length === 0 || purgeSuccess}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px' }}
            >
              <Trash2 size={15} />
              {purgeSuccess ? '✅ நீக்கப்பட்டது!' : 'நிரந்தரமாக நீக்கு'}
            </button>
          </div>
        </div>

        {/* Confirm Purge Modal */}
        {showConfirmPurge && (
          <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-content card animate-fade-in" style={{ maxWidth: 480, padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--danger)', marginBottom: 12 }}>
                <AlertTriangle size={24} />
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>நிரந்தர நீக்கத்தை உறுதிப்படுத்தவும்!</h3>
              </div>
              <div style={{ fontSize: 13, lineHeight: '1.6', marginBottom: 16 }}>
                நீங்கள் தேர்ந்தெடுத்த <strong>{totalBillsCount} பில்கள் ({totalWeightKg.toFixed(3)} kg)</strong> நிரந்தரமாக நீக்கப்படும்.
                <br /><br />
                <strong style={{ color: 'var(--gold)' }}>⚠️ இந்த பொருட்கள் சரக்கு இருப்பில் (Stock) திரும்ப சேர்க்கப்படாது.</strong>
                <br /><br />
                உறுதிப்படுத்த கீழே <strong>PURGE</strong> என டைப் செய்யவும்:
              </div>
              <input
                type="text"
                placeholder="PURGE என டைப் செய்யவும்..."
                value={confirmInputText}
                onChange={e => setConfirmInputText(e.target.value)}
                style={{ width: '100%', height: 40, marginBottom: 18, textAlign: 'center', fontWeight: 700, letterSpacing: '2px', fontSize: 15 }}
                autoFocus
              />
              <div className="flex-between">
                <button className="btn btn-secondary" onClick={() => { setShowConfirmPurge(false); setConfirmInputText('') }} disabled={isProcessing}>
                  ரத்து (Cancel)
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleExecutePurge}
                  disabled={confirmInputText.trim().toUpperCase() !== 'PURGE' || isProcessing}
                >
                  {isProcessing ? 'நீக்கப்படுகிறது...' : 'ஆம், நிரந்தரமாக நீக்கு'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default GstAuditPurgeModal
