import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { TopNav, BottomNav, StatCard, Modal, ConfirmModal, toast } from '../components'
import { productAPI } from '../api/axios'
import { fmt } from '../utils/helpers'

const CATEGORIES = ['Pastries','Breads','Muffins','Tarts','Cakes','Cookies','Beverages','Other']
const EMPTY = { name:'', category:'Pastries', price:'', costPrice:'', stock:'', unit:'pcs', gstRate:5 }

export default function ProductsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'Admin'

  const [products, setProducts] = useState([])
  const [categories, setCats]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [catFilter, setCat]     = useState('All')
  const [search, setSearch]     = useState('')
  const [stockFilter, setSF]    = useState('')
  const [viewMode, setView]     = useState('grid')
  const [modal, setModal]       = useState(null) // null | 'add' | 'edit'
  const [editItem, setEditItem] = useState(null)
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = {}
      if (catFilter !== 'All') params.category = catFilter
      if (search) params.search = search
      if (stockFilter) params.stockAlert = stockFilter
      const r = await productAPI.getAll(params)
      setProducts(r.data.data)
      setCats(['All', ...r.data.categories])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchProducts() }, [catFilter, search, stockFilter])

  const openAdd = () => { setForm(EMPTY); setEditItem(null); setModal('add') }
  const openEdit = (p) => {
    setForm({ name: p.name, category: p.category, price: p.price, costPrice: p.costPrice, stock: p.stock, unit: p.unit, gstRate: p.gstRate })
    setEditItem(p)
    setModal('edit')
  }

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name || !form.price) { toast('Name and price required', 'error'); return }
    setSaving(true)
    try {
      if (modal === 'add') {
        await productAPI.create(form)
        toast('Product added!', 'success')
      } else {
        await productAPI.update(editItem._id, form)
        toast('Product updated!', 'success')
        if (Number(form.stock) > editItem.stock) toast('Stock increase logged to Purchases', 'info')
      }
      setModal(null); fetchProducts()
    } catch (e) {
      toast(e.response?.data?.message || 'Save failed', 'error')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await productAPI.delete(deleteId)
      toast('Product removed', 'success')
      setDeleteId(null); fetchProducts()
    } catch (e) { toast('Delete failed', 'error') }
  }

  const stockClass = (s) => s <= 0 ? 'badge-red' : s <= 5 ? 'badge-red' : s <= 15 ? 'badge-gold' : 'badge-green'
  const stockLabel = (s) => s <= 0 ? 'OOS' : s <= 5 ? 'CRITICAL' : s <= 15 ? 'LOW' : `${s}`

  const allProds = products
  const low = allProds.filter(p => p.stock <= 15 && p.stock > 0).length
  const oos = allProds.filter(p => p.stock <= 0).length

  return (
    <>
      <TopNav />
      <div className="page-wrap">
        <div className="flex items-center justify-between mb-16" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="page-title">Products</div>
            <div className="page-subtitle">Manage your bakery's product catalogue</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* View toggle */}
            <div style={{ display: 'flex', gap: 4 }}>
              {[['grid','⊞'],['list','☰']].map(([v,l]) => (
                <button key={v} onClick={() => setView(v)} className="btn-icon" style={{ background: viewMode === v ? 'var(--c-gold-pale)' : undefined, borderColor: viewMode === v ? 'var(--c-gold)' : undefined, color: viewMode === v ? 'var(--c-gold)' : undefined }}>{l}</button>
              ))}
            </div>
            {isAdmin && <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>}
          </div>
        </div>

        {/* Stats */}
        <div className="stat-grid">
          <StatCard label="Total Products" value={allProds.length} sub="in catalogue" icon="📦" accent="var(--c-gold)" />
          <StatCard label="Low Stock" value={low} sub="need restocking" icon="⚠️" accent="var(--c-warn)" />
          <StatCard label="Out of Stock" value={oos} sub="unavailable" icon="❌" accent="var(--c-danger)" />
          <StatCard label="Categories" value={new Set(allProds.map(p => p.category)).size} sub="product types" icon="🏷️" accent="#8b5cf6" />
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrap" style={{ maxWidth: 220, flex: 'unset' }}>
            <span className="search-icon">🔍</span>
            <input className="form-control" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="chip-group">
            {categories.map(c => <button key={c} className={`chip${catFilter===c?' active':''}`} onClick={() => setCat(c)}>{c}</button>)}
          </div>
          <div style={{ flex: 1 }} />
          <select className="form-control" style={{ width: 150 }} value={stockFilter} onChange={e => setSF(e.target.value)}>
            <option value="">All Stock</option>
            <option value="low">Low (≤15)</option>
            <option value="critical">Critical (≤5)</option>
            <option value="oos">Out of Stock</option>
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}><span className="spinner" style={{ width: 32, height: 32 }} /></div>
        ) : products.length === 0 ? (
          <div className="empty-state card card-padded"><div className="empty-state__icon">🔍</div><div className="empty-state__title">No products found</div></div>
        ) : viewMode === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {products.map(p => {
              const sc = stockClass(p.stock)
              const pct = Math.min(100, Math.round(p.stock / 80 * 100))
              return (
                <div key={p._id} style={{ background: 'var(--c-surface)', border: `1.5px solid ${p.stock<=0?'#f5c6c6':p.stock<=15?'#f5e6c8':'var(--c-border-soft)'}`, borderRadius: 'var(--radius-lg)', padding: 18, transition: 'all .2s', position: 'relative' }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='var(--shadow-md)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}>
                  {p.stock<=15 && <div style={{ position:'absolute',top:0,right:0,background:p.stock<=0?'var(--c-danger)':'var(--c-warn)',color:'#fff',fontSize:9,fontWeight:700,padding:'4px 10px',borderRadius:'0 var(--radius-lg) 0 var(--radius-md)',letterSpacing:.6,textTransform:'uppercase' }}>{p.stock<=0?'Out of Stock':'Low Stock'}</div>}

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4, lineHeight: 1.25 }}>{p.name}</div>
                      <span style={{ display:'inline-block',fontSize:10,fontWeight:800,letterSpacing:.6,textTransform:'uppercase',color:'var(--c-text-soft)',background:'var(--c-cream-mid)',borderRadius:99,padding:'2px 8px' }}>{p.category}</span>
                    </div>
                    <span className={`badge ${sc}`}>{stockLabel(p.stock)}</span>
                  </div>

                  <div style={{ display:'flex',alignItems:'baseline',gap:6,marginBottom:6 }}>
                    <span style={{ fontFamily:'var(--font-display)',fontSize:22,fontWeight:800,color:'var(--c-gold)',letterSpacing:'-.02em' }}>{fmt(p.price)}</span>
                    <span style={{ fontSize:11,color:'var(--c-text-soft)' }}>/ {p.unit}</span>
                  </div>
                  <div style={{ fontSize:11,color:'var(--c-text-soft)',marginBottom:4 }}>Cost: {fmt(p.costPrice)}</div>

                  <div style={{ height:4,background:'var(--c-cream-mid)',borderRadius:99,overflow:'hidden',marginBottom:14 }}>
                    <div style={{ height:'100%',width:`${pct}%`,background:p.stock<=5?'var(--c-danger)':p.stock<=15?'var(--c-warn)':'var(--c-success)',borderRadius:99,transition:'width .4s' }} />
                  </div>

                  {isAdmin ? (
                    <div style={{ display:'flex',gap:8 }}>
                      <button className="btn btn-secondary btn-sm" style={{ flex:1 }} onClick={() => openEdit(p)}>✏️ Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(p._id)}>🗑️</button>
                    </div>
                  ) : <div style={{ textAlign:'center',fontSize:11,color:'var(--c-text-soft)' }}>View only</div>}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Product</th><th>Category</th><th>Price</th><th>Cost</th><th>GST</th><th>Stock</th>{isAdmin && <th>Actions</th>}</tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id}>
                    <td>
                      <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                        <div style={{ minWidth: 0 }}><div style={{ fontWeight:800,fontSize:13 }}>{p.name}</div><div style={{ fontSize:11,color:'var(--c-text-soft)' }}>{p.unit}</div></div>
                      </div>
                    </td>
                    <td><span className="badge badge-gold">{p.category}</span></td>
                    <td><span style={{ fontFamily:'var(--font-display)',fontSize:16,fontWeight:800,color:'var(--c-gold)',letterSpacing:'-.02em' }}>{fmt(p.price)}</span></td>
                    <td>{fmt(p.costPrice)}</td>
                    <td>{p.gstRate}%</td>
                    <td>
                      <span className={`badge ${stockClass(p.stock)}`}>{p.stock} {p.unit}</span>
                    </td>
                    {isAdmin && (
                      <td>
                        <div style={{ display:'flex',gap:6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(p._id)}>Delete</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <Modal title={modal === 'add' ? 'Add Product' : 'Edit Product'} onClose={() => setModal(null)} size="modal-lg">
          <div className="form-grid-2">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Product Name *</label>
              <input className="form-control" placeholder="e.g. Butter Croissant" value={form.name} onChange={e => setF('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-control" value={form.category} onChange={e => setF('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select className="form-control" value={form.unit} onChange={e => setF('unit', e.target.value)}>
                {['pcs','slice','box','kg','g','litre'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Selling Price (₹) *</label>
              <input type="number" className="form-control" placeholder="0" value={form.price} onChange={e => setF('price', e.target.value)} min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Cost Price (₹)</label>
              <input type="number" className="form-control" placeholder="0" value={form.costPrice} onChange={e => setF('costPrice', e.target.value)} min="0" />
              <div style={{ fontSize:10,color:'var(--c-text-soft)',marginTop:4 }}>Logs to Purchase list automatically</div>
            </div>
            <div className="form-group">
              <label className="form-label">Stock Quantity</label>
              <input type="number" className="form-control" placeholder="0" value={form.stock} onChange={e => setF('stock', e.target.value)} min="0" />
              {modal === 'edit' && Number(form.stock) > editItem?.stock && (
                <div style={{ fontSize:10,color:'var(--c-success)',marginTop:4 }}>+{Number(form.stock)-editItem.stock} units will be logged as purchase</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">GST Rate (%)</label>
              <select className="form-control" value={form.gstRate} onChange={e => setF('gstRate', Number(e.target.value))}>
                {[0, 5, 12, 18].map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'flex',gap:10,marginTop:8 }}>
            <button className="btn btn-primary" style={{ flex:1 }} onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner" /> : modal === 'add' ? 'Add Product' : 'Save Changes'}
            </button>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
          </div>
        </Modal>
      )}

      {deleteId && (
        <ConfirmModal title="Delete Product?" desc="This will soft-delete the product. It won't appear in billing." onConfirm={handleDelete} onClose={() => setDeleteId(null)} />
      )}

      <BottomNav />
    </>
  )
}
