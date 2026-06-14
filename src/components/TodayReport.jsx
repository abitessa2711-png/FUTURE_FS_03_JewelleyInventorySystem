import React from 'react'
import { Printer, Calendar, TrendingUp, Package, ShoppingBag } from 'lucide-react'

const TodayReport = ({ products = [], soldItems = [], ledger = [] }) => {
  // Get today's local date string in Asia/Kolkata timezone (YYYY-MM-DD)
  const todayLocalDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  // Date matcher helper
  const isToday = (isoString) => {
    if (!isoString) return false;
    const itemLocalDate = new Date(isoString).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    return itemLocalDate === todayLocalDate;
  };

  // 1. Filter stock added today (ledger entries with type = 'ADD' created today)
  const todayAdditions = ledger.filter(item => item.type === 'ADD' && isToday(item.created_at));

  // 2. Filter sales made today (soldItems with date matching today)
  const todaySales = soldItems.filter(item => isToday(item.date));

  // 3. Current active stock (all items in stock with quantity > 0)
  const activeStock = products.filter(p => p.quantity > 0);

  // Aggregated calculations
  const totalAddedWeight = todayAdditions.reduce((sum, item) => sum + parseFloat(item.weight || 0), 0);
  const totalAddedCount = todayAdditions.length;

  const totalSoldWeight = todaySales.reduce((sum, item) => sum + parseFloat(item.weight || 0), 0);
  const totalSoldCount = todaySales.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
  const totalSalesRevenue = todaySales.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);

  const totalStockQty = activeStock.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
  const totalStockWeight = activeStock.reduce((sum, item) => sum + ((parseInt(item.quantity) || 0) * parseFloat(item.weight || 0)), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Self-contained Print Style overrides for Xerox/Photocopy friendliness */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
          }
          .sidebar, .app-header, .print-hidden, .btn {
            display: none !important;
          }
          .app-shell {
            display: block !important;
          }
          .app-content {
            padding: 0 !important;
            margin: 0 !important;
          }
          .container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin-bottom: 30px !important;
            background: #ffffff !important;
          }
          .table-wrap {
            overflow: visible !important;
            max-height: none !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 10px !important;
          }
          th, td {
            border: 1px solid #000000 !important;
            padding: 8px 12px !important;
            color: #000000 !important;
            font-size: 13px !important;
          }
          th {
            background-color: #f2f2f2 !important;
            font-weight: bold !important;
          }
          .text-gold, .text-success, .text-danger, .text-main, .text-sub {
            color: #000000 !important;
          }
          .page-break-before {
            page-break-before: always !important;
          }
        }
      `}</style>

      {/* Header Info */}
      <div className="flex-between mb-16 print-hidden">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>தினசரி அறிக்கை (Daily Report)</h2>
          <p className="text-sub">Today's Stock additions & Sales transactions for photocopy/Xerox</p>
        </div>
        <button 
          onClick={handlePrint} 
          className="btn flex" 
          style={{ 
            backgroundColor: 'var(--gold)', 
            color: 'white', 
            border: 'none', 
            padding: '10px 20px', 
            borderRadius: '8px', 
            fontWeight: 600,
            cursor: 'pointer',
            gap: '8px' 
          }}
        >
          <Printer size={18} />
          <span>அச்சு எடுக்க (Print / Xerox)</span>
        </button>
      </div>

      {/* Printable Xerox Header */}
      <div style={{ textAlign: 'center', marginBottom: '25px', borderBottom: '2px solid #000000', paddingBottom: '15px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 5px 0' }}>TAS JEWELLERS</h1>
        <p style={{ margin: '0 0 10px 0', fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-sub)' }}>
          Authentic Gold & Silver Ornaments
        </p>
        <div className="flex" style={{ justifyContent: 'center', gap: '15px', fontSize: '14px', fontWeight: 600 }}>
          <span className="flex" style={{ gap: '6px' }}><Calendar size={15} /> தேதி (Date): {todayLocalDate.split('-').reverse().join('-')}</span>
        </div>
      </div>

      {/* Stats Summary Belt */}
      <div className="reports-stats-grid" style={{ marginBottom: '30px' }}>
        <div className="card flex" style={{ gap: 12, padding: '15px' }}>
          <div className="stat-icon" style={{ background: 'rgba(197, 160, 94, 0.15)', color: 'var(--gold)', marginBottom: 0 }}>
            <Package size={20}/>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>இன்றைய வரவு (Added Today)</div>
            <div className="fw-600" style={{ fontSize: '15px' }}>{totalAddedCount} items | {totalAddedWeight.toFixed(2)}g</div>
          </div>
        </div>
        <div className="card flex" style={{ gap: 12, padding: '15px' }}>
          <div className="stat-icon" style={{ background: 'rgba(22, 163, 74, 0.15)', color: 'var(--success)', marginBottom: 0 }}>
            <ShoppingBag size={20}/>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>இன்றைய விற்பனை (Sold Today)</div>
            <div className="fw-600" style={{ fontSize: '15px' }}>{totalSoldCount} pcs | {totalSoldWeight.toFixed(2)}g</div>
          </div>
        </div>
        <div className="card flex" style={{ gap: 12, padding: '15px' }}>
          <div className="stat-icon" style={{ background: 'rgba(0, 85, 183, 0.15)', color: 'var(--accent)', marginBottom: 0 }}>
            <TrendingUp size={20}/>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>விற்பனை தொகை (Revenue Today)</div>
            <div className="fw-600" style={{ fontSize: '15px' }}>₹{totalSalesRevenue.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* 1. Today's Stock Additions Table */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>
          1. இன்றைய வரவு / சேர்க்கப்பட்டவை (Stock Added Today)
        </h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>வ.எண்</th>
                <th>பிரிவு (Category)</th>
                <th>துணைப்பிரிவு (Subcategory)</th>
                <th>வகை / அளவு (Variant / Size)</th>
                <th style={{ textAlign: 'right', width: '150px' }}>சேர்க்கப்பட்ட எடை (Weight - g)</th>
              </tr>
            </thead>
            <tbody>
              {todayAdditions.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                  <td className="fw-600">{item.category_name}</td>
                  <td>{item.subcategory_name || '—'}</td>
                  <td>{item.variant_name || '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }} className="text-gold">
                    {parseFloat(item.weight || 0).toFixed(2)}g
                  </td>
                </tr>
              ))}
              {todayAdditions.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-sub)' }}>
                    இன்று சரக்கு சேர்க்கப்படவில்லை (No stock added today)
                  </td>
                </tr>
              )}
            </tbody>
            {todayAdditions.length > 0 && (
              <tfoot>
                <tr style={{ fontWeight: 'bold', backgroundColor: 'var(--bg)' }}>
                  <td colSpan="4" style={{ textAlign: 'right' }}>மொத்த வரவு எடை (Total Added Weight):</td>
                  <td style={{ textAlign: 'right' }}>{totalAddedWeight.toFixed(2)}g</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* 2. Today's Sales Table */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>
          2. இன்றைய விற்பனை (Sold Items Today)
        </h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>வ.எண்</th>
                <th>வாடிக்கையாளர் (Customer)</th>
                <th>பொருள் விவரம் (Details)</th>
                <th style={{ textAlign: 'center', width: '60px' }}>அளவு</th>
                <th style={{ textAlign: 'right', width: '100px' }}>எடை (Wt)</th>
                <th style={{ textAlign: 'right', width: '120px' }}>விகிதம் (Rate)</th>
                <th style={{ textAlign: 'right', width: '120px' }}>தொகை (Total)</th>
              </tr>
            </thead>
            <tbody>
              {todaySales.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                  <td>
                    <div className="fw-600">{item.customerName || 'Walk-in'}</div>
                    {item.mobile && <div style={{ fontSize: '11px', color: 'var(--text-sub)' }}>Ph: {item.mobile}</div>}
                  </td>
                  <td>
                    <div className="fw-600">{item.variant}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-sub)' }}>
                      {item.category} {item.subcategory ? `| ${item.subcategory}` : ''} {item.detail ? `(${item.detail})` : ''}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{parseFloat(item.weight || 0).toFixed(2)}g</td>
                  <td style={{ textAlign: 'right' }}>₹{(item.pricePerGram || 0).toLocaleString('en-IN')}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }} className="text-success">
                    ₹{(item.total || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
              {todaySales.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-sub)' }}>
                    இன்று விற்பனை இல்லை (No sales today)
                  </td>
                </tr>
              )}
            </tbody>
            {todaySales.length > 0 && (
              <tfoot>
                <tr style={{ fontWeight: 'bold', backgroundColor: 'var(--bg)' }}>
                  <td colSpan="3" style={{ textAlign: 'right' }}>மொத்தம் (Total):</td>
                  <td style={{ textAlign: 'center' }}>{totalSoldCount}</td>
                  <td style={{ textAlign: 'right' }}>{totalSoldWeight.toFixed(2)}g</td>
                  <td></td>
                  <td style={{ textAlign: 'right' }} className="text-success">₹{totalSalesRevenue.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* 3. Today's Available Stock (Xerox Inventory Audit) */}
      <div className="card page-break-before">
        <h3 style={{ fontSize: '16px', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>
          3. இன்றைய இருப்பு நிலை (Current Available Stock Inventory)
        </h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>வ.எண்</th>
                <th>பிரிவு (Category)</th>
                <th>துணைப்பிரிவு (Subcategory)</th>
                <th>வகை / அளவு (Variant / Size)</th>
                <th>விவரம் (Detail)</th>
                <th style={{ textAlign: 'center', width: '100px' }}>இருப்பு Qty</th>
                <th style={{ textAlign: 'right', width: '120px' }}>எடை (Weight - g)</th>
              </tr>
            </thead>
            <tbody>
              {activeStock.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                  <td className="fw-600">{item.category}</td>
                  <td>{item.subcategory || '—'}</td>
                  <td className="fw-600">{item.variant}</td>
                  <td>{item.detail || '—'}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }} className="text-gold">
                    {parseFloat(item.weight || 0).toFixed(2)}g
                  </td>
                </tr>
              ))}
              {activeStock.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-sub)' }}>
                    இருப்பு இல்லை (No stock available)
                  </td>
                </tr>
              )}
            </tbody>
            {activeStock.length > 0 && (
              <tfoot>
                <tr style={{ fontWeight: 'bold', backgroundColor: 'var(--bg)' }}>
                  <td colSpan="5" style={{ textAlign: 'right' }}>மொத்த இருப்பு (Total Available Stock):</td>
                  <td style={{ textAlign: 'center' }}>{totalStockQty}</td>
                  <td style={{ textAlign: 'right' }}>{totalStockWeight.toFixed(2)}g</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}

export default TodayReport
