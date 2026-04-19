import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toast } from '../components'

export default function LoginPage() {
  const [tab, setTab]         = useState('login')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)
  const [selectedRole, setRole] = useState('Cashier')
  const [form, setForm]       = useState({ name:'', email:'', password:'' })
  const { login, register }   = useAuth()
  const nav = useNavigate()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleLogin = async () => {
    if (!form.email || !form.password) { toast('Fill in all fields', 'error'); return }
    setLoading(true)
    try {
      await login(form.email, form.password)
      nav('/home')
    } catch (e) {
      toast(e.response?.data?.message || 'Invalid credentials', 'error')
    } finally { setLoading(false) }
  }

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) { toast('Fill in all fields', 'error'); return }
    if (form.password.length < 6) { toast('Password min 6 characters', 'error'); return }
    setLoading(true)
    try {
      await register(form.name, form.email, form.password, selectedRole)
      nav('/home')
    } catch (e) {
      toast(e.response?.data?.message || 'Registration failed', 'error')
    } finally { setLoading(false) }
  }

  const fillDemo = (email, pw) => { setForm(f => ({ ...f, email, password: pw })); setTab('login') }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', overflow: 'hidden' }}>
      {/* LEFT */}
      <div style={{
        width: '44%', minHeight: '100vh', flexShrink: 0,
        background: 'linear-gradient(160deg, #1a0f00 0%, #3d2106 45%, #6b3a12 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '48px', position: 'relative', overflow: 'hidden'
      }} className="auth-left-panel">
        {/* pattern */}
        <div style={{ position: 'absolute', inset: 0, opacity: .06, backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23c8902a' fill-opacity='1'%3E%3Cpath d='M20 20.5V18H0v5h5v5H0v5h20v-2.5c0-2.5 2.5-2.5 2.5-5s2.5-2.5 2.5-5-2.5-2.5-2.5-5 2.5-2.5 2.5-5-2.5-2.5-2.5-5S22.5 3 22.5.5 20 .5 20 .5v20z'/%3E%3C/g%3E%3C/svg%3E")` }} />
        <div style={{ position: 'absolute', width: 300, height: 300, background: 'radial-gradient(circle, rgba(200,144,42,.18) 0%, transparent 70%)', bottom: -80, right: -80, borderRadius: '50%' }} />
        <div style={{ position: 'absolute', width: 180, height: 180, background: 'radial-gradient(circle, rgba(200,144,42,.12) 0%, transparent 70%)', top: 40, left: -40, borderRadius: '50%' }} />

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ width: 72, height: 72, background: 'rgba(200,144,42,.2)', border: '1px solid rgba(200,144,42,.4)', borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 auto 20px', backdropFilter: 'blur(10px)', letterSpacing: '-.04em' }}>SC</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 800, color: '#fff', letterSpacing: '-.04em', lineHeight: 1.1 }}>Sweet<span style={{ color: '#e8b44a' }}>Crumb</span></div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', fontWeight: 500, letterSpacing: .3, margin: '6px 0 40px' }}>Bakery & Patisserie POS</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 280 }}>
            {[
              { icon: '📊', t: 'Live Dashboard', d: 'Real-time revenue & analytics' },
              { icon: '🧾', t: 'Smart Billing', d: 'GST-compliant bills + receipts' },
              { icon: '🛒', t: 'Purchase Tracking', d: 'Log every restock with cost price' },
              { icon: '👥', t: 'Role Management', d: 'Admin, Cashier & Staff levels' },
            ].map(f => (
              <div key={f.t} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: '11px 14px', backdropFilter: 'blur(10px)' }}>
                <div style={{ width: 34, height: 34, background: 'rgba(200,144,42,.2)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{f.icon}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.9)', marginBottom: 1 }}>{f.t}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)' }}>{f.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 20, fontSize: 10, color: 'rgba(255,255,255,.2)', zIndex: 1 }}>© 2025 Sweet Crumb Bakery</div>
      </div>

      {/* RIGHT */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', overflowY: 'auto', background: 'var(--c-cream)' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: 'var(--c-cream-mid)', borderRadius: 12, padding: 4, marginBottom: 28, border: '1px solid var(--c-border)' }}>
            {['login', 'register'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: tab === t ? 'var(--c-surface)' : 'transparent', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700, color: tab === t ? 'var(--c-text)' : 'var(--c-text-soft)', cursor: 'pointer', boxShadow: tab === t ? 'var(--shadow-sm)' : 'none', transition: 'all .2s' }}>
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {tab === 'login' ? (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 27, fontWeight: 800, color: 'var(--c-text)', marginBottom: 4, letterSpacing: '-.03em' }}>Welcome back</div>
              <div style={{ fontSize: 14, color: 'var(--c-text-soft)', marginBottom: 24 }}>Sign in to your POS account.</div>

              {/* Demo creds */}
              <div style={{ background: 'var(--c-gold-pale)', border: '1px solid rgba(200,144,42,.25)', borderRadius: 12, padding: '12px 14px', marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--c-brand-soft)', marginBottom: 8 }}>✨ Quick Demo Login</div>
                {[
                  { name: 'Arjun Sharma', role: 'Admin', email: 'admin@sweetcrumb.in', pw: 'admin123', color: '#856404', bg: '#fff3cd' },
                  { name: 'Priya Menon', role: 'Cashier', email: 'cashier@sweetcrumb.in', pw: 'cash123', color: '#0a3622', bg: '#d1e7dd' },
                  { name: 'Ravi Kumar', role: 'Staff', email: 'staff@sweetcrumb.in', pw: 'staff123', color: '#084298', bg: '#cfe2ff' },
                ].map(d => (
                  <div key={d.role} onClick={() => fillDemo(d.email, d.pw)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 6px', borderRadius: 6, cursor: 'pointer', transition: 'background .15s', marginBottom: 2 }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,144,42,.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text-mid)' }}>
                      {d.name} <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 99, fontSize: 9, fontWeight: 700, background: d.bg, color: d.color, marginLeft: 4 }}>{d.role}</span>
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--c-text-soft)', fontFamily: 'var(--font-body)' }}>{d.pw}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, color: 'var(--c-text-soft)', fontSize: 12 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--c-border)' }} /> or <div style={{ flex: 1, height: 1, background: 'var(--c-border)' }} />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>📧</span>
                  <input className="form-control" style={{ paddingLeft: 38 }} type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>🔒</span>
                  <input className="form-control" style={{ paddingLeft: 38, paddingRight: 44 }} type={showPw ? 'text' : 'password'} placeholder="Your password" value={form.password} onChange={e => set('password', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                  <button onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14 }}>{showPw ? '🙈' : '👁️'}</button>
                </div>
              </div>
              <button className="btn btn-primary btn-full btn-lg mt-20" onClick={handleLogin} disabled={loading}>
                {loading ? <span className="spinner" /> : 'Sign In →'}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 27, fontWeight: 800, color: 'var(--c-text)', marginBottom: 4, letterSpacing: '-.03em' }}>Create account</div>
              <div style={{ fontSize: 14, color: 'var(--c-text-soft)', marginBottom: 24 }}>Join Sweet Crumb POS today.</div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-control" type="text" placeholder="Arjun Sharma" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="form-control" style={{ paddingRight: 44 }} type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters" value={form.password} onChange={e => set('password', e.target.value)} />
                  <button onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14 }}>{showPw ? 'Hide' : 'Show'}</button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[{ r: 'Admin', icon: 'Admin' }, { r: 'Cashier', icon: 'Cashier' }, { r: 'Staff', icon: 'Staff' }].map(({ r, icon }) => (
                    <button key={r} onClick={() => setRole(r)} style={{ padding: '10px 6px', textAlign: 'center', borderRadius: 8, border: `1.5px solid ${selectedRole === r ? 'var(--c-gold)' : 'var(--c-border)'}`, background: selectedRole === r ? 'var(--c-gold-pale)' : 'transparent', cursor: 'pointer', transition: 'all .15s' }}>
                      <div style={{ fontSize: 22, marginBottom: 3 }}>{icon}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-mid)' }}>{r}</div>
                    </button>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary btn-full btn-lg mt-8" onClick={handleRegister} disabled={loading}>
                {loading ? <span className="spinner" /> : 'Create Account →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
