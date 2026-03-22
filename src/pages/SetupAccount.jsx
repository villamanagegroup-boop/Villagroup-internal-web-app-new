import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Check } from 'lucide-react'

export default function SetupAccount() {
  const { user, refreshProfile, setNeedsSetup } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setSaving(true)
    setError(null)

    const { error: authError } = await supabase.auth.updateUser({
      password,
      data: { full_name: fullName },
    })
    if (authError) {
      setError(authError.message)
      setSaving(false)
      return
    }

    if (user?.id) {
      await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id)
    }

    await refreshProfile()
    setNeedsSetup(false)
    navigate('/dashboard', { replace: true })
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #0d1f3c 0%, #1B3A6B 50%, #2a4a7f 100%)' }}
    >
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <p className="font-display font-semibold text-white text-xl">Villa Concierge Co</p>
          <p className="text-white/40 text-xs italic mt-1">Where Families Land Softly</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl px-8 py-8">
          <h1 className="text-white text-lg font-semibold mb-1">Set up your account</h1>
          <p className="text-white/50 text-sm mb-6">Confirm your name and create a password to get started.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                placeholder="Jane Smith"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Min. 8 characters"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                minLength={8}
                placeholder="Re-enter password"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>

            {error && (
              <p className="text-xs bg-red-500/20 text-red-300 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={saving || !password || !confirm}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #c9a84c 0%, #e0b95a 100%)' }}
            >
              <Check size={15} />
              {saving ? 'Saving...' : 'Complete Setup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
