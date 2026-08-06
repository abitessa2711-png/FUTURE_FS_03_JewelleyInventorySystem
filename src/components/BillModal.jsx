import React from 'react'
import logoImg from './logo.jpg'
import { Printer, X } from 'lucide-react'

const BillModal = ({ bill, onClose }) => {
  if (!bill) return null
  const items = bill.items || []
  
  // Calculate Totals
  const grossTotal = items.reduce((s, i) => s + (i.total || (i.weight * i.pricePerGram) || 0), 0)
  const discountVal = parseFloat(bill.metadata?.billDiscount || 0)
  const oldSilverWeight = parseFloat(bill.metadata?.oldSilverWeight || 0)
  const oldSilverRate = parseFloat(bill.metadata?.oldSilverRate || 0)
  const oldSilverAmount = parseFloat(bill.metadata?.oldSilverAmount || 0)
  const netTotal = grossTotal - discountVal - oldSilverAmount

  return (
    <div className="modal-overlay no-print-overlay">
      <div className="modal-content animate-fade-in print-bill-container" onClick={e => e.stopPropagation()} style={{ width: '850px', maxWidth: '95vw', padding: 0 }}>
        
        {/* Printable Card Area */}
        <div style={{ padding: '35px' }}>
          
          {/* Header containing Logo & Address */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid var(--gold)', paddingBottom: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img 
                src={logoImg} 
                alt="TAS Logo" 
                style={{ width: '75px', height: '75px', borderRadius: '50%', border: '2px solid var(--gold)', objectFit: 'cover' }} 
              />
              <div>
                <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--gold)', margin: 0, letterSpacing: '0.5px' }}>TAS JEWELLERS</h2>
                <div style={{ fontSize: '11px', color: 'var(--text-sub)', fontWeight: 600, letterSpacing: '1px' }}>AUTHENTIC GOLD & SILVER ORNAMENTS</div>
              </div>
            </div>
            
            <div style={{ textAlign: 'right', fontSize: '12px', lineHeight: '1.5', color: 'var(--text-main)', fontWeight: 500 }}>
              <strong style={{ color: 'var(--gold)', fontSize: '14px' }}>TAS JEWELLERS</strong><br />
              85, திருத்தங்கல் ரோடு<br />
              சிவகாசி - 626123 (தேவர் சிலை எதிரில்)<br />
              Ph: 9597258369, 7867807337
            </div>
          </div>

          {/* Customer / Invoice Details */}
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '15px 0', fontSize: '13px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '14px', borderRadius: '10px' }}>
            <div>
              <div style={{ color: 'var(--text-sub)', fontSize: '11px', marginBottom: '2px', fontWeight: 600 }}>INVOICE TO</div>
              <strong style={{ fontSize: '16px' }}>{bill.customerName || 'Walk-in'}</strong>
              {bill.mobile && <div style={{ marginTop: '2px', color: 'var(--text-sub)' }}>Ph: {bill.mobile}</div>}
            </div>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div>பில் எண் (Invoice No): <strong>{bill.id || 'N/A'}</strong></div>
              <div style={{ marginTop: '2px' }}>தேதி (Date): <strong>{bill.date ? new Date(bill.date).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')}</strong></div>
            </div>
          </div>

          {/* Today's Metal Rates display inside invoice */}
          {(bill.metadata?.goldRate > 0 || bill.metadata?.silverRate > 0) && (
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', background: 'rgba(197, 160, 94, 0.05)', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(197, 160, 94, 0.2)', fontSize: '12px', fontWeight: 600 }}>
              {bill.metadata?.goldRate > 0 && <div>🟡 இன்றைய தங்கம் விலை (Gold Rate): ₹{bill.metadata.goldRate.toFixed(2)}/g</div>}
              {bill.metadata?.silverRate > 0 && <div>⚪ இன்றைய வெள்ளி விலை (Silver Rate): ₹{bill.metadata.silverRate.toFixed(2)}/g</div>}
            </div>
          )}

          {/* Items Table */}
          <div className="table-wrap" style={{ marginBottom: '25px', overflow: 'hidden', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1.5px solid var(--border)' }}>
                  <th style={{ width: '50px', padding: '10px 12px', textAlign: 'left' }}>S.No</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>பொருள் விவரம் (Item Details)</th>
                  <th style={{ width: '80px', padding: '10px 12px', textAlign: 'center' }}>Qty</th>
                  <th style={{ width: '100px', padding: '10px 12px', textAlign: 'right' }}>Weight</th>
                  <th style={{ width: '110px', padding: '10px 12px', textAlign: 'right' }}>Rate/g</th>
                  <th style={{ width: '120px', padding: '10px 12px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px', color: 'var(--text-sub)' }}>{idx + 1}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <strong style={{ fontSize: '14px' }}>{item.variant || item.subcategory}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-sub)' }}>{item.category} {item.detail && `- ${item.detail}`}</div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600 }}>{item.quantity || 0} pcs</td>
                    <td style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 600 }}>{parseFloat(item.weight || 0).toFixed(3)}g</td>
                    <td style={{ textAlign: 'right', padding: '10px 12px' }}>₹{parseFloat(item.pricePerGram || 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700, color: 'var(--gold)' }}>₹{parseFloat(item.total || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Summary */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '10px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-sub)', width: '45%', lineHeight: '1.6' }}>
              <strong style={{ fontSize: '12px', color: 'var(--text-main)' }}>TERMS & CONDITIONS:</strong><br />
              1. No returns or exchanges on silver/gold items once sold.<br />
              2. All disputes are subject to Sivakasi jurisdiction.<br />
              3. Quality 100% guaranteed as per hallmark standards.
            </div>
            
            <div style={{ width: '340px', background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <div className="flex-between" style={{ fontSize: '13px', color: 'var(--text-sub)', marginBottom: '6px' }}>
                <span>மொத்த மதிப்பு (Gross Total):</span>
                <span className="fw-600 text-main">₹{grossTotal.toFixed(2)}</span>
              </div>
              {discountVal > 0 && (
                <div className="flex-between" style={{ fontSize: '13px', color: 'var(--danger)', marginBottom: '6px' }}>
                  <span>பில் தள்ளுபடி (Bill Discount):</span>
                  <span className="fw-600">- ₹{discountVal.toFixed(2)}</span>
                </div>
              )}
              {oldSilverAmount > 0 && (
                <div className="flex-between" style={{ fontSize: '13px', color: 'var(--success)', marginBottom: '6px' }}>
                  <span>பழைய வெள்ளி கழிவு ({oldSilverWeight}g @ ₹{oldSilverRate}):</span>
                  <span className="fw-600">- ₹{oldSilverAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />
              <div className="flex-between fw-700" style={{ fontSize: '17px', color: 'var(--gold)' }}>
                <span>நிகர மதிப்பு (Net Pay):</span>
                <span>₹{netTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '35px', color: 'var(--text-sub)', fontSize: '12px', fontWeight: 600 }}>
            நன்றி! மீண்டும் வருக — THANK YOU!
          </div>
        </div>

        {/* Action Buttons - Hidden during printing */}
        <div className="flex no-print" style={{ justifyContent: 'center', gap: '12px', padding: '20px', background: 'var(--bg)', borderTop: '1px solid var(--border)', borderRadius: '0 0 20px 20px' }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ width: '120px' }}>மூடு (Close)</button>
          <button 
            className="btn btn-gold" 
            onClick={() => window.print()} 
            style={{ width: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Printer size={16} /> பில் பிரிண்ட் செய் (Print)
          </button>
        </div>
      </div>
    </div>
  )
}

export default BillModal
