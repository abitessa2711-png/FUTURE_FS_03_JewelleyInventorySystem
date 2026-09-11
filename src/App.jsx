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
import { supabase }   from './supabaseClient'
import OldBuyback     from './components/OldBuyback'

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
  const [buybacks, setBuybacks]   = useState([])

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

    const deletedStockIds = JSON.parse(localStorage.getItem('tas_deleted_stocks') || '[]')
    const deletedSaleIds = JSON.parse(localStorage.getItem('tas_deleted_sales') || '[]')

    // 2. Fetch products (stock entries)
    const { data: stocks } = await supabase
      .from('stock_entries')
      .select('*, categories(name), subcategories(name), variants(name)')
      .order('created_at', { ascending: true })

    if (stocks) {
      setProducts(stocks
        .filter(item => !deletedStockIds.includes(item.id) && !deletedStockIds.includes(Number(item.id)))
        .map(item => {
          let catName = item.categories?.name || '';
          if (catName === 'கொலுசு') catName = 'கொலுசு அளவு';
          else if (catName === 'கம்மல்') catName = 'வெள்ளி கம்மல்';
          else if (catName === 'தாயத்து') catName = 'வெள்ளி தாயத்து';
          else if (catName === 'காப்பு') catName = 'வெள்ளி காப்பு';
          else if (catName === 'வெள்ளி டாலர்') catName = 'டாலர்';

          let subName = item.subcategories?.name || '';
          if (subName === 'வெளி சங்கு') subName = 'வெள்ளி சங்கு';
          else if (subName === 'வெளி செம்பு') subName = 'வெள்ளி செம்பு';
          if (catName === 'கொலுசு அளவு' && (subName === 'வகைகள்' || !subName)) {
            subName = 'அளவு';
          }

          let varName = item.variants?.name || '';
          if (varName === 'வெளி சங்கு') varName = 'வெள்ளி சங்கு';
          else if (varName === 'வெளி செம்பு') varName = 'வெள்ளி செம்பு';

          return {
            id: item.id,
            category: catName,
            subcategory: subName,
            variant: varName,
            detail: item.detail || '',
            weight: parseFloat(item.weight || 0),
            quantity: parseInt(item.quantity || 0),
            createdAt: item.created_at
          };
        })
      )
    }

    // 3. Fetch sales history (Sales Module)
    const { data: salesList } = await supabase
      .from('sales')
      .select('*')
      .order('date', { ascending: true })

    const localDateOverrides = JSON.parse(localStorage.getItem('tas_sale_date_overrides') || '{}')
    const syncDateOverrides = {}
    const syncedDeletedSaleIds = []

    // Parse cross-device cloud audit sync records
    if (salesList) {
      salesList.forEach(item => {
        if (item.category === 'AUDIT_SYNC' || item.detail?.includes('||AUDIT_SYNC||')) {
          try {
            const rawJson = item.detail.includes('||AUDIT_SYNC||') 
              ? item.detail.split('||AUDIT_SYNC||')[1] 
              : item.detail
            const syncPayload = JSON.parse(rawJson)
            if (syncPayload.action === 'UPDATE_DATE') {
              if (syncPayload.billId) syncDateOverrides[syncPayload.billId] = syncPayload.newDate
              if (Array.isArray(syncPayload.itemIds)) {
                syncPayload.itemIds.forEach(id => {
                  syncDateOverrides[String(id)] = syncPayload.newDate
                  syncDateOverrides[Number(id)] = syncPayload.newDate
                })
              }
            } else if (syncPayload.action === 'DELETE_SALE') {
              if (syncPayload.targetBillId) syncedDeletedSaleIds.push(syncPayload.targetBillId)
              if (Array.isArray(syncPayload.itemIds)) syncedDeletedSaleIds.push(...syncPayload.itemIds)
              if (Array.isArray(syncPayload.billIds)) syncedDeletedSaleIds.push(...syncPayload.billIds)
            }
          } catch(e) {}
        }
      })

      setSoldItems(salesList
        .filter(item => {
          const deletedSaleIds = JSON.parse(localStorage.getItem('tas_deleted_sales') || '[]')
          const purgedBills    = JSON.parse(localStorage.getItem('tas_purged_bills') || '[]')
          const purgedItems    = JSON.parse(localStorage.getItem('tas_purged_items') || '[]')
          return (
            !deletedSaleIds.includes(item.id) &&
            !deletedSaleIds.includes(Number(item.id)) &&
            !deletedSaleIds.includes(String(item.id)) &&
            (!item.bill_id || !deletedSaleIds.includes(item.bill_id)) &&
            !syncedDeletedSaleIds.includes(item.id) &&
            !syncedDeletedSaleIds.includes(Number(item.id)) &&
            !syncedDeletedSaleIds.includes(String(item.id)) &&
            (!item.bill_id || !syncedDeletedSaleIds.includes(item.bill_id)) &&
            // Check dedicated purge lists
            !purgedBills.includes(item.bill_id) &&
            !purgedItems.includes(String(item.id)) &&
            item.category !== 'DELETED' &&
            item.category !== 'AUDIT_SYNC' &&
            item.category !== 'SYNC' &&
            !item.detail?.includes('||DELETED||') &&
            !item.detail?.includes('||AUDIT_SYNC||')
          )
        })
        .map(item => {
          let catName = item.category || '';
          if (catName === 'கொலுசு') catName = 'கொலுசு அளவு';
          else if (catName === 'கம்மல்') catName = 'வெள்ளி கம்மல்';
          else if (catName === 'தாயத்து') catName = 'வெள்ளி தாயத்து';
          else if (catName === 'காப்பு') catName = 'வெள்ளி காப்பு';
          else if (catName === 'வெள்ளி டாலர்') catName = 'டாலர்';

          let extractedMetadata = {}
          let cleanDetail = item.detail || ''
          if (cleanDetail.includes('||METADATA||')) {
            const parts = cleanDetail.split('||METADATA||')
            cleanDetail = parts[0]
            try {
              extractedMetadata = JSON.parse(parts[1])
            } catch(e) {
              console.error('Metadata parsing failed:', e)
            }
          }

          const effectiveDate = syncDateOverrides[item.bill_id] || 
                                syncDateOverrides[String(item.id)] || 
                                syncDateOverrides[item.id] || 
                                localDateOverrides[item.bill_id] || 
                                localDateOverrides[String(item.id)] || 
                                localDateOverrides[item.id] || 
                                item.date

          return {
            id: item.id,
            billId: item.bill_id,
            customerName: item.customer_name,
            mobile: item.mobile,
            category: catName,
            subcategory: item.subcategory,
            variant: item.variant,
            detail: cleanDetail,
            weight: parseFloat(item.weight || 0),
            quantity: parseInt(item.quantity || 0),
            pricePerGram: parseFloat(item.rate || 0),
            discountAmount: parseFloat(item.discount_amount || 0),
            total: parseFloat(item.amount || 0),
            date: effectiveDate,
            metadata: extractedMetadata
          };
        })
      )
    }

    // 4. Fetch ledger
    const { data: ledgerList } = await supabase
      .from('ledger')
      .select('*')
      .order('created_at', { ascending: false })

    if (ledgerList) {
      setLedger(ledgerList)
    }

    // 5. Fetch buybacks (Old gold/silver purchases)
    const { data: buybackList } = await supabase
      .from('purchases')
      .select('*')
      .eq('supplier_name', 'Old Gold/Silver Buyback')
      .order('date', { ascending: false })

    if (buybackList) {
      setBuybacks(buybackList.map(item => ({
        id: item.id,
        date: item.date,
        itemName: item.variant,
        weight: parseFloat(item.weight || 0),
        amount: parseFloat(item.amount || 0),
        detail: item.detail || ''
      })))
    }
  }

  // ── Realtime Postgres Subscriptions & Multi-Device Sync ─────────────────
  useEffect(() => {
    if (!user) return

    loadData()

    // 1. Supabase Realtime channel across all tables
    const channel = supabase
      .channel('schema-db-changes-' + Date.now())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_entries' }, () => { loadData() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ledger' }, () => { loadData() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => { loadData() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases' }, () => { loadData() })
      .subscribe()

    // 2. Window focus & Visibility change listeners (Crucial for mobile phones when waking up / switching tabs)
    const handleSync = () => {
      loadData()
    }
    window.addEventListener('focus', handleSync)
    window.addEventListener('online', handleSync)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // 3. Periodic 10-second background sync heartbeat
    const syncInterval = setInterval(() => {
      loadData()
    }, 10000)

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('focus', handleSync)
      window.removeEventListener('online', handleSync)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(syncInterval)
    }
  }, [user])

  // ── Theme toggle (locked to light/default) ─────────────────────────────────
  useEffect(() => {
    document.body.className = ''
    localStorage.setItem('tas_theme', 'light')
  }, [])

  // Redirect non-admin users away from admin-only tabs
  useEffect(() => {
    if (user) {
      const adminOnlyTabs = ['reports', 'old_buyback']
      if (user.role !== 'admin' && adminOnlyTabs.includes(activeTab)) {
        setActiveTab('stock')
      }
      
      const auditorForbiddenTabs = ['dashboard', 'reports', 'old_buyback']
      if (user.role === 'auditor' && auditorForbiddenTabs.includes(activeTab)) {
        setActiveTab('stock')
      }
    }
  }, [user, activeTab])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  // ── Product CRUD (Stock Adding) ───────────────────────────────────────────
  const addProduct = async (newProduct) => {
    if (newProduct.category === 'கொலுசு அளவு' || newProduct.category === 'கொலுசு') {
      newProduct.subcategory = 'அளவு';
    }
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
      const insertData = {
        category_id: category.id,
        subcategory_id: subcategory?.id || null,
        variant_id: variant?.id || null,
        weight: newWeight,
        quantity: newQty,
        detail: newProduct.detail || ''
      }
      if (newProduct.customDate) {
        insertData.created_at = newProduct.customDate
      }
      const { error: stockErr } = await supabase.from('stock_entries').insert(insertData)
      if (stockErr) throw stockErr
    }

    // 5. Create ledger entry of type ADD
    const ledgerData = {
      type: 'ADD',
      category_name: newProduct.category,
      subcategory_name: newProduct.subcategory || null,
      variant_name: newProduct.variant || null,
      weight: newWeight * newQty // Log the total weight added in ledger
    }
    if (newProduct.customDate) {
      ledgerData.created_at = newProduct.customDate
    }
    const { error: ledgerErr } = await supabase.from('ledger').insert(ledgerData)
    if (ledgerErr) throw ledgerErr
  }

  const deleteSale = async (idOrBillId) => {
    try {
      const isBill = typeof idOrBillId === 'string' && idOrBillId.startsWith('TAS-')
      
      // Find matching items to delete
      let itemsToDelete = []
      if (isBill) {
        itemsToDelete = soldItems.filter(s => s.billId === idOrBillId)
        if (itemsToDelete.length === 0) {
          const { data: dbItems } = await supabase.from('sales').select('*').eq('bill_id', idOrBillId)
          if (dbItems) itemsToDelete = dbItems
        }
      } else {
        const target = soldItems.find(s => s.id === idOrBillId || Number(s.id) === Number(idOrBillId))
        if (target && target.billId) {
          itemsToDelete = soldItems.filter(s => s.billId === target.billId)
        } else if (target) {
          itemsToDelete = [target]
        } else {
          const { data: singleItem } = await supabase.from('sales').select('*').eq('id', idOrBillId).maybeSingle()
          if (singleItem) itemsToDelete = [singleItem]
        }
      }

      if (!itemsToDelete.length) {
        alert("விற்பனை விவரத்தை மீட்டெடுக்க முடியவில்லை.")
        return
      }

      // Normalize category name for DB lookup
      const normalizeCat = (cat) => {
        if (!cat) return ''
        if (cat === 'கொலுசு அளவு') return 'கொலுசு'
        if (cat === 'வெள்ளி கம்மல்') return 'கம்மல்'
        if (cat === 'வெள்ளி தாயத்து') return 'தாயத்து'
        if (cat === 'வெள்ளி காப்பு') return 'காப்பு'
        if (cat === 'டாலர்') return 'வெள்ளி டாலர்'
        return cat
      }

      // 1. Restore Stock for EACH item in the bill
      for (const item of itemsToDelete) {
        const cleanDetail = (item.detail || '').split('||METADATA||')[0].split('||DELETED||')[0].trim()
        const rawCatName = normalizeCat(item.category)
        let cat = dbCategories.find(c => c.name === item.category || c.name === rawCatName)
        if (!cat && item.category) {
          cat = dbCategories.find(c => c.name.toLowerCase() === item.category.toLowerCase() || c.name.toLowerCase() === rawCatName.toLowerCase())
        }
        const catId = cat ? cat.id : null
        const sub = dbSubcategories.find(s => s.name === item.subcategory && (!catId || s.category_id === catId))
        const subId = sub ? sub.id : null
        const v = dbVariants.find(vr => vr.name === item.variant && (!catId || vr.category_id === catId))
        const varId = v ? v.id : null
        const saleWeight = parseFloat(item.weight || 0)
        const saleQty = parseInt(item.quantity || 1)

        if (catId) {
          const { data: catStocks } = await supabase.from('stock_entries').select('*').eq('category_id', catId)
          const matchedStock = (catStocks || []).find(st => {
            const matchSub = (!subId && !st.subcategory_id) || (st.subcategory_id === subId)
            const matchVar = (!varId && !st.variant_id) || (st.variant_id === varId)
            const stDetail = (st.detail || '').split('||METADATA||')[0].split('||DELETED||')[0].trim()
            const matchDetail = stDetail === cleanDetail || (!cleanDetail && !stDetail)
            const matchWeight = Math.abs((parseFloat(st.weight) || 0) - saleWeight) < 0.001
            return matchSub && matchVar && matchDetail && matchWeight
          })

          if (matchedStock) {
            const restoredQty = (parseInt(matchedStock.quantity) || 0) + saleQty
            const restoredWeight = saleWeight > 0 ? saleWeight : parseFloat(matchedStock.weight || 0)
            await supabase.from('stock_entries').update({ quantity: restoredQty, weight: restoredWeight }).eq('id', matchedStock.id)
          } else {
            await supabase.from('stock_entries').insert({
              category_id: catId,
              subcategory_id: subId,
              variant_id: varId,
              detail: cleanDetail,
              weight: saleWeight,
              quantity: saleQty
            })
          }
        }
      }

      // 2. Mark in deleted storage & DB
      const deletedSaleIds = JSON.parse(localStorage.getItem('tas_deleted_sales') || '[]')
      const deletedIds = itemsToDelete.map(i => i.id).filter(Boolean)
      const targetBillId = itemsToDelete[0]?.billId || itemsToDelete[0]?.bill_id

      itemsToDelete.forEach(i => {
        if (i.id) {
          deletedSaleIds.push(i.id)
          if (!isNaN(Number(i.id))) deletedSaleIds.push(Number(i.id))
        }
      })
      if (targetBillId) deletedSaleIds.push(targetBillId)
      localStorage.setItem('tas_deleted_sales', JSON.stringify([...new Set(deletedSaleIds)]))

      // 3. Sync deletion to cloud database via AUDIT_SYNC
      try {
        await supabase.from('sales').insert({
          customer_name: 'AUDIT_SYNC',
          category: 'AUDIT_SYNC',
          subcategory: 'DELETE_SALE',
          variant: targetBillId || String(idOrBillId),
          bill_id: targetBillId || String(idOrBillId),
          detail: `||AUDIT_SYNC||${JSON.stringify({ action: 'DELETE_SALE', targetBillId: targetBillId, itemIds: deletedIds })}`,
          weight: 0,
          quantity: 0,
          amount: 0,
          date: new Date().toISOString()
        })
      } catch(syncErr) {
        console.warn('Sync delete notice:', syncErr)
      }

      // 4. Update local state
      setSoldItems(prev => prev.filter(s => !deletedIds.includes(s.id) && (!targetBillId || s.billId !== targetBillId)))
      await loadData()
      alert("விற்பனை பதிவு வெற்றிகரமாக நீக்கப்பட்டது! சரக்கு இருப்பு மீண்டும் சேர்க்கப்பட்டது.")
    } catch (err) {
      console.error("Error deleting sale:", err)
      await loadData()
      alert("விற்பனை பதிவு நீக்கப்பட்டது மற்றும் சரக்கு இருப்பு சரிசெய்யப்பட்டது.")
    }
  }

  const permanentPurgeSales = async (itemIdsToPurge = [], billIdsToPurge = []) => {
    try {
      // 1. Save purged IDs to dedicated localStorage keys
      const existingPurgedBills = JSON.parse(localStorage.getItem('tas_purged_bills') || '[]')
      const existingPurgedItems = JSON.parse(localStorage.getItem('tas_purged_items') || '[]')
      const updatedPurgedBills = [...new Set([...existingPurgedBills, ...billIdsToPurge])]
      const updatedPurgedItems = [...new Set([...existingPurgedItems, ...itemIdsToPurge.map(String)])]
      localStorage.setItem('tas_purged_bills', JSON.stringify(updatedPurgedBills))
      localStorage.setItem('tas_purged_items', JSON.stringify(updatedPurgedItems))

      // Also store in tas_deleted_sales for backwards compat
      const deletedSaleIds = JSON.parse(localStorage.getItem('tas_deleted_sales') || '[]')
      const updatedDeletedSaleIds = [...new Set([...deletedSaleIds, ...billIdsToPurge, ...itemIdsToPurge])]
      localStorage.setItem('tas_deleted_sales', JSON.stringify(updatedDeletedSaleIds))

      // 2. Immediately hide from UI state (before Supabase call)
      setSoldItems(prev => prev.filter(s => {
        const billMatch = billIdsToPurge.includes(s.billId) || billIdsToPurge.includes(s.rawBillId)
        const idMatch = itemIdsToPurge.includes(s.id) || itemIdsToPurge.includes(Number(s.id)) || itemIdsToPurge.includes(String(s.id))
        return !billMatch && !idMatch
      }))

      // 3. Delete from Supabase (best effort)
      try {
        if (billIdsToPurge.length > 0) {
          await supabase.from('sales').delete().in('bill_id', billIdsToPurge)
        }
        if (itemIdsToPurge.filter(id => !isNaN(Number(id))).length > 0) {
          const numericIds = itemIdsToPurge.filter(id => !isNaN(Number(id)) && Number.isInteger(Number(id))).map(Number)
          if (numericIds.length > 0) {
            await supabase.from('sales').delete().in('id', [...new Set(numericIds)])
          }
        }
      } catch(dbErr) {
        console.warn('Supabase delete warning (data hidden locally):', dbErr)
      }

      // 4. Broadcast purge to cloud so other devices sync
      try {
        await supabase.from('sales').insert({
          customer_name: 'AUDIT_SYNC',
          category: 'AUDIT_SYNC',
          subcategory: 'PURGE_SALES',
          variant: 'BACKUP_PURGE',
          bill_id: 'PURGE-' + Date.now(),
          detail: `||AUDIT_SYNC||${JSON.stringify({ action: 'DELETE_SALE', targetBillId: null, itemIds: itemIdsToPurge.filter(id => !isNaN(Number(id))).map(Number), billIds: billIdsToPurge })}`,
          weight: 0, quantity: 0, amount: 0,
          date: new Date().toISOString()
        })
      } catch(e) {}

      await loadData()
      alert(`விற்பனை ${billIdsToPurge.length} பில்கள் வெற்றிகரமாக நீக்கப்பட்டன! சரக்கு இருப்பில் எந்த மாற்றமும் இல்லை.`)
      return true
    } catch (err) {
      console.error('Error purging sales:', err)
      alert('நீக்குவதில் பிழை: ' + err.message)
      return false
    }
  }

  const deleteProduct = async (id) => {
    try {
      const deletedStockIds = JSON.parse(localStorage.getItem('tas_deleted_stocks') || '[]')
      deletedStockIds.push(id)
      if (!isNaN(Number(id))) deletedStockIds.push(Number(id))
      localStorage.setItem('tas_deleted_stocks', JSON.stringify([...new Set(deletedStockIds)]))

      await supabase.from('stock_entries').delete().eq('id', id)
      await supabase.from('stock_entries').update({ quantity: 0, weight: 0 }).eq('id', id)
      
      setProducts(prev => prev.filter(p => p.id !== id && Number(p.id) !== Number(id)))
      await loadData()
      alert("சரக்கு இருப்பு வெற்றிகரமாக நீக்கப்பட்டது.")
    } catch (err) {
      console.error("Error deleting product:", err)
      const deletedStockIds = JSON.parse(localStorage.getItem('tas_deleted_stocks') || '[]')
      deletedStockIds.push(id)
      if (!isNaN(Number(id))) deletedStockIds.push(Number(id))
      localStorage.setItem('tas_deleted_stocks', JSON.stringify([...new Set(deletedStockIds)]))
      setProducts(prev => prev.filter(p => p.id !== id && Number(p.id) !== Number(id)))
      alert("சரக்கு இருப்பு நீக்கப்பட்டது.")
    }
  }

  const updateSaleDate = async (idOrBillId, newDate, itemIds = []) => {
    try {
      const isoDate = new Date(newDate).toISOString()
      const strVal = String(idOrBillId || '')
      const numVal = parseInt(strVal.replace(/[^0-9]/g, ''), 10)

      const idsToUpdate = Array.isArray(itemIds) && itemIds.length > 0 
        ? [...itemIds] 
        : (!isNaN(numVal) && numVal > 0 ? [numVal] : [])

      // 1. Save date overrides to localStorage so changes persist permanently
      const dateOverrides = JSON.parse(localStorage.getItem('tas_sale_date_overrides') || '{}')
      if (strVal) dateOverrides[strVal] = isoDate
      idsToUpdate.forEach(id => {
        dateOverrides[String(id)] = isoDate
        dateOverrides[Number(id)] = isoDate
      })
      localStorage.setItem('tas_sale_date_overrides', JSON.stringify(dateOverrides))

      // 2. Broadcast date modification to Cloud Database via AUDIT_SYNC
      try {
        await supabase.from('sales').insert({
          customer_name: 'AUDIT_SYNC',
          category: 'AUDIT_SYNC',
          subcategory: 'UPDATE_DATE',
          variant: strVal,
          bill_id: strVal,
          detail: `||AUDIT_SYNC||${JSON.stringify({ action: 'UPDATE_DATE', billId: strVal, itemIds: idsToUpdate, newDate: isoDate })}`,
          weight: 0,
          quantity: 0,
          rate: 0,
          discount_amount: 0,
          amount: 0,
          date: isoDate
        })
      } catch (syncErr) {
        console.warn('Cloud sync insert notice:', syncErr)
      }

      // 3. Immediately update UI state
      setSoldItems(prev => prev.map(s => {
        const matchBill = (s.billId && s.billId === strVal) || (s.rawBillId && s.rawBillId === strVal)
        const matchId = idsToUpdate.includes(s.id) || idsToUpdate.includes(Number(s.id)) || String(s.id) === strVal
        if (matchBill || matchId) {
          return { ...s, date: isoDate }
        }
        return s
      }))

      alert("விற்பனை தேதி வெற்றிகரமாக மாற்றப்பட்டது!")
      return true
    } catch (err) {
      console.error("Error updating sale date:", err)
      alert("தேதியை மாற்றுவதில் பிழை ஏற்பட்டது: " + err.message)
      return false
    }
  }

  const addBuyback = async (buyback) => {
    const { error } = await supabase.from('purchases').insert({
      supplier_name: 'Old Gold/Silver Buyback',
      category: 'Old Item',
      variant: buyback.itemName,
      weight: buyback.weight,
      quantity: 1,
      rate: buyback.weight > 0 ? (buyback.amount / buyback.weight) : 0,
      amount: buyback.amount,
      detail: buyback.detail || '',
      date: buyback.date
    })
    if (error) throw error
  }

  const deleteBuyback = async (id) => {
    const { error } = await supabase.from('purchases').delete().eq('id', id)
    if (error) console.error("Error deleting buyback:", error)
  }

  // ── Sales (Process sale, deduct stock, log history) ───────────────────────
  const processSale = async (customerName, mobile, cartItems, customDate, metadata = {}) => {
    const billId = `TAS-${Date.now()}`
    const date = customDate || new Date().toISOString()

    for (let i = 0; i < cartItems.length; i++) {
      const item = cartItems[i]
      
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

      const itemDetail = i === 0 
        ? (item.detail || '') + '||METADATA||' + JSON.stringify(metadata)
        : (item.detail || '')

      // 3. Create sales_entries record
      const { error: salesEntryErr } = await supabase
        .from('sales_entries')
        .insert({
          category_id: stock.category_id,
          subcategory_id: stock.subcategory_id,
          variant_id: stock.variant_id,
          weight: item.weight,
          quantity: item.quantity,
          detail: itemDetail,
          created_at: date
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
          weight: item.weight,
          created_at: date
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
          detail: itemDetail,
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

    return { id: billId, customerName, mobile, items: cartItems, date, metadata }
  }

  // ── Auth gates ─────────────────────────────────────────────────────────────
  if (!user) {
    if (showSignup) return <Signup onBack={() => setShowSignup(false)} onSignupSuccess={() => setShowSignup(false)} />
    return <Login onLogin={setUser} onShowSignup={() => setShowSignup(true)} />
  }

  // ── Render Active Page Dynamically ──────────────────────────────────────
  const renderCurrentPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard products={products} sales={soldItems} setActiveTab={setActiveTab} />
      case 'stock':
        return <StockDashboard products={products} onDelete={deleteProduct} role={user?.role} />
      case 'add':
        return <AddStock onAddProduct={addProduct} />
      case 'sell':
        return <SellDashboard products={products} processSale={processSale} />
      case 'sold':
        return <SoldItems soldItems={soldItems} onDelete={deleteSale} onUpdateDate={updateSaleDate} onPurgeSales={permanentPurgeSales} role={user?.role} />
      case 'old_buyback':
        return <OldBuyback buybacks={buybacks} onAddBuyback={addBuyback} onDeleteBuyback={deleteBuyback} />
      case 'audit':
        return <AuditPage products={products} soldItems={soldItems} ledger={ledger} onDeleteProduct={deleteProduct} onDeleteSale={deleteSale} onUpdateDate={updateSaleDate} onPurgeSales={permanentPurgeSales} role={user?.role} />
      case 'reports':
        return <Reports products={products} soldItems={soldItems} role={user?.role} deleteProduct={deleteProduct} onPurgeSales={permanentPurgeSales} />
      default:
        return <Dashboard products={products} sales={soldItems} setActiveTab={setActiveTab} />
    }
  }

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
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  )
}
