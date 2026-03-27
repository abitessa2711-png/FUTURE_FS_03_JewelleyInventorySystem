import React from 'react'

const BillModal = ({ bill, onClose }) => {
  if (!bill) return null
  const items      = bill.items || []
  const finalTotal = bill.finalTotal || items.reduce((s, i) => s + (i.total || 0), 0)

  const summaryRowStyle = { 
    display: 'flex', 
    justifyContent: 'space-between', 
    fontSize: '13px', 
    marginBottom: '8px', 
    color: '#333' 
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>

        {/* A4 Bill */}
        <div className="bill">
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#000', letterSpacing: 1.5 }}>TAS JEWELLERS</div>
            <div style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', marginTop: 4 }}>Authentic Gold & Silver Ornaments</div>
            <div style={{ fontSize: 12, color: '#333', marginTop: 2 }}>Jewellery Inventory & Billing System</div>
            <div style={{ borderBottom: '2px double #000', margin: '15px 0' }} />
          </div>

          {/* Customer Meta */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: 13 }}>
            <div>
              <div style={{ marginBottom: 4 }}><strong>INVOICE TO:</strong></div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{bill.customerName}</div>
              {bill.mobile && <div style={{ marginTop: 2 }}>Ph: {bill.mobile}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div><strong>INVOICE NO:</strong> {bill.id || 'N/A'}</div>
              <div style={{ marginTop: 2 }}><strong>DATE:</strong> {bill.date || new Date().toLocaleDateString('en-IN')}</div>
              <div style={{ marginTop: 2 }}><strong>TIME:</strong> {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', marginBottom: 30 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #000' }}>
                <th style={{ textAlign: 'left', width: '35%', padding: '8px 0', fontSize: 13 }}>Description</th>
                <th style={{ textAlign: 'center', padding: '8px 0', fontSize: 13 }}>Qty</th>
                <th style={{ textAlign: 'center', padding: '8px 0', fontSize: 13 }}>Weight</th>
                <th style={{ textAlign: 'right', padding: '8px 0', fontSize: 13 }}>Rate/g</th>
                <th style={{ textAlign: 'center', padding: '8px 0', fontSize: 13 }}>Disc%</th>
                <th style={{ textAlign: 'right', padding: '8px 0', fontSize: 13 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #EEE' }}>
                  <td style={{ padding: '8px 0', fontSize: 13 }}>
                    <div style={{ fontWeight: 700 }}>{item.variant}</div>
                    <div style={{ fontSize: 11, color: '#444' }}>{item.category} {item.detail && ` - ${item.detail}`}</div>
                  </td>
                  <td style={{ textAlign: 'center', padding: '8px 0', fontSize: 13 }}>{item.quantity || 0} pcs</td>
                  <td style={{ textAlign: 'center', padding: '8px 0', fontSize: 13 }}>{item.weight?.toFixed(3)}g</td>
                  <td style={{ textAlign: 'right', padding: '8px 0', fontSize: 13 }}>₹{item.pricePerGram?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ textAlign: 'center', padding: '8px 0', fontSize: 13 }}>{item.discountPercent || 0}%</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, padding: '8px 0', fontSize: 13 }}>₹{item.total?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary Section */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <div style={{ width: '300px' }}>
              <div style={summaryRowStyle}>
                <span>Subtotal (Weight × Rate):</span>
                <span>₹{items.reduce((s, i) => s + (i.subtotal || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={summaryRowStyle}>
                <span>Total Discount:</span>
                <span style={{ color: '#DC2626' }}>- ₹{items.reduce((s, i) => s + (i.discountAmount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ ...summaryRowStyle, fontWeight: 700 }}>
                <span>GST (3%):</span>
                <span>+ ₹{items.reduce((s, i) => s + (i.gstAmount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 900, borderTop: '2px solid #000', paddingTop: 12, marginTop: 8 }}>
                <span>GRAND TOTAL:</span>
                <span>₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Terms and Signatures */}
          <div style={{ marginTop: 60 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ fontSize: 11, color: '#333', lineHeight: 1.6 }}>
                <strong>Terms & Conditions:</strong><br />
                - No returns on gold items once sold.<br />
                - Original bill must be produced for any future service.<br />
                - Subject to local jurisdiction.
              </div>
              <div style={{ textAlign: 'center', width: '180px' }}>
                <div style={{ borderTop: '1px solid #000', paddingTop: 8, fontSize: 13, fontWeight: 700 }}>
                  FOR TAS JEWELLERS
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 40, borderTop: '1px solid #EEE', paddingTop: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#B48A05' }}>நன்றி! மீண்டும் வருக — THANK YOU! VISIT AGAIN</div>
          </div>
        </div>

        {/* Buttons */}
        <div className="print-hidden flex" style={{ justifyContent: 'center', gap: 12, padding: 24, background: 'var(--bg)', borderTop: '1px solid var(--border)', borderRadius: '0 0 12px 12px' }}>
          <button className="btn btn-gold btn-lg" onClick={() => window.print()}>🖨 பில் அச்சிடு</button>
          <button className="btn btn-ghost btn-lg" onClick={onClose}>மூடு</button>
        </div>
      </div>
    </div>
  )
}

export default BillModal
