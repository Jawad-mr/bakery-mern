import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { TopNav, BottomNav, StatCard, Pagination, Modal, ConfirmModal, toast } from '../components'
import { orderAPI } from '../api/axios'
import { fmt, fmtDate, fmtTime, fmtDateTime, exportCSV, printReceipt, whatsappReceipt } from '../utils/helpers'

export default function OrdersPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'Admin'

  const [orders, setOrders]     = useState([])
  const [stats, setStats]       = useState({})
  const [loading, setLoading]   = useState(true)
  const [range, setRange]       = useState('today')
  const [search, setSearch]     = useState('')
  const [method, setMethod]     = useState('')
  const [page, setPage]         = useState(1)
  const [pagination, setPag]    = useState({ total: 0, pages: 1 })
  const [detail, setDetail]     = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const PER = 15

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = { page, limit: PER }
      if (range) params.range = range
      if (search) params.search = search
      if (method) params.method = method
      const r = await orderAPI.getAll(params)
      setOrders(r.data.data)
      setPag({ total: r.data.total, pages: r.data.pages })
    } finally { setLoading(false) }
  }

  const fetchStats = async () => {
    const r = await orderAPI.getStats()
    setStats(r.data)
  }

  useEffect(() => { fetchStats() }, [])
  useEffect(() => { fetchOrders() }, [range, search, method, page])

  const rangeOpts = [
    { id: 'today', label: 'Today' },
    ...(isAdmin ? [{ id: 'month', label: 'This Month' }, { id: 'year', label: 'This Year' }, { id: '', label: 'All Time' }] : []),
  ]

  const statData = range === 'today' ? stats.today : range === 'month' ? stats.month : range === 'year' ? stats.year : stats.year
  const revenue  = statData?.revenue || 0
  const gstTotal = statData?.gst     || 0
  const count    = statData?.orders  || 0

  const handleDelete = async () => {
    try {
      await orderAPI.delete(deleteId)
      toast('Order deleted and stock restored', 'success')
      setDeleteId(null)
      fetchOrders(); fetchStats()
    } catch (e) {
      toast(e.response?.data?.message || 'Delete failed', 'error')
    }
  }

  const handleExportCSV = async () => {
    try {
      const r = await orderAPI.getAll({ range, limit: 10000 })
      exportCSV(r.data.data)
      toast('CSV exported!', 'success')
    } catch { toast('Export failed', 'error') }
  }

  return (
    <>
      <TopNav />
      <div className="page-wrap">
        <div className="flex items-center justify-between mb-16" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="page-title">📦 Orders</div>
            <div className="page-subtitle">View and manage all transactions</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>📥 Export CSV</button>
            <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>🖨️ Print</button>
          </div>
        </div>

        {/* Stats */}
        <div className="stat-grid">
          <StatCard label="Revenue" value={fmt(revenue)} sub={`${count} orders`} icon="💰" accent="var(--c-gold)" />
          <StatCard label="GST Collected" value={fmt(gstTotal)} sub="5% rate" icon="🏛️" accent="#8b5cf6" />
          <StatCard label="Cash Orders" value={orders.filter(o => o.method === 'Cash').length} sub="this page" icon="💵" accent="var(--c-success)" />
          <StatCard label="Online Orders" value={orders.filter(o => o.method === 'Online').length} sub="this page" icon="📱" accent="var(--c-info)" />
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="chip-group">
            {rangeOpts.map(o => (
              <button key={o.id} className={`chip${range === o.id ? ' active' : ''}`} onClick={() => { setRange(o.id); setPage(1) }}>{o.label}</button>
            ))}
          </div>
          <div className="search-wrap" style={{ maxWidth: 200, flex: 'unset' }}>
            <span className="search-icon">🔍</span>
            <input className="form-control" placeholder="Search…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <select className="form-control" style={{ width: 130 }} value={method} onChange={e => { setMethod(e.target.value); setPage(1) }}>
            <option value="">All Methods</option>
            <option value="Cash">💵 Cash</option>
            <option value="Online">📱 Online</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}><span className="spinner" style={{ width: 32, height: 32 }} /></div>
        ) : orders.length === 0 ? (
          <div className="empty-state card card-padded"><div className="empty-state__icon">📭</div><div className="empty-state__title">No orders found</div></div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th><th>Customer</th><th>Items</th>
                  <th>Subtotal</th><th>GST</th><th>Total</th>
                  <th>Method</th><th>Date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id}>
                    <td><span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 800, color: 'var(--c-gold)', letterSpacing: '-.01em' }}>{o.orderId}</span></td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{o.customer}</div>
                      {o.phone && <div style={{ fontSize: 11, color: 'var(--c-text-soft)' }}>{o.phone}</div>}
                    </td>
                    <td><span style={{ fontSize: 12, color: 'var(--c-text-soft)' }}>{o.items.slice(0, 2).map(i => `${i.name} ×${i.qty}`).join(', ')}{o.items.length > 2 ? ` +${o.items.length - 2}` : ''}</span></td>
                    <td style={{ fontWeight: 600 }}>{fmt(o.subtotal)}</td>
                    <td><span className="badge badge-gold">{fmt(o.gstAmount)}</span></td>
                    <td><span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, letterSpacing: '-.02em' }}>{fmt(o.total)}</span></td>
                    <td><span className={`badge ${o.method === 'Cash' ? 'badge-green' : 'badge-blue'}`}>{o.method === 'Cash' ? '💵' : '📱'} {o.method}</span></td>
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{fmtDate(o.createdAt)}</div>
                      <div style={{ fontSize: 11, color: 'var(--c-text-soft)' }}>{fmtTime(o.createdAt)}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setDetail(o)}>View</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => printReceipt(o)} title="Print">🖨️</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => whatsappReceipt(o)} title="WhatsApp">💬</button>
                        {isAdmin && <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(o._id)} title="Delete">🗑️</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <Pagination page={page} pages={pagination.pages} total={pagination.total} perPage={PER} onPage={setPage} />
        )}
      </div>

      {/* Detail Modal */}
      {detail && (
        <Modal title={detail.orderId} onClose={() => setDetail(null)} size="modal-lg">
          <div style={{ background: 'var(--c-cream)', borderRadius: 10, padding: '12px 16px', marginBottom: 14, border: '1px solid var(--c-border-soft)' }}>
            {[
              ['Customer', detail.customer],
              detail.phone && ['Phone', detail.phone],
              ['Payment', detail.method],
              ['Date', fmtDateTime(detail.createdAt)],
              ['Cashier', detail.cashierName],
            ].filter(Boolean).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 3, fontSize: 13 }}>
                <span style={{ color: 'var(--c-text-soft)', minWidth: 70 }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {detail.items.map((i, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--c-cream)', borderRadius: 8, border: '1px solid var(--c-border-soft)' }}>
                <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, var(--c-brand-mid), var(--c-gold))', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>{i.name.slice(0,2).toUpperCase()}</div>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{i.name}</span>
                <span style={{ fontSize: 12, color: 'var(--c-text-soft)' }}>×{i.qty} @ {fmt(i.price)}</span>
                <span style={{ fontWeight: 700 }}>{fmt(i.subtotal)}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px dashed var(--c-border)', paddingTop: 12 }}>
            {[['Subtotal', fmt(detail.subtotal)], ['GST (5%)', fmt(detail.gstAmount)]].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--c-text-soft)', marginBottom: 4 }}><span>{k}</span><span>{v}</span></div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, letterSpacing: '-.02em' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--c-gold)', letterSpacing: '-.02em' }}>{fmt(detail.total)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => printReceipt(detail)}>🖨️ Print</button>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => whatsappReceipt(detail)}>💬 WhatsApp</button>
            <button className="btn btn-ghost" onClick={() => setDetail(null)}>Close</button>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <ConfirmModal
          title="Delete Order?"
          desc="This will delete the order and restore product stock. Cannot be undone."
          onConfirm={handleDelete}
          onClose={() => setDeleteId(null)}
        />
      )}

      <BottomNav />
    </>
  )
}
