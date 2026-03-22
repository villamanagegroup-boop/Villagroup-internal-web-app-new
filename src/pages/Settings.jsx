import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth, isAdmin, canWrite } from '../context/AuthContext'
import { UserPlus, Shield, Check, X, Mail } from 'lucide-react'

const ROLE_OPTIONS = ['admin', 'manager', 'agent', 'viewer']
const ROLE_COLORS = {
  admin: 'bg-gold/10 text-gold-600 ring-1 ring-gold/30',
  manager: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  agent: 'bg-navy/8 text-navy ring-1 ring-navy/20',
  viewer: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
}

function fmt(d) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) } catch { return '—' }
}

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

export default function Settings() {
  const { profile, role, refreshProfile } = useAuth()
  const [tab, setTab] = useState('account')
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('agent')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState(null)
  const [editName, setEditName] = useState(profile?.full_name || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState(null)

  useEffect(() => {
    if (tab === 'team') fetchMembers()
  }, [tab])

  useEffect(() => {
    setEditName(profile?.full_name || '')
  }, [profile])

  async function fetchMembers() {
    setLoadingMembers(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at')
    setMembers(data || [])
    setLoadingMembers(false)
  }

  async function handleInvite(e) {
    e.preventDefault()
    setInviting(true)
    setInviteMsg(null)
    const { data, error } = await supabase.functions.invoke('invite-user', {
      body: { email: inviteEmail, full_name: inviteName, role: inviteRole },
    })
    if (error || data?.error) {
      setInviteMsg({ type: 'error', text: data?.error || error.message })
    } else {
      setInviteMsg({ type: 'success', text: `Invite sent to ${inviteEmail}. They'll receive an email to set their password.` })
      setInviteEmail('')
      setInviteName('')
      setInviteRole('agent')
      fetchMembers()
    }
    setInviting(false)
  }

  async function handleRoleChange(memberId, newRole) {
    await supabase.from('profiles').update({ role: newRole }).eq('id', memberId)
    setMembers(m => m.map(p => p.id === memberId ? { ...p, role: newRole } : p))
  }

  async function handleToggleActive(memberId, current) {
    await supabase.from('profiles').update({ is_active: !current }).eq('id', memberId)
    setMembers(m => m.map(p => p.id === memberId ? { ...p, is_active: !current } : p))
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMsg(null)
    const { error } = await supabase.from('profiles').update({ full_name: editName }).eq('id', profile.id)
    if (error) {
      setProfileMsg({ type: 'error', text: error.message })
    } else {
      await refreshProfile()
      setProfileMsg({ type: 'success', text: 'Profile updated.' })
    }
    setSavingProfile(false)
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setSavingPassword(true)
    setPasswordMsg(null)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPasswordMsg({ type: 'error', text: error.message })
    } else {
      setPasswordMsg({ type: 'success', text: 'Password updated.' })
      setCurrentPassword('')
      setNewPassword('')
    }
    setSavingPassword(false)
  }

  const tabs = [
    { id: 'account', label: 'My Account' },
    ...(isAdmin(role) ? [{ id: 'team', label: 'Team' }] : []),
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Account &amp; team management</p>
        </div>
      </div>

      <div className="toolbar flex items-center gap-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-navy/8 text-navy' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/80'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* My Account Tab */}
          {tab === 'account' && (
            <>
              {/* Profile */}
              <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm divide-y divide-gray-100/80">
                <div className="px-6 py-5">
                  <p className="section-label">Profile</p>
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name</label>
                      <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                        className="w-full border border-gray-200/80 rounded-lg px-3.5 py-2.5 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-navy/30" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Role</label>
                      <p className="text-sm text-gray-700 capitalize">{role || '—'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Role is managed by your admin.</p>
                    </div>
                    {profileMsg && (
                      <p className={`text-xs px-3 py-2 rounded-lg ${profileMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {profileMsg.text}
                      </p>
                    )}
                    <button type="submit" disabled={savingProfile}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-navy to-navy-500 text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md hover:brightness-105 transition-all disabled:opacity-60">
                      <Check size={14} /> {savingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                </div>

                {/* Change Password */}
                <div className="px-6 py-5">
                  <p className="section-label">Change Password</p>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">New Password</label>
                      <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8}
                        placeholder="Min. 8 characters"
                        className="w-full border border-gray-200/80 rounded-lg px-3.5 py-2.5 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-navy/30" />
                    </div>
                    {passwordMsg && (
                      <p className={`text-xs px-3 py-2 rounded-lg ${passwordMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {passwordMsg.text}
                      </p>
                    )}
                    <button type="submit" disabled={savingPassword || !newPassword}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-navy to-navy-500 text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md hover:brightness-105 transition-all disabled:opacity-60">
                      <Check size={14} /> {savingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}

          {/* Team Tab (admin only) */}
          {tab === 'team' && isAdmin(role) && (
            <>
              {/* Invite */}
              <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm px-6 py-5">
                <p className="section-label">Invite Team Member</p>
                <form onSubmit={handleInvite} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name</label>
                      <input type="text" value={inviteName} onChange={e => setInviteName(e.target.value)} required
                        placeholder="Jane Smith"
                        className="w-full border border-gray-200/80 rounded-lg px-3.5 py-2.5 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-navy/30" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Role</label>
                      <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                        className="w-full border border-gray-200/80 rounded-lg px-3.5 py-2.5 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-navy/30">
                        {ROLE_OPTIONS.map(r => <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Email Address</label>
                    <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required
                      placeholder="teammate@company.com"
                      className="w-full border border-gray-200/80 rounded-lg px-3.5 py-2.5 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-navy/30" />
                  </div>
                  {inviteMsg && (
                    <p className={`text-xs px-3 py-2 rounded-lg ${inviteMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {inviteMsg.text}
                    </p>
                  )}
                  <button type="submit" disabled={inviting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-navy to-navy-500 text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md hover:brightness-105 transition-all disabled:opacity-60">
                    <Mail size={14} /> {inviting ? 'Sending invite...' : 'Send Invite'}
                  </button>
                </form>
              </div>

              {/* Members list */}
              <div className="table-container">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-sky-50/40">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Member</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/80">
                    {loadingMembers
                      ? Array(3).fill(0).map((_, i) => (
                          <tr key={i}>
                            {Array(4).fill(0).map((_, j) => (
                              <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                            ))}
                            <td />
                          </tr>
                        ))
                      : members.map(m => (
                          <tr key={m.id} className="hover:bg-sky-50/20 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-navy/20 to-navy/10 flex items-center justify-center shrink-0">
                                  <span className="text-[10px] font-bold text-navy">{initials(m.full_name)}</span>
                                </div>
                                <span className={`text-sm font-medium ${m.is_active ? 'text-gray-900' : 'text-gray-400'}`}>
                                  {m.full_name || 'Unnamed'}
                                  {m.id === profile?.id && <span className="ml-1.5 text-[10px] text-gray-400">(you)</span>}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {m.id === profile?.id ? (
                                <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium capitalize ${ROLE_COLORS[m.role] || ''}`}>{m.role}</span>
                              ) : (
                                <select value={m.role} onChange={e => handleRoleChange(m.id, e.target.value)}
                                  className="text-xs border border-gray-200/60 rounded-md px-2 py-1 bg-white/80 focus:outline-none focus:ring-1 focus:ring-navy/30 capitalize">
                                  {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                                </select>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs tabular-nums">{fmt(m.created_at)}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${m.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                                {m.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {m.id !== profile?.id && (
                                <button onClick={() => handleToggleActive(m.id, m.is_active)}
                                  title={m.is_active ? 'Deactivate' : 'Reactivate'}
                                  className={`p-1.5 rounded-lg text-xs transition-colors ${m.is_active ? 'text-gray-300 hover:text-red-400 hover:bg-red-50' : 'text-gray-300 hover:text-emerald-500 hover:bg-emerald-50'}`}>
                                  {m.is_active ? <X size={14} /> : <Check size={14} />}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                    }
                  </tbody>
                </table>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
