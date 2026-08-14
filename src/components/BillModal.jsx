import React, { useState, useRef } from 'react'
import logoImg from './logo.jpg'
import { Printer, X, MessageCircle, Send, Download, Image as ImageIcon } from 'lucide-react'

const BillModal = ({ bill, onClose }) => {
  if (!bill) return null
  const items = bill.items || []
  const meta = bill.metadata || {}
  const [showPhonePrompt, setShowPhonePrompt] = useState(false)
  const [customPhone, setCustomPhone] = useState(() => (bill.mobile || '').replace(/[^0-9]/g, ''))
  const [isGeneratingImg, setIsGeneratingImg] = useState(false)
  const billCardRef = useRef(null)
  
  // Calculate Totals
  const itemsSum = items.reduce((s, i) => s + (parseFloat(i.total) || 0), 0)
  const grossTotal = parseFloat(meta.overallBillTotal || 0) > 0 ? parseFloat(meta.overallBillTotal) : itemsSum
  const oldSilverAmount = parseFloat(meta.oldSilverAmount || 0)
  const oldSilverWeight = parseFloat(meta.oldSilverWeight || 0)
  const discountAmount = parseFloat(meta.billDiscount || 0)
  const netTotal = Math.max(0, grossTotal - oldSilverAmount - discountAmount)

  // Generate HD Bill Image using Canvas
  const generateBillCanvasBlob = () => {
    return new Promise((resolve) => {
      const width = 800
      const baseHeight = 620
      const rowHeight = 36
      const extraItemsHeight = Math.max(0, items.length - 1) * rowHeight
      const height = baseHeight + extraItemsHeight

      const canvas = document.createElement('canvas')
      const scale = 2 // 2x resolution for HD
      canvas.width = width * scale
      canvas.height = height * scale
      const ctx = canvas.getContext('2d')
      ctx.scale(scale, scale)

      // Background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)

      // Outer Luxury Border
      ctx.strokeStyle = '#b45309'
      ctx.lineWidth = 2
      ctx.strokeRect(16, 16, width - 32, height - 32)

      // Draw Logo Image
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = logoImg || '/logo.jpg'
      
      const renderContent = () => {
        // Logo
        try {
          ctx.save()
          ctx.beginPath()
          ctx.arc(75, 75, 38, 0, Math.PI * 2, true)
          ctx.closePath()
          ctx.clip()
          ctx.drawImage(img, 37, 37, 76, 76)
          ctx.restore()
          
          ctx.beginPath()
          ctx.arc(75, 75, 38, 0, Math.PI * 2, true)
          ctx.strokeStyle = '#b45309'
          ctx.lineWidth = 2
          ctx.stroke()
        } catch (e) {
          // Fallback if logo fails
          ctx.fillStyle = '#b45309'
          ctx.fillRect(37, 37, 76, 76)
        }

        // Shop Name & Title
        ctx.fillStyle = '#92400e'
        ctx.font = 'bold 24px "Noto Sans Tamil", sans-serif'
        ctx.fillText('TAS JEWELLERS', 130, 65)

        ctx.fillStyle = '#64748b'
        ctx.font = 'bold 11px sans-serif'
        ctx.fillText('AUTHENTIC GOLD & SILVER ORNAMENTS', 130, 85)

        // Address & Phone (Right aligned)
        ctx.textAlign = 'right'
        ctx.fillStyle = '#92400e'
        ctx.font = 'bold 13px sans-serif'
        ctx.fillText('TAS JEWELLERS', width - 40, 52)
        ctx.fillStyle = '#334155'
        ctx.font = '12px "Noto Sans Tamil", sans-serif'
        ctx.fillText('85, திருத்தங்கல் ரோடு', width - 40, 70)
        ctx.fillText('சிவகாசி - 626123 (தேவர் சிலை எதிரில்)', width - 40, 88)
        ctx.fillText('Ph: 9597258369, 7867807337', width - 40, 106)
        ctx.textAlign = 'left'

        // Divider
        ctx.strokeStyle = '#b45309'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(36, 125)
        ctx.lineTo(width - 36, 125)
        ctx.stroke()

        // Customer & Bill Details Box
        ctx.fillStyle = '#f8fafc'
        ctx.fillRect(36, 140, width - 72, 64)
        ctx.strokeStyle = '#e2e8f0'
        ctx.lineWidth = 1
        ctx.strokeRect(36, 140, width - 72, 64)

        ctx.fillStyle = '#64748b'
        ctx.font = 'bold 11px sans-serif'
        ctx.fillText('INVOICE TO:', 50, 160)
        ctx.fillStyle = '#0f172a'
        ctx.font = 'bold 15px sans-serif'
        ctx.fillText(bill.customerName || 'Walk-in', 50, 180)
        if (bill.mobile) {
          ctx.fillStyle = '#64748b'
          ctx.font = '12px sans-serif'
          ctx.fillText(`Ph: ${bill.mobile}`, 50, 195)
        }

        ctx.textAlign = 'right'
        ctx.fillStyle = '#334155'
        ctx.font = '12px sans-serif'
        ctx.fillText(`பில் எண் (Invoice No): ${bill.id || 'N/A'}`, width - 50, 165)
        const dateStr = bill.date ? new Date(bill.date).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')
        ctx.fillText(`தேதி (Date): ${dateStr}`, width - 50, 185)
        ctx.textAlign = 'left'

        // Metal Rates Bar (if present)
        let currentY = 216
        const gRate = parseFloat(meta.goldRate || 0)
        const sRate = parseFloat(meta.silverRate || 0)
        if (gRate > 0 || sRate > 0) {
          ctx.fillStyle = '#f8fafc'
          ctx.fillRect(36, currentY, width - 72, 30)
          ctx.strokeStyle = '#e2e8f0'
          ctx.strokeRect(36, currentY, width - 72, 30)

          ctx.font = 'bold 12px "Noto Sans Tamil", sans-serif'
          ctx.fillStyle = '#334155'
          let rateText = ''
          if (gRate > 0) rateText += `🟡 தங்கம்: ₹${gRate.toFixed(2)}/g   `
          if (sRate > 0) rateText += `⚪ வெள்ளி: ₹${sRate.toFixed(2)}/g`
          ctx.fillText(rateText, 50, currentY + 20)
          currentY += 40
        }

        // Table Header
        ctx.fillStyle = '#f1f5f9'
        ctx.fillRect(36, currentY, width - 72, 32)
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 1
        ctx.strokeRect(36, currentY, width - 72, 32)

        ctx.fillStyle = '#334155'
        ctx.font = 'bold 12px "Noto Sans Tamil", sans-serif'
        ctx.fillText('வ.எண்', 48, currentY + 21)
        ctx.fillText('பொருள் விவரம் (Item Details)', 110, currentY + 21)
        ctx.textAlign = 'center'
        ctx.fillText('எண்ணிக்கை', width - 210, currentY + 21)
        ctx.textAlign = 'right'
        ctx.fillText('எடை (Weight)', width - 50, currentY + 21)
        ctx.textAlign = 'left'

        currentY += 32

        // Table Rows
        items.forEach((item, idx) => {
          ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#fafafa'
          ctx.fillRect(36, currentY, width - 72, rowHeight)
          ctx.strokeStyle = '#e2e8f0'
          ctx.strokeRect(36, currentY, width - 72, rowHeight)

          ctx.fillStyle = '#64748b'
          ctx.font = 'bold 12px sans-serif'
          ctx.fillText(String(idx + 1), 52, currentY + 23)

          ctx.fillStyle = '#0f172a'
          ctx.font = 'bold 13px "Noto Sans Tamil", sans-serif'
          const itemName = `${item.variant || item.subcategory || item.category}${item.detail ? ` · ${item.detail}` : ''}`
          ctx.fillText(itemName.slice(0, 45), 110, currentY + 23)

          ctx.textAlign = 'center'
          ctx.font = '12px sans-serif'
          ctx.fillText(`${item.quantity || 1} pcs`, width - 210, currentY + 23)

          ctx.textAlign = 'right'
          ctx.fillStyle = '#92400e'
          ctx.font = 'bold 13px sans-serif'
          ctx.fillText(`${parseFloat(item.weight || 0).toFixed(3)}g`, width - 50, currentY + 23)
          ctx.textAlign = 'left'

          currentY += rowHeight
        })

        // Summary Section
        currentY += 15
        const summaryWidth = 340
        const summaryX = width - 36 - summaryWidth
        
        // Terms on Left
        ctx.fillStyle = '#0f172a'
        ctx.font = 'bold 11px sans-serif'
        ctx.fillText('விதிமுறைகள் (TERMS & CONDITIONS):', 40, currentY + 16)
        ctx.fillStyle = '#64748b'
        ctx.font = '10px "Noto Sans Tamil", sans-serif'
        ctx.fillText('1. விற்ற நகைகள் திரும்பப் பெறப்பட மாட்டாது.', 40, currentY + 34)
        ctx.fillText('2. அனைத்துப் பிணக்குகளும் சிவகாசி நீதிமன்ற எல்லைக்குட்பட்டவை.', 40, currentY + 50)
        ctx.fillText('3. 100% தூய தரம் உத்திரவாதம் அளிக்கப்படுகிறது.', 40, currentY + 66)

        // Summary Box on Right
        const summaryBoxHeight = 120 + (oldSilverAmount > 0 ? 20 : 0) + (discountAmount > 0 ? 20 : 0)
        ctx.fillStyle = '#f8fafc'
        ctx.fillRect(summaryX, currentY, summaryWidth, summaryBoxHeight)
        ctx.strokeStyle = '#e2e8f0'
        ctx.strokeRect(summaryX, currentY, summaryWidth, summaryBoxHeight)

        let sumY = currentY + 24
        ctx.fillStyle = '#475569'
        ctx.font = '12px "Noto Sans Tamil", sans-serif'
        ctx.fillText('மொத்த மதிப்பு (Gross Total):', summaryX + 16, sumY)
        ctx.textAlign = 'right'
        ctx.fillStyle = '#0f172a'
        ctx.font = 'bold 13px sans-serif'
        ctx.fillText(`₹${grossTotal.toFixed(2)}`, summaryX + summaryWidth - 16, sumY)
        ctx.textAlign = 'left'

        if (oldSilverAmount > 0) {
          sumY += 22
          ctx.fillStyle = '#16a34a'
          ctx.font = '12px "Noto Sans Tamil", sans-serif'
          ctx.fillText(`பழைய கழிவு ${oldSilverWeight > 0 ? `(${oldSilverWeight}g)` : ''}:`, summaryX + 16, sumY)
          ctx.textAlign = 'right'
          ctx.font = 'bold 13px sans-serif'
          ctx.fillText(`- ₹${oldSilverAmount.toFixed(2)}`, summaryX + summaryWidth - 16, sumY)
          ctx.textAlign = 'left'
        }

        if (discountAmount > 0) {
          sumY += 22
          ctx.fillStyle = '#dc2626'
          ctx.font = '12px "Noto Sans Tamil", sans-serif'
          ctx.fillText('தள்ளுபடி (Discount):', summaryX + 16, sumY)
          ctx.textAlign = 'right'
          ctx.font = 'bold 13px sans-serif'
          ctx.fillText(`- ₹${discountAmount.toFixed(2)}`, summaryX + summaryWidth - 16, sumY)
          ctx.textAlign = 'left'
        }

        sumY += 12
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(summaryX + 16, sumY)
        ctx.lineTo(summaryX + summaryWidth - 16, sumY)
        ctx.stroke()

        sumY += 24
        ctx.fillStyle = '#92400e'
        ctx.font = 'bold 15px "Noto Sans Tamil", sans-serif'
        ctx.fillText('நிகரத் தொகை (Net Pay):', summaryX + 16, sumY)
        ctx.textAlign = 'right'
        ctx.font = 'bold 17px sans-serif'
        ctx.fillText(`₹${netTotal.toFixed(2)}`, summaryX + summaryWidth - 16, sumY)
        ctx.textAlign = 'left'

        // Footer Thank you
        ctx.textAlign = 'center'
        ctx.fillStyle = '#64748b'
        ctx.font = 'bold 11px "Noto Sans Tamil", sans-serif'
        ctx.fillText('நன்றி! மீண்டும் வருக — THANK YOU!', width / 2, height - 26)

        canvas.toBlob((blob) => resolve(blob), 'image/png')
      }

      img.onload = renderContent
      img.onerror = renderContent
    })
  }

  // Handle WhatsApp Image Sharing
  const handleShareWhatsAppImage = async (phone) => {
    try {
      setIsGeneratingImg(true)
      const blob = await generateBillCanvasBlob()
      if (!blob) throw new Error('Could not generate bill image')

      const cleanPhone = (phone || bill.mobile || '').replace(/[^0-9]/g, '')
      const fileName = `TAS_Bill_${bill.id || 'Invoice'}.png`
      const file = new File([blob], fileName, { type: 'image/png' })

      // 1. Check if Mobile Native Web Share API is available (Shares the actual image directly to WhatsApp!)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `TAS Jewellers Bill - ${bill.id}`,
          text: `TAS JEWELLERS - விற்பனை ரசீது (Bill #${bill.id || ''})`
        })
        setShowPhonePrompt(false)
        return
      }

      // 2. For Desktop/Laptop: Copy to Clipboard & Download Image & Open WhatsApp Web
      let copied = false
      try {
        if (navigator.clipboard && navigator.clipboard.write) {
          const item = new ClipboardItem({ 'image/png': blob })
          await navigator.clipboard.write([item])
          copied = true
        }
      } catch (clipErr) {
        console.warn('Clipboard write error:', clipErr)
      }

      // Trigger automatic image download
      const imgUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = imgUrl
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      let targetNumber = cleanPhone
      if (targetNumber.length === 10) targetNumber = '91' + targetNumber

      const waText = encodeURIComponent(`வணக்கம்! TAS Jewellers பில் ரசீது (Bill #${bill.id || ''}) இத்துடன் இணைக்கப்பட்டுள்ளது.\n\nநிகர தொகை: ₹${netTotal.toFixed(2)}`)
      const waUrl = targetNumber 
        ? `https://api.whatsapp.com/send?phone=${targetNumber}&text=${waText}`
        : `https://api.whatsapp.com/send?text=${waText}`

      if (copied) {
        alert('பில் படம் (Bill Image) காப்பி செய்யப்பட்டது & Download செய்யப்பட்டது!\n\nWhatsApp Web திறந்ததும் Chat-ல் "Ctrl + V" (Paste) செய்து அனுப்பலாம்.')
      } else {
        alert('பில் படம் (Bill Image) Download செய்யப்பட்டது! WhatsApp-ல் Attachment-ஆக அனுப்பலாம்.')
      }

      window.open(waUrl, '_blank')
    } catch (err) {
      console.error('Error sharing image:', err)
      alert('படம் உருவாக்குவதில் பிழை: ' + err.message)
    } finally {
      setIsGeneratingImg(false)
      setShowPhonePrompt(false)
    }
  }

  const handleDownloadImage = async () => {
    try {
      setIsGeneratingImg(true)
      const blob = await generateBillCanvasBlob()
      const imgUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = imgUrl
      a.download = `TAS_Bill_${bill.id || 'Invoice'}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err) {
      alert('Error downloading image: ' + err.message)
    } finally {
      setIsGeneratingImg(false)
    }
  }

  const handleWhatsAppClick = () => {
    const rawMobile = (bill.mobile || '').replace(/[^0-9]/g, '')
    if (rawMobile.length >= 10) {
      handleShareWhatsAppImage(rawMobile)
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
        <div ref={billCardRef} style={{ padding: '32px', background: '#ffffff', color: '#0f172a', overflowY: 'auto', flex: 1 }}>
          
          {/* Header containing Logo & Address */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #b45309', paddingBottom: '16px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img 
                src={logoImg || '/logo.jpg'} 
                alt="TAS Logo" 
                style={{ width: '75px', height: '75px', borderRadius: '50%', border: '2px solid #b45309', objectFit: 'cover', display: 'block' }} 
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

          {/* Download Bill Image Button */}
          <button 
            type="button"
            className="btn btn-secondary" 
            onClick={handleDownloadImage}
            disabled={isGeneratingImg}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              padding: '10px 14px'
            }}
            title="பில் படத்தை Download செய்யவும்"
          >
            <Download size={15} /> {isGeneratingImg ? 'உருவாகிறது...' : 'படம் சேமி (Image)'}
          </button>

          {/* WhatsApp Bill Image Share Button */}
          <button 
            type="button"
            className="btn" 
            onClick={handleWhatsAppClick} 
            disabled={isGeneratingImg}
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
            <MessageCircle size={16} /> {isGeneratingImg ? 'படம் உருவாகிறது...' : 'WhatsApp பில் படம் அனுப்பு'}
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
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>WhatsApp பில் படம் அனுப்புதல்</h3>
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
                onClick={() => handleShareWhatsAppImage(customPhone)}
                disabled={!customPhone || isGeneratingImg}
                style={{ background: '#25D366', color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Send size={14} /> {isGeneratingImg ? 'அனுப்பப்படுகிறது...' : 'அனுப்பு (Send)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BillModal
