import React from 'react'
import logoImg from './logo.jpg'
import { Printer, X } from 'lucide-react'

const BillModal = ({ bill, onClose }) => {
  if (!bill) return null
  const items = bill.items || []
  const meta = bill.metadata || {}
  
  // Calculate Totals
  const itemsSum = items.reduce((s, i) => s + (parseFloat(i.total) || 0), 0)
  const grossTotal = parseFloat(meta.overallBillTotal || 0) > 0 ? parseFloat(meta.overallBillTotal) : itemsSum
  const oldSilverAmount = parseFloat(meta.oldSilverAmount || 0)
  const oldSilverWeight = parseFloat(meta.oldSilverWeight || 0)
  const discountAmount = parseFloat(meta.billDiscount || 0)
  const netTotal = Math.max(0, grossTotal - oldSilverAmount - discountAmount)

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
        <div className="flex no-print" style={{ justifyContent: 'center', gap: '12px', padding: '14px', background: '#f1f5f9', borderTop: '1px solid #e2e8f0' }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ width: '110px', color: '#475569', borderColor: '#cbd5e1' }}>மூடு (Close)</button>
          <button 
            className="btn btn-gold" 
            onClick={() => window.print()} 
            style={{ width: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#b45309', color: '#ffffff', fontWeight: 700 }}
          >
            <Printer size={16} /> பில் பிரிண்ட் செய் (Print)
          </button>
        </div>
      </div>
    </div>
  )
}

export default BillModal
