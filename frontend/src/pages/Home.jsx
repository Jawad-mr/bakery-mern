import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { TopNav, BottomNav, StatCard, BarChart } from '../components'
import { orderAPI, purchaseAPI, productAPI } from '../api/axios'
import { fmt, today } from '../utils/helpers'

export default function HomePage() {
  const { user, can } = useAuth()
  const nav = useNavigate()
  const [stats, setStats]     = useState(null)
  const [products, setProds]  = useState([])
  const [recentOrders, setOrders] = useState([])
  const [todayPurchases, setTP]   = useState({ count: 0, totalCost: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      orderAPI.getStats(),
      productAPI.getAll(),
      orderAPI.getAll({ range: 'today', limit: 6 }),
      purchaseAPI.getAll({ range: 'today', limit: 1 }),
    ]).then(([s, p, o, pur]) => {
      setStats(s.data)
      setProds(p.data.data)
      setOrders(o.data.data)
      setTP(pur.data.todayStats)
    }).finally(() => setLoading(false))
  }, [])

  const isAdmin = user?.role === 'Admin'
  const roleEmoji = { Admin: '👑', Cashier: '🧾', Staff: '👤' }
  const lowStock = products.filter(p => p.stock <= 15).sort((a, b) => a.stock - b.stock).slice(0, 5)

  if (loading) return (
    <>
      <TopNav />
      <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <span className="spinner" style={{ width: 36, height: 36 }} />
      </div>
      <BottomNav />
    </>
  )

  return (
    <>
      <TopNav />
      <div className="page-wrap">
        {/* Greeting */}
        <div style={{ background: 'linear-gradient(135deg, var(--c-brand-mid) 0%, var(--c-brand-soft) 100%)', borderRadius: 'var(--radius-xl)', padding: '28px 32px', marginBottom: 24, position: 'relative', overflow: 'hidden', color: '#fff' }} className="anim">
          <div style={{ position: 'absolute', right: 28, top: '50%', transform: 'translateY(-50%)', fontSize: 80, opacity: .12 }}>🥐</div>
          <div style={{ fontSize: 13, opacity: .7, marginBottom: 4 }}>Good day,</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, marginBottom: 4, letterSpacing: '-.02em' }}>{user?.name}</div>
          <div style={{ fontSize: 13, opacity: .6 }}>{today()}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
            {roleEmoji[user?.role]} {user?.role}
          </div>
        </div>

        {/* Stats */}
        <div className="stat-grid anim">
          <StatCard label="Today's Revenue" value={fmt(stats?.today.revenue)} sub={`${stats?.today.orders} orders`} icon="💰" accent="var(--c-gold)" />
          <StatCard label="Today's GST" value={fmt(stats?.today.gst)} sub="5% collected" icon="🏛️" accent="#8b5cf6" />
          <StatCard label="Today's Orders" value={stats?.today.orders} sub={`Avg ${fmt(stats?.today.orders ? Math.round(stats.today.revenue / stats.today.orders) : 0)}`} icon="🧾" accent="var(--c-gold-light)" />
          <StatCard label="Today Purchases" value={todayPurchases.count} sub={`Cost: ${fmt(todayPurchases.totalCost)}`} icon="🛒" accent="#e67e22" />
          {isAdmin && <StatCard label="Monthly Revenue" value={fmt(stats?.month.revenue)} sub={`${stats?.month.orders} orders`} icon="📅" accent="var(--c-success)" />}
          {isAdmin && <StatCard label="Yearly Revenue" value={fmt(stats?.year.revenue)} sub={`${stats?.year.orders} orders`} icon="📊" accent="var(--c-info)" />}
        </div>

        {/* Quick Actions */}
        <div className="section-title">⚡ Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { icon: '🧾', label: 'New Bill', sub: 'Start a sale', path: '/billing' },
            { icon: '📦', label: 'Orders', sub: "Today's history", path: '/orders' },
            { icon: '🍞', label: 'Products', sub: 'Manage stock', path: '/products' },
            { icon: '🛒', label: 'Purchases', sub: 'Purchase log', path: '/purchases' },
          ].map(a => (
            <div key={a.label} onClick={() => nav(a.path)} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border-soft)', borderRadius: 'var(--radius-lg)', padding: '18px 14px', textAlign: 'center', cursor: 'pointer', transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-gold)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border-soft)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{a.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-mid)' }}>{a.label}</div>
              <div style={{ fontSize: 11, color: 'var(--c-text-soft)', marginTop: 2 }}>{a.sub}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="section-title">📈 Revenue Trends</div>
        <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 24 }}>
          <div className="card card-padded">
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--c-text-soft)', marginBottom: 4 }}>Last 7 Days</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 16, letterSpacing: '-.02em' }}>{fmt(stats?.charts.last7.reduce((s, d) => s + d.v, 0))}</div>
            <BarChart data={stats?.charts.last7 || []} />
          </div>
          {isAdmin ? (
            <div className="card card-padded">
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--c-text-soft)', marginBottom: 4 }}>Last 6 Months</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 16, letterSpacing: '-.02em' }}>{fmt(stats?.charts.last6m.reduce((s, d) => s + d.v, 0))}</div>
              <BarChart data={stats?.charts.last6m || []} />
            </div>
          ) : (
            <div className="role-guard"><div className="role-guard__icon">🔒</div><div className="role-guard__title">Admin Only</div>Monthly analytics restricted.</div>
          )}
        </div>

        {/* Bottom Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Recent Orders */}
          <div>
            <div className="section-title">🕐 Recent Orders</div>
            <div className="card card-padded">
              {recentOrders.length ? recentOrders.map(o => {
                const init = o.customer.split(' ').map(w => w[0]).join('').slice(0, 2)
                const time = new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                return (
                  <div key={o._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px', borderRadius: 'var(--radius-sm)', marginBottom: 8, background: 'var(--c-cream)', border: '1px solid var(--c-border-soft)' }}>
                    <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, var(--c-brand-mid), var(--c-gold))', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{init}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{o.customer}</div>
                      <div style={{ fontSize: 11, color: 'var(--c-text-soft)' }}>{o.orderId} · {time}</div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-.02em' }}>{fmt(o.total)}</span>
                  </div>
                )
              }) : <div className="empty-state" style={{ padding: '30px 0' }}><div className="empty-state__icon">📭</div>No orders today</div>}
            </div>
          </div>

          {/* Low Stock */}
          <div>
            <div className="section-title">⚠️ Low Stock</div>
            <div className="card card-padded">
              {lowStock.length ? lowStock.map(p => (
                <div key={p._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--c-cream)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--c-border-soft)', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--c-text-soft)' }}>{p.category}</div>
                  </div>
                  <span className={`badge ${p.stock <= 5 ? 'badge-red' : 'badge-gold'}`}>{p.stock} left</span>
                </div>
              )) : <div className="empty-state" style={{ padding: '30px 0' }}><div className="empty-state__icon">✅</div>All stocked up!</div>}
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  )
}
