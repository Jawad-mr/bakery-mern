import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// ── TOAST ──────────────────────────────────────────────────────────────────────
let toastFn = null
export const toast = (msg, type = 'info') => toastFn?.(msg, type)

export function ToastContainer() {
  const [toasts, setToasts] = useState([])
  useEffect(() => {
    toastFn = (msg, type) => {
      const id = Date.now()
      setToasts(t => [...t, { id, msg, type }])
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
    }
  }, [])
  const icons = { success: '✅', error: '❌', info: '💬' }
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{icons[t.type]}</span><span>{t.msg}</span>
        </div>
      ))}
    </div>
  )
}

// ── TOP NAV ────────────────────────────────────────────────────────────────────
const PAGE_LABELS = { '/home': 'Dashboard', '/billing': 'Billing', '/orders': 'Orders', '/products': 'Products', '/purchases': 'Purchases', '/settings': 'Settings' }

export function TopNav() {
  const { user, logout, toggleTheme, theme, initials, bakeryName, bakeryLogo } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef()
  const nav = useNavigate()
  const loc = useLocation()

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const roleColors = { Admin: '#c8902a', Cashier: '#5a9e6f', Staff: '#5b7fb5' }

  return (
    <nav className="topnav">
      <div className="topnav__brand" style={{ cursor: 'pointer' }} onClick={() => nav('/settings')}>
        <div className="topnav__logo">
          {bakeryLogo
            ? <img src={bakeryLogo} alt="bakery logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : 'SC'}
        </div>
        <span className="topnav__name">{bakeryName}</span>
      </div>
      <div className="topnav__spacer" />
      <span className="topnav__page-title">{PAGE_LABELS[loc.pathname] || ''}</span>
      <div className="topnav__spacer" />
      <div className="topnav__actions">
        <button className="btn-icon" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <div className="profile-chip" ref={ref} onClick={() => setOpen(o => !o)}>
          <div className="profile-avatar" style={{ background: `linear-gradient(135deg, ${roleColors[user?.role] || '#c8902a'}, #e8b44a)` }}>{initials}</div>
          <div>
            <div className="profile-name">{user?.name}</div>
            <div className="profile-role">{user?.role}</div>
          </div>
          {open && (
            <div className="profile-dropdown" onClick={e => e.stopPropagation()}>
              <div className="profile-dropdown__header">
                <div className="fw-700">{user?.name}</div>
                <div className="profile-dropdown__email">{user?.email}</div>
              </div>
              {[
                { path: '/home',      label: '🏠 Dashboard' },
                { path: '/billing',   label: '🧾 Billing' },
                { path: '/orders',    label: '📦 Orders' },
                { path: '/products',  label: '🍞 Products' },
                { path: '/purchases', label: '🛒 Purchases' },
                { path: '/settings',  label: '⚙️ Settings' },
              ].map(i => (
                <button key={i.path} className="dd-item" onClick={() => { nav(i.path); setOpen(false) }}>{i.label}</button>
              ))}
              <div className="divider" />
              <button className="dd-item danger" onClick={logout}>🚪 Sign Out</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

// ── BOTTOM NAV ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { path: '/home',      icon: '🏠', label: 'Home' },
  { path: '/billing',   icon: '🧾', label: 'Billing' },
  { path: '/orders',    icon: '📦', label: 'Orders' },
  { path: '/products',  icon: '🍞', label: 'Products' },
  { path: '/purchases', icon: '🛒', label: 'Purchases' },
]

export function BottomNav() {
  const nav = useNavigate()
  const loc = useLocation()
  return (
    <nav className="bottomnav">
      {NAV_ITEMS.map(i => (
        <button key={i.path} className={`bottomnav__item ${loc.pathname === i.path ? 'active' : ''}`} onClick={() => nav(i.path)}>
          <span className="bottomnav__icon">{i.icon}</span>
          <span className="bottomnav__label">{i.label}</span>
        </button>
      ))}
    </nav>
  )
}

// ── STAT CARD ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon, accent = 'var(--c-gold)' }) {
  return (
    <div className="stat-card" style={{ '--accent': accent }}>
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value}</div>
      {sub && <div className="stat-card__sub">{sub}</div>}
    </div>
  )
}

// ── BAR CHART ──────────────────────────────────────────────────────────────────
export function BarChart({ data = [] }) {
  const max = Math.max(...data.map(d => d.v), 1)
  const fmt = n => '₹' + Number(n).toLocaleString('en-IN')
  return (
    <div className="barchart">
      {data.map((d, i) => (
        <div key={i} className="barchart__col">
          <div className="barchart__bar-wrap">
            <div className={`barchart__bar${i === data.length - 1 ? ' current' : ''}`} style={{ height: `${Math.round((d.v / max) * 115)}px` }}>
              {d.v > 0 && <span className="barchart__val">{fmt(d.v)}</span>}
            </div>
          </div>
          <span className="barchart__label">{d.l}</span>
        </div>
      ))}
    </div>
  )
}

// ── MODAL ──────────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, size = '' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`modal ${size}`}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── CONFIRM MODAL ──────────────────────────────────────────────────────────────
export function ConfirmModal({ title, desc, onConfirm, onClose, danger = true }) {
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={{ maxWidth: 360, textAlign: 'center' }}>
        <div style={{ fontSize: 42, marginBottom: 12 }}>🗑️</div>
        <div className="modal-title" style={{ marginBottom: 6 }}>{title}</div>
        <p className="text-soft text-sm" style={{ marginBottom: 20 }}>{desc}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'} btn-full`} onClick={onConfirm}>Confirm</button>
          <button className="btn btn-ghost btn-full" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── LOADING SCREEN ─────────────────────────────────────────────────────────────
export function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--c-cream)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🥐</div>
        <div className="spinner" style={{ margin: '0 auto' }} />
      </div>
    </div>
  )
}

// ── PAGINATION ─────────────────────────────────────────────────────────────────
export function Pagination({ page, pages, total, perPage, onPage }) {
  const start = (page - 1) * perPage + 1
  const end = Math.min(page * perPage, total)
  const nums = []
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 2) nums.push(i)
  }
  return (
    <div className="pagination">
      <span className="pagination__info">Showing {start}–{end} of {total}</span>
      <div className="pagination__btns">
        <button className="page-num" onClick={() => onPage(page - 1)} disabled={page <= 1}>‹</button>
        {nums.map((n, i) => (
          <>
            {i > 0 && nums[i - 1] !== n - 1 && <span key={`e${i}`} style={{ color: 'var(--c-text-soft)', padding: '0 4px', display: 'flex', alignItems: 'center' }}>…</span>}
            <button key={n} className={`page-num${n === page ? ' active' : ''}`} onClick={() => onPage(n)}>{n}</button>
          </>
        ))}
        <button className="page-num" onClick={() => onPage(page + 1)} disabled={page >= pages}>›</button>
      </div>
    </div>
  )
}
