import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { TopNav, BottomNav, Modal, ConfirmModal, toast } from '../components'
import { authAPI } from '../api/axios'

const EMPTY_MEMBER = { name: '', email: '', role: 'Staff', password: '', isActive: true }

export default function SettingsPage() {
  const { user, bakeryName, refreshMe, refreshSettings } = useAuth()
  const isAdmin = user?.role === 'Admin'

  const [profile, setProfile] = useState({ name: '', email: '', password: '' })
  const [savingProfile, setSavingProfile] = useState(false)

  const [storeName, setStoreName] = useState('')
  const [storeLogo, setStoreLogo] = useState('')
  const [savingStore, setSavingStore] = useState(false)

  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [memberModal, setMemberModal] = useState(null) // null | 'add' | 'edit'
  const [memberForm, setMemberForm] = useState(EMPTY_MEMBER)
  const [selectedMember, setSelectedMember] = useState(null)
  const [savingMember, setSavingMember] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => {
    setProfile({ name: user?.name || '', email: user?.email || '', password: '' })
  }, [user])

  useEffect(() => {
    setStoreName(bakeryName || 'Sweet Crumb')
  }, [bakeryName])

  useEffect(() => {
    authAPI.getSettings().then(r => setStoreLogo(r.data?.data?.bakeryLogo || '')).catch(() => {})
  }, [])

  const onLogoPick = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast('Please choose an image file', 'error')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast('Image must be smaller than 2MB', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = () => setStoreLogo(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  const loadMembers = async () => {
    if (!isAdmin) return
    setLoadingMembers(true)
    try {
      const r = await authAPI.getUsers()
      setMembers(r.data.data || [])
    } catch {
      toast('Failed to load members', 'error')
    } finally {
      setLoadingMembers(false)
    }
  }

  useEffect(() => { loadMembers() }, [isAdmin])

  const onProfileSave = async () => {
    if (!profile.name || !profile.email) {
      toast('Name and email are required', 'error')
      return
    }
    setSavingProfile(true)
    try {
      await authAPI.updateMe(profile)
      await refreshMe()
      setProfile(p => ({ ...p, password: '' }))
      toast('Profile updated', 'success')
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to update profile', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  const onStoreSave = async () => {
    if (!storeName.trim()) {
      toast('Bakery name is required', 'error')
      return
    }
    setSavingStore(true)
    try {
      await authAPI.updateSettings({ bakeryName: storeName.trim(), bakeryLogo: storeLogo })
      await refreshSettings()
      toast('Bakery info updated', 'success')
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to update bakery name', 'error')
    } finally {
      setSavingStore(false)
    }
  }

  const openAdd = () => {
    setMemberForm(EMPTY_MEMBER)
    setSelectedMember(null)
    setMemberModal('add')
  }

  const openEdit = (m) => {
    setSelectedMember(m)
    setMemberForm({
      name: m.name,
      email: m.email,
      role: m.role,
      password: '',
      isActive: m.isActive,
    })
    setMemberModal('edit')
  }

  const setMemberField = (k, v) => setMemberForm(f => ({ ...f, [k]: v }))

  const onMemberSave = async () => {
    if (!memberForm.name || !memberForm.email) {
      toast('Name and email are required', 'error')
      return
    }
    if (memberModal === 'add' && !memberForm.password) {
      toast('Password is required for new member', 'error')
      return
    }

    setSavingMember(true)
    try {
      if (memberModal === 'add') {
        await authAPI.createUser(memberForm)
        toast('Member added', 'success')
      } else {
        const payload = { ...memberForm }
        if (!payload.password) delete payload.password
        await authAPI.updateUser(selectedMember._id, payload)
        toast('Member updated', 'success')
      }
      setMemberModal(null)
      loadMembers()
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to save member', 'error')
    } finally {
      setSavingMember(false)
    }
  }

  const onDelete = async () => {
    try {
      await authAPI.deleteUser(deleteId)
      toast('Member deleted', 'success')
      setDeleteId(null)
      loadMembers()
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to delete member', 'error')
    }
  }

  return (
    <>
      <TopNav />
      <div className="page-wrap">
        <div className="mb-20">
          <div className="page-title">Settings</div>
          <div className="page-subtitle">Profile, bakery details, and member access control</div>
        </div>

        {!isAdmin ? (
          <div className="role-guard">
            <div className="role-guard__icon">🔒</div>
            <div className="role-guard__title">Admin Access Only</div>
            This page is available only to Admin users.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            <div className="card card-padded">
              <div className="section-title">My Profile</div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-control" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-control" type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">New Password (optional)</label>
                  <input className="form-control" type="password" placeholder="Leave blank to keep current password" value={profile.password} onChange={e => setProfile(p => ({ ...p, password: e.target.value }))} />
                </div>
              </div>
              <button className="btn btn-primary" onClick={onProfileSave} disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>

            <div className="card card-padded">
              <div className="section-title">Bakery Info</div>
              <div className="form-group">
                <label className="form-label">Bakery Name</label>
                <input className="form-control" value={storeName} onChange={e => setStoreName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Bakery Logo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ width: 72, height: 72, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--c-border)', background: 'var(--c-cream-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--c-text-soft)' }}>
                    {storeLogo ? <img src={storeLogo} alt="bakery logo preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'SC'}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input type="file" accept="image/*" onChange={e => onLogoPick(e.target.files?.[0])} />
                    {storeLogo && <button className="btn btn-ghost btn-sm" onClick={() => setStoreLogo('')}>Remove</button>}
                  </div>
                </div>
              </div>
              <button className="btn btn-primary" onClick={onStoreSave} disabled={savingStore}>
                {savingStore ? 'Saving...' : 'Save Bakery Info'}
              </button>
            </div>

            <div className="card card-padded">
              <div className="flex items-center justify-between mb-16" style={{ flexWrap: 'wrap', gap: 10 }}>
                <div className="section-title" style={{ marginBottom: 0 }}>Members</div>
                <button className="btn btn-primary" onClick={openAdd}>+ Add Member</button>
              </div>

              {loadingMembers ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}><span className="spinner" /></div>
              ) : members.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <div className="empty-state__title">No members found</div>
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map(m => (
                        <tr key={m._id}>
                          <td style={{ fontWeight: 700 }}>{m.name}</td>
                          <td>{m.email}</td>
                          <td><span className="badge badge-gold">{m.role}</span></td>
                          <td>
                            <span className={`badge ${m.isActive ? 'badge-green' : 'badge-red'}`}>
                              {m.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(m)}>Edit</button>
                              <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(m._id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {memberModal && (
        <Modal title={memberModal === 'add' ? 'Add Member' : 'Edit Member'} onClose={() => setMemberModal(null)} size="modal-lg">
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" value={memberForm.name} onChange={e => setMemberField('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={memberForm.email} onChange={e => setMemberField('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-control" value={memberForm.role} onChange={e => setMemberField('role', e.target.value)}>
                {['Admin', 'Cashier', 'Staff'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={memberForm.isActive ? 'active' : 'inactive'} onChange={e => setMemberField('isActive', e.target.value === 'active')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Password {memberModal === 'add' ? '*' : '(optional)'}</label>
              <input className="form-control" type="password" placeholder={memberModal === 'add' ? 'Enter password' : 'Leave blank to keep current password'} value={memberForm.password} onChange={e => setMemberField('password', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={onMemberSave} disabled={savingMember}>
              {savingMember ? 'Saving...' : memberModal === 'add' ? 'Add Member' : 'Save Changes'}
            </button>
            <button className="btn btn-ghost" onClick={() => setMemberModal(null)}>Cancel</button>
          </div>
        </Modal>
      )}

      {deleteId && (
        <ConfirmModal
          title="Delete member?"
          desc="This will permanently remove the member account."
          onConfirm={onDelete}
          onClose={() => setDeleteId(null)}
        />
      )}

      <BottomNav />
    </>
  )
}
