import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the user lands via the reset link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setSubmitting(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) {
      setError(err.message)
    } else {
      setDone(true)
      await supabase.auth.signOut()
    }
    setSubmitting(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #0d1f3c 0%, #1B3A6B 50%, #2a4a7f 100%)' }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display font-semibold text-white text-2xl tracking-tight">
            Villa Concierge Co
          </h1>
          <p className="text-white/40 text-sm mt-1 italic">Where Families Land Softly</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">

          {done ? (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-white font-semibold text-lg mb-2">Password updated</h2>
              <p className="text-white/50 text-sm mb-6">You can now sign in with your new password.</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 bg-gradient-to-r from-gold to-gold-500 text-white font-semibold rounded-lg text-sm shadow-md hover:brightness-105 transition-all"
              >
                Go to Sign In
              </button>
            </div>
          ) : !ready ? (
            <div className="text-center py-4">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/50 text-sm">Verifying reset link...</p>
              <p className="text-white/30 text-xs mt-4">
                Link not working?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-white/50 hover:text-white/70 underline transition-colors"
                >
                  Request a new one
                </button>
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-white font-semibold text-lg mb-1">Set new password</h2>
              <p className="text-white/50 text-sm mb-6">Choose a strong password for your account.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">New password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoFocus
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-gold/60 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Confirm password</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-gold/60 focus:border-transparent transition-all"
                  />
                </div>

                {error && (
                  <p className="text-red-300 text-xs bg-red-500/10 border border-red-400/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-gradient-to-r from-gold to-gold-500 text-white font-semibold rounded-lg text-sm shadow-md hover:brightness-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {submitting ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </>
          )}

        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Hicks Virtual Solutions LLC
        </p>
      </div>
    </div>
  )
}
