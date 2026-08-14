import React, { useState } from 'react'
import logoImg from './logo.jpg'
import { Printer, X, MessageCircle, Send } from 'lucide-react'

const BillModal = ({ bill, onClose }) => {
  if (!bill) return null
  const items = bill.items || []
  const meta = bill.metadata || {}
  const [showPhonePrompt, setShowPhonePrompt] = useState(false)
  const [customPhone, setCustomPhone] = useState(() => (bill.mobile || '').replace(/[^0-9]/g, ''))
  
  // Calculate Totals
  const itemsSum = items.reduce((s, i) => s + (parseFloat(i.total) || 0), 0)
  const grossTotal = parseFloat(meta.overallBillTotal || 0) > 0 ? parseFloat(meta.overallBillTotal) : itemsSum
  const oldSilverAmount = parseFloat(meta.oldSilverAmount || 0)
  const oldSilverWeight = parseFloat(meta.oldSilverWeight || 0)
  const discountAmount = parseFloat(meta.billDiscount || 0)
  const netTotal = Math.max(0, grossTotal - oldSilverAmount - discountAmount)

  const sendWhatsApp = (targetPhone) => {
    let cleanPhone = (targetPhone || '').replace(/[^0-9]/g, '')
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone
    }

    const itemsText = items.map((it, idx) => {
      const name = it.variant || it.subcategory || it.category
      const detail = it.detail ? ` (${it.detail})` : ''
      return `${idx + 1}. *${name}*${detail}\n   ▫️ எடை: ${parseFloat(it.weight || 0).toFixed(3)}g | அளவு: ${it.quantity || 1} pcs`
    }).join('\n\n')

    let summaryText = `💰 *மொத்த மதிப்பு (Gross Total):* ₹${grossTotal.toFixed(2)}`
    if (oldSilverAmount > 0) {
      summaryText += `\n✨ *பழைய பொருள் கழிவு:* - ₹${oldSilverAmount.toFixed(2)}${oldSilverWeight > 0 ? ` (${oldSilverWeight}g)` : ''}`
    }
    if (discountAmount > 0) {
      summaryText += `\n🏷️ *தள்ளுபடி (Discount):* - ₹${discountAmount.toFixed(2)}`
    }
    summaryText += `\n💎 *நிகரத் தொகை (Net Pay):* *₹${netTotal.toFixed(2)}*`

    const formattedDate = bill.date ? new Date(bill.date).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')

    const message = 
`✨ *TAS JEWELLERS - விற்பனை ரசீது* ✨
85, திருத்தங்கல் ரோடு, சிவகாசி - 626123
📞 Ph: 9597258369, 7867807337
━━━━━━━━━━━━━━━━━━━━
🧾 *பில் எண் (Invoice No):* ${bill.id || 'N/A'}
📅 *தேதி (Date):* ${formattedDate}
👤 *வாடிக்கையாளர்:* ${bill.customerName || 'Walk-in'}
${bill.mobile ? `📱 *மொபைல்:* ${bill.mobile}` : ''}
━━━━━━━━━━━━━━━━━━━━
📦 *பொருட்கள் விவரம் (Items):*
${itemsText}
━━━━━━━━━━━━━━━━━━━━
${summaryText}
━━━━━━━━━━━━━━━━━━━━
🙏 *நன்றி! மீண்டும் வருக!*
_TAS JEWELLERS, Sivakasi_`

    const encodedMsg = encodeURIComponent(message)
    const url = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`
      : `https://api.whatsapp.com/send?text=${encodedMsg}`

    window.open(url, '_blank')
    setShowPhonePrompt(false)
  }

  const handleWhatsAppClick = () => {
    const rawMobile = (bill.mobile || '').replace(/[^0-9]/g, '')
    if (rawMobile.length >= 10) {
      sendWhatsApp(rawMobile)
    } else {
      setShowPhonePrompt(true)
    }
  }

  return (
    <div 
      className="modal-overlay no-print-overlay" 
      onClick={onClose}
      style={{ 
        position: 'fixed', 
        inset: 0, 
        backgroundColor: 'rgba(0, 0, 0, 0.75)', 
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto'
      }}
    >
      <div 
        className="modal-content print-bill-container" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          width: '800px', 
          maxWidth: '100%', 
          maxHeight: '94vh',
          background: '#ffffff', 
          color: '#0f172a', 
          borderRadius: '14px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        
        {/* Printable Card Area with smooth scrolling */}
        <div style={{ padding: '32px', background: '#ffffff', color: '#0f172a', overflowY: 'auto', flex: 1 }}>
          
          {/* Header containing Logo & Address */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #b45309', paddingBottom: '16px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img 
                src={logoImg} 
                alt="TAS Logo" 
                style={{ width: '70px', height: '70px', borderRadius: '50%', border: '2px solid #b45309', objectFit: 'cover' }} 
              />
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#92400e', margin: 0, letterSpacing: '0.5px' }}>TAS JEWELLERS</h2>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, letterSpacing: '1px' }}>AUTHENTIC GOLD & SILVER ORNAMENTS</div>
              </div>
            </div>
            
            <div style={{ textAlign: 'right', fontSize: '12px', lineHeight: '1.4', color: '#334155', fontWeight: 500 }}>
              <strong style={{ color: '#92400e', fontSize: '13px' }}>TAS JEWELLERS</strong><br />
              85, திருத்தங்கல் ரோடு<br />
              சிவகாசி - 626123 (தேவர் சிலை எதிரில்)<br />
              Ph: 9597258369, 7867807337
            </div>
          </div>

          {/* Customer / Invoice Details */}
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '14px 0', fontSize: '13px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '8px' }}>
            <div>
              <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '2px', fontWeight: 700 }}>INVOICE TO</div>
              <strong style={{ fontSize: '15px', color: '#0f172a' }}>{bill.customerName || 'Walk-in'}</strong>
              {bill.mobile && <div style={{ marginTop: '2px', color: '#64748b' }}>Ph: {bill.mobile}</div>}
            </div>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ color: '#334155' }}>பில் எண் (Invoice No): <strong style={{ color: '#0f172a' }}>{bill.id || 'N/A'}</strong></div>
              <div style={{ marginTop: '3px', color: '#334155' }}>தேதி (Date): <strong style={{ color: '#0f172a' }}>{bill.date ? new Date(bill.date).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')}</strong></div>
            </div>
          </div>

          {/* Today's Metal Rates */}
          {(parseFloat(meta.goldRate || 0) > 0 || parseFloat(meta.silverRate || 0) > 0) && (
            <div style={{ display: 'flex', gap: '20px', marginBottom: '14px', background: '#f8fafc', padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 600, color: '#334155' }}>
              {parseFloat(meta.goldRate || 0) > 0 && <div>🟡 இன்றைய தங்கம் விலை: <strong>₹{parseFloat(meta.goldRate).toFixed(2)}/g</strong></div>}
              {parseFloat(meta.silverRate || 0) > 0 && <div>⚪ இன்றைய வெள்ளி விலை: <strong>₹{parseFloat(meta.silverRate).toFixed(2)}/g</strong></div>}
            </div>
          )}

          {/* Items Table */}
          <div style={{ marginBottom: '20px', overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#334155' }}>
                  <th style={{ width: '45px', padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>வ.எண்</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>பொருள் விவரம் (Item Details)</th>
                  <th style={{ width: '90px', padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>எண்ணிக்கை</th>
                  <th style={{ width: '110px', padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>எடை (Weight)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{item.variant || item.subcategory}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>{item.category} {item.detail && ` · ${item.detail}`}</div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>{item.quantity || 1} pcs</td>
                    <td style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700, color: '#92400e' }}>{parseFloat(item.weight || 0).toFixed(3)}g</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Summary */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '10px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', width: '45%', lineHeight: '1.5' }}>
              <strong style={{ fontSize: '11px', color: '#0f172a' }}>விதிமுறைகள் (TERMS & CONDITIONS):</strong><br />
              1. விற்ற நகைகள் திரும்பப் பெறப்பட மாட்டாது.<br />
              2. அனைத்துப் பிணக்குகளும் சிவகாசி நீதிமன்ற எல்லைக்குட்பட்டவை.<br />
              3. 100% தூய தரம் உத்திரவாதம் அளிக்கப்படுகிறது.
            </div>
            
            <div style={{ width: '340px', background: '#f8fafc', padding: '14px 18px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569', marginBottom: '6px' }}>
                <span>மொத்த மதிப்பு (Gross Total):</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>₹{grossTotal.toFixed(2)}</span>
              </div>
              {oldSilverAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#16a34a', marginBottom: '6px' }}>
                  <span>பழைய பொருள் கழிவு {oldSilverWeight > 0 ? `(${oldSilverWeight}g)` : ''}:</span>
                  <span style={{ fontWeight: 700 }}>- ₹{oldSilverAmount.toFixed(2)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#dc2626', marginBottom: '6px' }}>
                  <span>தள்ளுபடி (Discount):</span>
                  <span style={{ fontWeight: 700 }}>- ₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ borderTop: '2px solid #cbd5e1', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '17px', fontWeight: 800, color: '#92400e' }}>
                <span>நிகரத் தொகை (Net Pay):</span>
                <span>₹{netTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '24px', color: '#64748b', fontSize: '11px', fontWeight: 700 }}>
            நன்றி! மீண்டும் வருக — THANK YOU!
          </div>
        </div>

        {/* Action Buttons - Hidden during printing */}
        <div className="flex no-print" style={{ justifyContent: 'center', flexWrap: 'wrap', gap: '10px', padding: '14px', background: '#f1f5f9', borderTop: '1px solid #e2e8f0' }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ minWidth: '90px', color: '#475569', borderColor: '#cbd5e1' }}>
            மூடு (Close)
          </button>

          {/* WhatsApp Bill Share Button */}
          <button 
            type="button"
            className="btn" 
            onClick={handleWhatsAppClick} 
            style={{ 
              background: '#25D366', 
              color: '#ffffff', 
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '6px',
              padding: '10px 18px',
              border: 'none',
              borderRadius: '8px'
            }}
          >
            <MessageCircle size={16} /> WhatsApp பில் அனுப்பு
          </button>

          {/* Print Button */}
          <button 
            type="button"
            className="btn btn-gold" 
            onClick={() => window.print()} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px', 
              background: '#b45309', 
              color: '#ffffff', 
              fontWeight: 700,
              padding: '10px 20px',
              borderRadius: '8px'
            }}
          >
            <Printer size={16} /> பில் பிரிண்ட் செய் (Print)
          </button>
        </div>
      </div>

      {/* Phone Number Input Prompt if not present */}
      {showPhonePrompt && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowPhonePrompt(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div 
            className="modal-content animate-fade-in" 
            onClick={e => e.stopPropagation()}
            style={{ width: '380px', maxWidth: '100%', background: '#ffffff', color: '#0f172a', borderRadius: '12px', padding: '20px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}
          >
            <div className="flex-between mb-12">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageCircle size={20} color="#25D366" />
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>WhatsApp பில் அனுப்புதல்</h3>
              </div>
              <button className="btn btn-ghost" style={{ padding: '4px', height: 'auto', color: '#64748b' }} onClick={() => setShowPhonePrompt(false)}>
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '12px' }}>
              வாடிக்கையாளரின் 10 இலக்க WhatsApp மொபைல் எண்ணை உள்ளிடவும்:
            </p>

            <div className="form-group mb-16">
              <input 
                type="tel" 
                placeholder="எ.கா: 9876543210" 
                value={customPhone} 
                onChange={e => setCustomPhone(e.target.value)}
                style={{ height: '42px', fontSize: '16px', fontWeight: 700, borderColor: '#25D366', color: '#0f172a', background: '#f8fafc' }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowPhonePrompt(false)}>
                ரத்து (Cancel)
              </button>
              <button 
                className="btn" 
                onClick={() => sendWhatsApp(customPhone)}
                disabled={!customPhone}
                style={{ background: '#25D366', color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Send size={14} /> அனுப்பு (Send)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BillModal
