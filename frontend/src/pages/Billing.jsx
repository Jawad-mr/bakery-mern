import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { TopNav, BottomNav, toast } from '../components'
import { productAPI, orderAPI } from '../api/axios'
import { fmt, printReceipt, whatsappReceipt } from '../utils/helpers'

const GST = 5

export default function BillingPage() {
  const { user } = useAuth()
  const [products, setProducts]   = useState([])
  const [categories, setCats]     = useState([])
  const [catFilter, setCat]       = useState('All')
  const [search, setSearch]       = useState('')
  const [cart, setCart]           = useState([])
  const [customer, setCustomer]   = useState({ name: '', phone: '' })
  const [method, setMethod]       = useState('Cash')
  const [loading, setLoading]     = useState(false)
  const [lastOrder, setLastOrder] = useState(null)

  useEffect(() => {
    productAPI.getAll().then(r => {
      setProducts(r.data.data)
      setCats(['All', ...r.data.categories])
    })
  }, [])

  const filtered = products.filter(p =>
    (catFilter === 'All' || p.category === catFilter) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const addToCart = (p) => {
    if (p.stock <= 0) return
    setCart(c => {
      const ex = c.find(i => i._id === p._id)
      if (ex) {
        if (ex.qty >= p.stock) { toast('Max stock reached', 'info'); return c }
        return c.map(i => i._id === p._id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...c, { ...p, qty: 1 }]
    })
  }

  const updateQty = (id, qty) => {
    const p = products.find(x => x._id === id)
    if (qty < 1) { setCart(c => c.filter(i => i._id !== id)); return }
    if (qty > p.stock) { toast('Exceeds stock', 'info'); return }
    setCart(c => c.map(i => i._id === id ? { ...i, qty } : i))
  }

  const removeFromCart = (id) => setCart(c => c.filter(i => i._id !== id))
  const clearCart = () => { setCart([]); setLastOrder(null) }

  // Calculations
  const subtotal  = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const gstAmount = Math.round(subtotal * GST / 100 * 100) / 100
  const total     = subtotal + gstAmount
  const itemCount = cart.reduce((s, i) => s + i.qty, 0)

  const placeOrder = async () => {
    if (!cart.length) return
    setLoading(true)
    try {
      const r = await orderAPI.create({
        customer: customer.name || 'Walk-in',
        phone: customer.phone,
        items: cart.map(i => ({ productId: i._id, qty: i.qty })),
        method,
      })
      setLastOrder(r.data.data)
      setCart([])
      setCustomer({ name: '', phone: '' })
      // Refresh products for updated stock
      productAPI.getAll().then(r => setProducts(r.data.data))
      toast(`Order placed! ${fmt(r.data.data.total)}`, 'success')
    } catch (e) {
      toast(e.response?.data?.message || 'Order failed', 'error')
    } finally { setLoading(false) }
  }

  return (
    <>
      <TopNav />
      <div className="page-wrap">
        <div className="flex items-center justify-between mb-16">
          <div>
            <div className="page-title">🧾 Billing</div>
            <div className="page-subtitle">Create orders with GST-compliant bills</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 330px', gap: 20, alignItems: 'start' }}>
          {/* LEFT — Products */}
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input className="form-control" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="chip-group mb-16">
              {categories.map(c => (
                <button key={c} className={`chip${catFilter === c ? ' active' : ''}`} onClick={() => setCat(c)}>{c}</button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: 12 }}>
              {filtered.map(p => {
                const inCart = cart.find(c => c._id === p._id)
                const oos = p.stock <= 0
                return (
                  <div key={p._id} onClick={() => !oos && addToCart(p)}
                    style={{ background: inCart ? 'var(--c-gold-pale)' : 'var(--c-surface)', border: `1.5px solid ${inCart ? 'var(--c-gold)' : 'var(--c-border-soft)'}`, borderRadius: 'var(--radius-lg)', padding: '16px 12px', textAlign: 'center', cursor: oos ? 'not-allowed' : 'pointer', opacity: oos ? .5 : 1, transition: 'all .15s', position: 'relative' }}
                    onMouseEnter={e => { if (!oos) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' } }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
                    {inCart && <span style={{ position: 'absolute', top: 8, right: 8, background: 'var(--c-gold)', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '2px 7px' }}>{inCart.qty}</span>}
                    {oos && <span style={{ position: 'absolute', top: 8, right: 8, background: '#fdecea', color: 'var(--c-danger)', borderRadius: 99, fontSize: 9, fontWeight: 700, padding: '2px 7px' }}>OOS</span>}
                    {/* No emoji — name-based design */}
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text)', marginBottom: 4, lineHeight: 1.3 }}>{p.name}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--c-gold)', letterSpacing: '-.02em' }}>{fmt(p.price)}</div>
                    <div style={{ fontSize: 10, color: p.stock <= 5 ? 'var(--c-danger)' : 'var(--c-text-soft)', marginTop: 3 }}>Stock: {p.stock}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* RIGHT — Cart */}
          <div className="card" style={{ position: 'sticky', top: 'calc(var(--nav-h) + 16px)', maxHeight: 'calc(100vh - var(--nav-h) - var(--bottom-h) - 32px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--c-border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, letterSpacing: '-.02em' }}>Cart</span>
              <span style={{ background: 'var(--c-gold)', color: '#fff', borderRadius: 99, fontSize: 11, fontWeight: 700, padding: '2px 9px' }}>{cart.length}</span>
            </div>

            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--c-border-soft)', flexShrink: 0 }}>
              <input className="form-control" style={{ marginBottom: 8, fontSize: 13, padding: '8px 12px' }} placeholder="👤 Customer name (optional)" value={customer.name} onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))} />
              <input className="form-control" style={{ fontSize: 13, padding: '8px 12px' }} placeholder="📱 Phone (optional)" value={customer.phone} onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))} />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--c-text-soft)' }}>
                  <div style={{ fontSize: 36, opacity: .3, marginBottom: 8 }}>🛒</div>
                  <div style={{ fontSize: 13 }}>Tap products to add</div>
                </div>
              ) : cart.map(i => (
                <div key={i._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 9, background: 'var(--c-cream)', borderRadius: 10, border: '1px solid var(--c-border-soft)', marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--c-text-soft)' }}>{fmt(i.price)} each</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => updateQty(i._id, i.qty - 1)} style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid var(--c-border)', background: 'var(--c-surface)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-mid)' }}>−</button>
                    <span style={{ fontSize: 13, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{i.qty}</span>
                    <button onClick={() => updateQty(i._id, i.qty + 1)} style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid var(--c-border)', background: 'var(--c-surface)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-mid)' }}>+</button>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 12, minWidth: 42, textAlign: 'right' }}>{fmt(i.price * i.qty)}</span>
                  <button onClick={() => removeFromCart(i._id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--c-text-soft)', fontSize: 13, padding: '2px 4px' }}>✕</button>
                </div>
              ))}
            </div>

            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--c-border-soft)', flexShrink: 0 }}>
              {/* Success card */}
              {lastOrder && (
                <div style={{ background: '#f0faf4', border: '1px solid #b7eac9', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-success)', marginBottom: 2 }}>✅ {lastOrder.orderId} — {fmt(lastOrder.total)}</div>
                  <div style={{ fontSize: 11, color: 'var(--c-text-soft)', marginBottom: 10 }}>GST collected: {fmt(lastOrder.gstAmount)}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => printReceipt(lastOrder)}>🖨️ Print</button>
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => whatsappReceipt(lastOrder)}>💬 WhatsApp</button>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--c-text-soft)', marginBottom: 4 }}><span>Subtotal ({itemCount} items)</span><span>{fmt(subtotal)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--c-text-soft)', marginBottom: 6 }}><span>GST ({GST}%)</span><span>{fmt(gstAmount)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--c-border)', paddingTop: 8 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, letterSpacing: '-.02em' }}>Total</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--c-gold)', letterSpacing: '-.02em' }}>{fmt(total)}</span>
                </div>
              </div>

              {/* Payment */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {['Cash', 'Online'].map(m => (
                  <button key={m} onClick={() => setMethod(m)} style={{ flex: 1, padding: 9, borderRadius: 8, border: 'none', background: method === m ? 'var(--c-brand-mid)' : 'var(--c-cream-mid)', color: method === m ? '#fff' : 'var(--c-text-soft)', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .15s' }}>
                    {m === 'Cash' ? '💵 Cash' : '📱 Online'}
                  </button>
                ))}
              </div>

              <button className="btn btn-primary btn-full btn-lg" onClick={placeOrder} disabled={!cart.length || loading}>
                {loading ? <span className="spinner" /> : 'Place Order →'}
              </button>
              {cart.length > 0 && <button className="btn btn-ghost btn-full btn-sm mt-8" onClick={clearCart}>Clear Cart</button>}
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  )
}
