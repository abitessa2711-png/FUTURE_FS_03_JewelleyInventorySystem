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
import SoldItems      from './components/SoldItems'
import StockDashboard from './components/StockDashboard'
import TodayReport    from './components/TodayReport'
import { supabase }   from './supabaseClient'

export default function App() {
  // ── Auth ───────────────────────────────────────────────────────────────────
  const [user, setUser]           = useState(null)
  const [showSignup, setShowSignup] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [theme, setTheme]         = useState('light')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // ── Data ───────────────────────────────────────────────────────────────────
  const [products, setProducts]   = useState([])
  const [soldItems, setSoldItems] = useState([])
  const [ledger, setLedger]       = useState([])

  // Lookup Tables for Category/Subcategory/Variant mappings
  const [dbCategories, setDbCategories] = useState([])
  const [dbSubcategories, setDbSubcategories] = useState([])
  const [dbVariants, setDbVariants] = useState([])

  // ── Auth Listeners ────────────────────────────────────────────────────────
  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email,
          email: session.user.email,
          role: session.user.user_metadata?.role || 'admin',
          token: session.access_token
        })
      } else {
        setUser(null)
      }
    })

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email,
          email: session.user.email,
          role: session.user.user_metadata?.role || 'admin',
          token: session.access_token
        })
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Load Data from Database ────────────────────────────────────────────────
  const loadLookupTables = async () => {
    const { data: cats } = await supabase.from('categories').select('*')
    const { data: subs } = await supabase.from('subcategories').select('*')
    const { data: vars } = await supabase.from('variants').select('*')
    if (cats) setDbCategories(cats)
    if (subs) setDbSubcategories(subs)
    if (vars) setDbVariants(vars)
  }

  const loadData = async () => {
    // 1. Fetch categories/subcategories/variants lookup
    await loadLookupTables()

    // 2. Fetch products (stock entries)
    const { data: stocks } = await supabase
      .from('stock_entries')
      .select('*, categories(name), subcategories(name), variants(name)')
      .order('created_at', { ascending: true })

    if (stocks) {
      setProducts(stocks.map(item => ({
        id: item.id,
        category: item.categories?.name || '',
        subcategory: item.subcategories?.name || '',
        variant: item.variants?.name || '',
        detail: item.detail || '',
        weight: parseFloat(item.weight || 0),
        quantity: parseInt(item.quantity || 0),
        createdAt: item.created_at
      })))
    }

    // 3. Fetch sales history (Sales Module)
    const { data: salesList } = await supabase
      .from('sales')
      .select('*')
      .order('date', { ascending: true })

    if (salesList) {
      setSoldItems(salesList.map(item => ({
        id: item.id,
        billId: item.bill_id,
        customerName: item.customer_name,
        mobile: item.mobile,
        category: item.category,
        subcategory: item.subcategory,
        variant: item.variant,
        detail: item.detail,
        weight: parseFloat(item.weight || 0),
        quantity: parseInt(item.quantity || 0),
        pricePerGram: parseFloat(item.rate || 0),
        discountAmount: parseFloat(item.discount_amount || 0),
        total: parseFloat(item.amount || 0),
        date: item.date
      })))
    }

    // 4. Fetch ledger
    const { data: ledgerList } = await supabase
      .from('ledger')
      .select('*')
      .order('created_at', { ascending: false })

    if (ledgerList) {
      setLedger(ledgerList)
    }
  }

  // ── Realtime Postgres Subscriptions ───────────────────────────────────────
  useEffect(() => {
    if (!user) return

    loadData()

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_entries' }, () => { loadData() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ledger' }, () => { loadData() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => { loadData() })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // ── Theme toggle (locked to light) ─────────────────────────────────────────
  useEffect(() => {
    document.body.className = ''
    localStorage.setItem('tas_theme', 'light')
  }, [])

  // Redirect auditor user away from forbidden tabs
  useEffect(() => {
    const forbiddenTabs = ['dashboard', 'sold', 'reports']
    if (user && user.role === 'auditor' && forbiddenTabs.includes(activeTab)) {
      setActiveTab('stock')
    }
  }, [user, activeTab])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  // ── Product CRUD (Stock Adding) ───────────────────────────────────────────
  const addProduct = async (newProduct) => {
    // 1. Look up category ID (or insert it)
    let category = dbCategories.find(c => c.name === newProduct.category)
    if (!category) {
      const { data, error } = await supabase.from('categories').insert({ name: newProduct.category }).select().single()
      if (error) throw error
      category = data
      setDbCategories(prev => [...prev, category])
    }

    // 2. Look up subcategory ID (or insert it)
    let subcategory = null
    if (newProduct.subcategory) {
      subcategory = dbSubcategories.find(s => s.name === newProduct.subcategory && s.category_id === category.id)
      if (!subcategory) {
        const { data, error } = await supabase.from('subcategories').insert({ category_id: category.id, name: newProduct.subcategory }).select().single()
        if (error) throw error
        subcategory = data
        setDbSubcategories(prev => [...prev, subcategory])
      }
    }

    // 3. Look up variant ID (or insert it)
    let variant = null
    if (newProduct.variant) {
      variant = dbVariants.find(v => v.name === newProduct.variant && v.category_id === category.id && v.subcategory_id === (subcategory?.id || null))
      if (!variant) {
        const { data, error } = await supabase.from('variants').insert({
          category_id: category.id,
          subcategory_id: subcategory?.id || null,
          name: newProduct.variant
        }).select().single()
        if (error) throw error
        variant = data
        setDbVariants(prev => [...prev, variant])
      }
    }

    const newWeight = parseFloat(newProduct.weight || 0)
    const newQty = parseInt(newProduct.quantity || 0)

    // 4. Check for an existing stock entry with the same characteristics and exact unit weight
    const { data: existingEntries } = await supabase
      .from('stock_entries')
      .select('*')
      .eq('category_id', category.id)
      .eq('subcategory_id', subcategory?.id || null)
      .eq('variant_id', variant?.id || null)
      .eq('detail', newProduct.detail || '')
      .eq('weight', newWeight)

    if (existingEntries && existingEntries.length > 0) {
      // Update existing stock entry quantity (unit weight stays the same)
      const matchedEntry = existingEntries[0]
      const updatedQty = parseInt(matchedEntry.quantity || 0) + newQty

      const { error: updateErr } = await supabase
        .from('stock_entries')
        .update({ quantity: updatedQty })
        .eq('id', matchedEntry.id)

      if (updateErr) throw updateErr
    } else {
      // Insert new stock entry
      const { error: stockErr } = await supabase.from('stock_entries').insert({
        category_id: category.id,
        subcategory_id: subcategory?.id || null,
        variant_id: variant?.id || null,
        weight: newWeight,
        quantity: newQty,
        detail: newProduct.detail || ''
      })
      if (stockErr) throw stockErr
    }

    // 5. Create ledger entry of type ADD
    const { error: ledgerErr } = await supabase.from('ledger').insert({
      type: 'ADD',
      category_name: newProduct.category,
      subcategory_name: newProduct.subcategory || null,
      variant_name: newProduct.variant || null,
      weight: newWeight * newQty // Log the total weight added in ledger
    })
    if (ledgerErr) throw ledgerErr
  }

  const deleteProduct = async (id) => {
    const { error } = await supabase.from('stock_entries').delete().eq('id', id)
    if (error) console.error("Error deleting product:", error)
  }

  const updateProduct = async (id, updates) => {
    const dbUpdates = {}
    if (updates.weight !== undefined) dbUpdates.weight = parseFloat(updates.weight)
    if (updates.quantity !== undefined) dbUpdates.quantity = parseInt(updates.quantity)
    if (updates.detail !== undefined) dbUpdates.detail = updates.detail

    const { error } = await supabase.from('stock_entries').update(dbUpdates).eq('id', id)
    if (error) console.error("Error updating product:", error)
  }

  // ── Sales (Process sale, deduct stock, log history) ───────────────────────
  const processSale = async (customerName, mobile, cartItems) => {
    const billId = `TAS-${Date.now()}`
    const date = new Date().toISOString()

    for (const item of cartItems) {
      // 1. Fetch current stock entry to ensure it exists and has sufficient balance
      const { data: stock, error: fetchErr } = await supabase
        .from('stock_entries')
        .select('*')
        .eq('id', item.productId)
        .single()

      if (fetchErr || !stock) {
        throw new Error(`பொருள் இருப்பில் இல்லை (Item not found in stock)`)
      }

      if (parseInt(stock.quantity || 0) < item.quantity) {
        throw new Error(`போதுமான எண்ணிக்கை இல்லை (Insufficient quantity)`)
      }

      // 2. Deduct stock quantity
      const newQty = Math.max(0, parseInt(stock.quantity || 0) - (item.quantity || 0))
      // Weight remains stock.weight, but we can set it to 0 if quantity is 0
      const newWeight = newQty > 0 ? parseFloat(stock.weight) : 0
      
      const { error: updateErr } = await supabase
        .from('stock_entries')
        .update({ weight: newWeight, quantity: newQty })
        .eq('id', item.productId)

      if (updateErr) throw updateErr

      // 3. Create sales_entries record
      const { error: salesEntryErr } = await supabase
        .from('sales_entries')
        .insert({
          category_id: stock.category_id,
          subcategory_id: stock.subcategory_id,
          variant_id: stock.variant_id,
          weight: item.weight,
          quantity: item.quantity,
          detail: item.detail || ''
        })
      if (salesEntryErr) throw salesEntryErr

      // 4. Create ledger record with type SELL
      const { error: ledgerErr } = await supabase
        .from('ledger')
        .insert({
          type: 'SELL',
          category_name: item.category,
          subcategory_name: item.subcategory || null,
          variant_name: item.variant || null,
          weight: item.weight
        })
      if (ledgerErr) throw ledgerErr

      // 5. Store in sales history (Sales Module)
      const { error: saleHistoryErr } = await supabase
        .from('sales')
        .insert({
          customer_name: customerName || 'Walk-in',
          mobile: mobile || '',
          category: item.category,
          subcategory: item.subcategory || null,
          variant: item.variant || null,
          detail: item.detail || '',
          weight: item.weight,
          quantity: item.quantity,
          rate: item.pricePerGram,
          discount_amount: item.discountAmount || 0,
          amount: item.total,
          bill_id: billId,
          date: date
        })
      if (saleHistoryErr) throw saleHistoryErr
    }

    return { id: billId, customerName, mobile, items: cartItems, date }
  }

  // ── Auth gates ─────────────────────────────────────────────────────────────
  if (!user) {
    if (showSignup) return <Signup onBack={() => setShowSignup(false)} onSignupSuccess={() => setShowSignup(false)} />
    return <Login onLogin={setUser} onShowSignup={() => setShowSignup(true)} />
  }

  // ── Pages ──────────────────────────────────────────────────────────────────
  const pages = {
    dashboard: <Dashboard      products={products}   sales={soldItems}  setActiveTab={setActiveTab} />,
    stock:     <StockDashboard products={products}   onDelete={deleteProduct} role={user?.role} />,
    add:       <AddStock       onAddProduct={addProduct} />,
    sell:      <SellDashboard  products={products}   processSale={processSale} />,
    sold:      <SoldItems      soldItems={soldItems} />,
    daily_report: <TodayReport products={products}   soldItems={soldItems} ledger={ledger} />,
    audit:     <AuditPage      products={products}   soldItems={soldItems} ledger={ledger} />,
    reports:   <Reports        products={products}   soldItems={soldItems} role={user?.role} deleteProduct={deleteProduct} />
  }

  const currentPage = pages[activeTab] || pages.dashboard

  return (
    <div className="app-shell">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        role={user?.role || 'admin'}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="app-content">
        <Header
          username={user?.name || 'User'}
          onLogout={handleLogout}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        <main className="container animate-fade-in">
          {currentPage}
        </main>
      </div>
    </div>
  )
}
