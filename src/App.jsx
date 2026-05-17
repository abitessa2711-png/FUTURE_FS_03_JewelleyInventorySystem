import React, { useState, useEffect } from 'react'
import Login          from './components/Login'
import Signup         from './components/Signup'
import Sidebar        from './components/Sidebar'
import Header         from './components/Header'
import AddStock       from './components/AddStock'
import SellDashboard  from './components/SellDashboard'
import Reports        from './components/Reports'
import Dashboard      from './components/Dashboard'
import AuditPage      from './components/AuditPage'
import Returns        from './components/Returns'
import SoldItems      from './components/SoldItems'
import StockDashboard from './components/StockDashboard'
import RestockPage    from './components/RestockPage'

// ── LocalStorage helpers ──────────────────────────────────────────────────────
const LS = {
  get: (key, fallback = []) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
  },
  set: (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)) } catch {} }
}

let nextId = LS.get('tas_nextId', 1)
const genId = () => { const id = nextId++; LS.set('tas_nextId', nextId); return id }

export default function App() {
  // ── Auth ───────────────────────────────────────────────────────────────────
  const [user, setUser]           = useState(() => LS.get('tas_user', null))
  const [showSignup, setShowSignup] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [theme, setTheme]         = useState(() => localStorage.getItem('tas_theme') || 'dark')

  // ── Data ───────────────────────────────────────────────────────────────────
  const [products, setProducts]   = useState(() => LS.get('tas_products', []))
  const [soldItems, setSoldItems] = useState(() => LS.get('tas_sales', []))
  const [returns, setReturns]     = useState(() => LS.get('tas_returns', []))

  // ── Demo Data Injection ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setUser({ name: 'Demo Admin', role: 'admin', token: 'demo-token' })
    }
    if (products.length === 0) {
      setProducts([
        { id: genId(), category: 'கொலுசு', subcategory: 'வெள்ளி கொலுசு', variant: 'பாம்பே கொலுசு', detail: '10 inch', weight: 15.5, quantity: 5, createdAt: new Date().toISOString() },
        { id: genId(), category: 'செயின்', subcategory: 'தங்கச் செயின்', variant: 'முகப்பு செயின்', detail: '24 inch', weight: 20.0, quantity: 2, createdAt: new Date().toISOString() }
      ])
    }
  }, [])

  // ── Persist data changes ───────────────────────────────────────────────────
  useEffect(() => { LS.set('tas_products', products) }, [products])
  useEffect(() => { LS.set('tas_sales', soldItems)   }, [soldItems])
  useEffect(() => { LS.set('tas_returns', returns)   }, [returns])

  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark-theme' : ''
    localStorage.setItem('tas_theme', theme)
  }, [theme])

  useEffect(() => {
    if (user) LS.set('tas_user', user)
    else localStorage.removeItem('tas_user')
  }, [user])

  const toggleTheme = () => setTheme(p => p === 'dark' ? 'light' : 'dark')

  // ── Product CRUD ───────────────────────────────────────────────────────────
  const addProduct = (newProduct) => {
    const product = {
      ...newProduct,
      id: genId(),
      createdAt: new Date().toISOString()
    }
    setProducts(prev => [...prev, product])
  }

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  const updateProduct = (id, updates) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  // ── Sales ──────────────────────────────────────────────────────────────────
  const processSale = (customerName, mobile, cartItems) => {
    const billId = `TAS-${Date.now()}`
    const date   = new Date().toISOString()

    // Deduct stock
    const updatedProducts = [...products]
    for (const item of cartItems) {
      const idx = updatedProducts.findIndex(p => p.id === item.productId)
      if (idx !== -1) {
        updatedProducts[idx] = {
          ...updatedProducts[idx],
          weight:   Math.max(0, (updatedProducts[idx].weight   || 0) - (item.weight   || 0)),
          quantity: Math.max(0, (updatedProducts[idx].quantity || 0) - (item.quantity || 0)),
        }
      }
    }
    setProducts(updatedProducts)

    const newSales = cartItems.map(item => ({
      ...item,
      id: genId(),
      billId,
      customerName: customerName || 'Walk-in',
      mobile,
      date,
    }))
    setSoldItems(prev => [...prev, ...newSales])
    return { id: billId, customerName, mobile, items: cartItems, date }
  }

  // ── Returns ────────────────────────────────────────────────────────────────
  const addReturn = (ret) => {
    setReturns(prev => [{ ...ret, id: genId(), date: new Date().toISOString() }, ...prev])
    // Re-add stock
    if (ret.productId) {
      setProducts(prev => prev.map(p => p.id === ret.productId
        ? { ...p, weight: (p.weight || 0) + (ret.weight || 0), quantity: (p.quantity || 0) + (ret.quantity || 0) }
        : p
      ))
    }
  }

  // ── Auth gates ─────────────────────────────────────────────────────────────
  if (!user) {
    if (showSignup) return <Signup onBack={() => setShowSignup(false)} onSignupSuccess={() => setShowSignup(false)} />
    return <Login onLogin={setUser} onShowSignup={() => setShowSignup(true)} />
  }

  // ── Pages ──────────────────────────────────────────────────────────────────
  const pages = {
    dashboard: <Dashboard      products={products}   sales={soldItems}  setActiveTab={setActiveTab} />,
    stock:     <StockDashboard products={products}   onDelete={deleteProduct} onUpdate={updateProduct} />,
    add:       <AddStock       onAddProduct={addProduct} />,
    sell:      <SellDashboard  products={products}   processSale={processSale} />,
    sold:      <SoldItems      soldItems={soldItems} />,
    restock:   <RestockPage    products={products}   onAddProduct={addProduct} />,
    audit:     <AuditPage      products={products}   soldItems={soldItems} />,
    returns:   <Returns        products={products}   sales={soldItems} returns={returns} onAddReturn={addReturn} />,
    reports:   <Reports        products={products}   soldItems={soldItems} role={user?.role} deleteProduct={deleteProduct} />,
  }

  const currentPage = pages[activeTab] || pages.dashboard

  return (
    <div className="app-shell">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={user?.role || 'admin'} />
      <div className="app-content">
        <Header
          username={user?.name || 'User'}
          theme={theme}
          toggleTheme={toggleTheme}
          onLogout={() => setUser(null)}
        />
        <main className="container animate-fade-in">
          {currentPage}
        </main>
      </div>
    </div>
  )
}
