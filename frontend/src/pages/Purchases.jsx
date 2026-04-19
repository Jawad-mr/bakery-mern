import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { TopNav, BottomNav, StatCard, Pagination, ConfirmModal, toast } from '../components'
import { purchaseAPI } from '../api/axios'
import { fmt, fmtDate, fmtTime } from '../utils/helpers'

export default function PurchasesPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'Admin'

  const [purchases, setPurchases] = useState([])
  const [loading, setLoading]     = useState(true)
  const [range, setRange]         = useState('today')
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)
  const [pagination, setPag]      = useState({ total: 0, pages: 1 })
  const [todayStats, setTS]       = useState({ count: 0, totalCost: 0 })
  const [deleteId, setDeleteId]   = useState(null)

  const PER = 20

  const fetchPurchases = async () => {
    setLoading(true)
    try {
      const params = { page, limit: PER }
      if (range) params.range = range
      if (search) params.search = search
      const r = await purchaseAPI.getAll(params)
      setPurchases(r.data.data)
      setPag({ total: r.data.total, pages: r.data.pages })
      setTS(r.data.todayStats)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchPurchases() }, [range, search, page])

  const handleDelete = async () => {
    try {
      await purchaseAPI.delete(deleteId)
      toast('Purchase record deleted', 'success')
      setDeleteId(null); fetchPurchases()
    } catch { toast('Delete failed', 'error') }
  }

  const totalCost = purchases.reduce((s, p) => s + p.totalCost, 0)
  const totalQty  = purchases.reduce((s, p) => s + p.qtyAdded, 0)

  const rangeOpts = [
    { id: 'today', label: 'Today' },
    ...(isAdmin ? [{ id: 'month', label: 'This Month' }, { id: 'year', label: 'This Year' }, { id: '', label: 'All Time' }] : []),
  ]

  return (
    <>
      <TopNav />
      <div className="page-wrap">
        <div className="flex items-center justify-between mb-16" style={{ flexWrap:'wrap', gap:12 }}>
          <div>
            <div className="page-title">🛒 Purchase List</div>
            <div className="page-subtitle">All product restocks and additions logged here</div>
          </div>
        </div>

        {/* Stats */}
        <div className="stat-grid">
          <StatCard label="Today's Purchases" value={todayStats.count} sub="restock entries" icon="🛒" accent="var(--c-gold)" />
          <StatCard label="Today's Cost" value={fmt(todayStats.totalCost)} sub="total spent today" icon="💸" accent="var(--c-danger)" />
          <StatCard label="This Page Total" value={fmt(totalCost)} sub={`${totalQty} units restocked`} icon="📦" accent="var(--c-info)" />
          <StatCard label="Entries" value={pagination.total} sub="total records" icon="📋" accent="#8b5cf6" />
        </div>

        {/* Toolbar */}
        <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
          <div className="chip-group">
            {rangeOpts.map(o => (
              <button key={o.id} className={`chip${range===o.id?' active':''}`} onClick={() => { setRange(o.id); setPage(1) }}>{o.label}</button>
            ))}
          </div>
          <div className="search-wrap" style={{ maxWidth:200, flex:'unset' }}>
            <span className="search-icon">🔍</span>
            <input className="form-control" placeholder="Search product…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'60px 0' }}><span className="spinner" style={{ width:32, height:32 }} /></div>
        ) : purchases.length === 0 ? (
          <div className="empty-state card card-padded">
            <div className="empty-state__icon">🛒</div>
            <div className="empty-state__title">No purchase records</div>
            <div className="empty-state__desc">Records are created when you add or restock products</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Purchase ID</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Qty Added</th>
                  <th>Cost / Unit</th>
                  <th>Total Cost</th>
                  <th>Added By</th>
                  <th>Date</th>
                  <th>Notes</th>
                  {isAdmin && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p._id}>
                    <td><span style={{ fontFamily:'monospace', fontSize:12, fontWeight:700, color:'var(--c-gold)' }}>{p.purchaseId}</span></td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:30, height:30, background:'linear-gradient(135deg,var(--c-brand-mid),var(--c-gold))', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:'#fff', flexShrink:0 }}>{p.productName?.slice(0,2).toUpperCase()}</div>
                        <span style={{ fontWeight:600, fontSize:13 }}>{p.productName}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-gold">{p.category}</span></td>
                    <td>
                      <span style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:800, color:'var(--c-success)', letterSpacing:'-.02em' }}>+{p.qtyAdded}</span>
                    </td>
                    <td style={{ fontWeight:600 }}>{fmt(p.costPrice)}</td>
                    <td>
                      <span style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:800, color:'var(--c-text)', letterSpacing:'-.02em' }}>{fmt(p.totalCost)}</span>
                    </td>
                    <td style={{ fontSize:13 }}>{p.addedByName}</td>
                    <td>
                      <div style={{ fontSize:12, fontWeight:600 }}>{fmtDate(p.createdAt)}</div>
                      <div style={{ fontSize:11, color:'var(--c-text-soft)' }}>{fmtTime(p.createdAt)}</div>
                    </td>
                    <td>
                      <span style={{ fontSize:11, color:'var(--c-text-soft)', maxWidth:140, display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.notes || '—'}</span>
                    </td>
                    {isAdmin && (
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(p._id)}>🗑️</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <Pagination page={page} pages={pagination.pages} total={pagination.total} perPage={PER} onPage={setPage} />
        )}

        {/* Info box */}
        <div style={{ marginTop:20, background:'var(--c-gold-pale)', border:'1px solid rgba(200,144,42,.25)', borderRadius:'var(--radius-md)', padding:'14px 18px', fontSize:13, color:'var(--c-text-mid)' }}>
          <strong>ℹ️ How Purchase List works:</strong> Every time you add a new product or increase stock quantity on the Products page, it is automatically logged here with the cost price, quantity, and the user who made the change.
        </div>
      </div>

      {deleteId && (
        <ConfirmModal
          title="Delete Record?"
          desc="This removes the purchase log entry. Stock won't change."
          onConfirm={handleDelete}
          onClose={() => setDeleteId(null)}
        />
      )}

      <BottomNav />
    </>
  )
}
