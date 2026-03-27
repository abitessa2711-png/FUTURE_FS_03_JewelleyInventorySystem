import React, { useState, useEffect } from 'react'
import axios          from 'axios'
import Login          from './components/Login'
import Signup         from './components/Signup'
import Sidebar        from './components/Sidebar'
import Header         from './components/Header'
import AddStock       from './components/AddStock'
import SellDashboard  from './components/SellDashboard'
import Reports        from './components/Reports'
import Dashboard      from './components/Dashboard'
import { MASTER_DATA } from './data/masterData'

axios.defaults.baseURL = 'http://localhost:8080'

export const CATEGORIES = Object.keys(MASTER_DATA)

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('tas_user')
    return saved ? JSON.parse(saved) : null
  })
  const [showSignup, setShowSignup] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [theme, setTheme]         = useState(() => localStorage.getItem('tas_theme') || 'dark')

  useEffect(() => {
    if (user) {
      localStorage.setItem('tas_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('tas_user')
    }
  }, [user])

  const [products,  setProducts]  = useState([])
  const [soldItems, setSoldItems] = useState([])
  const [bills,     setBills]     = useState([])

  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark-theme' : ''
    localStorage.setItem('tas_theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(p => p === 'dark' ? 'light' : 'dark')

  useEffect(() => {
    if (user) { fetchProducts(); fetchSales() }
  }, [user])

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get('/api/products')
      if (data.status === 'success') setProducts(data.data)
    } catch (e) { console.error('Fetch products failed', e) }
  }

  const fetchSales = async () => {
    try {
      const { data } = await axios.get('/api/sales')
      if (data.status === 'success') { setSoldItems(data.data); setBills(data.data) }
    } catch (e) { console.error('Fetch sales failed', e) }
  }

  const addProduct = async (newProduct) => {
    try {
      const { data } = await axios.post('/api/products', newProduct)
      if (data.status === 'error') throw new Error(data.message)
      await fetchProducts()
    } catch (e) {
      throw new Error(e.response?.data?.message || e.message)
    }
  }

  const deleteProduct = async (id) => {
    await axios.delete(`/api/products/${id}`)
    await fetchProducts()
  }

  const processSale = async (customerName, mobile, cartItems) => {
    try {
      for (const item of cartItems) {
        const { data } = await axios.post('/api/sales', {
          ...item, customerName,
          date: new Date().toISOString().split('T')[0]
        })
        
        // Backend always returns HTTP 200, so manually detect status: "error"
        if (data.status === 'error') {
          throw new Error(data.message || 'விற்பனை தோல்வி (Sale failed)')
        }
      }
      await fetchProducts()
      await fetchSales()
      return { id: `TAS-${Date.now()}`, customerName, mobile, items: cartItems }
    } catch (e) {
      throw new Error(e.response?.data?.message || e.message)
    }
  }

  if (!user) {
    if (showSignup) return <Signup onBack={() => setShowSignup(false)} onSignupSuccess={() => setShowSignup(false)} />
    return <Login onLogin={setUser} onShowSignup={() => setShowSignup(true)} />
  }

  const pages = {
    dashboard: <Dashboard      products={products}  sales={soldItems} />,
    add:       <AddStock       products={products}  onAddProduct={addProduct} />,
    sell:      <SellDashboard  products={products}  processSale={processSale} bills={bills} />,
    reports:   <Reports        products={products}  soldItems={soldItems} bills={bills} role={user?.role} deleteProduct={deleteProduct} />
  }

  // Defensive rendering: fallback to dashboard if tab is invalid
  const currentPage = pages[activeTab] || pages.dashboard

  return (
    <div className="app-shell">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        role={user?.role || 'admin'} 
      />
      
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
