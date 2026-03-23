import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, loading } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'forgot' | 'sent'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />

  async function handleSignIn(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Incorrect email or password.'
        : err.message)
    }
    setSubmitting(false)
  }

  async function handleForgot(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (err) {
      setError(err.message)
    } else {
      setMode('sent')
    }
    setSubmitting(false)
  }

  function switchMode(next) {
    setError('')
    setMode(next)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #0d1f3c 0%, #1B3A6B 50%, #2a4a7f 100%)' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <h1 className="font-display font-semibold text-white text-2xl tracking-tight">
            Villa Concierge Co
          </h1>
          <p className="text-white/40 text-sm mt-1 italic">Where Families Land Softly</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">

          {mode === 'login' && (
            <>
              <h2 className="text-white font-semibold text-lg mb-1">Sign in</h2>
              <p className="text-white/50 text-sm mb-6">Team access only</p>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                    autoComplete="email"
                    placeholder="you@villaconcierge.com"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-gold/60 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-white/60">Password</label>
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs text-white/40 hover:text-white/70 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
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
                  {submitting ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <h2 className="text-white font-semibold text-lg mb-1">Reset password</h2>
              <p className="text-white/50 text-sm mb-6">We'll send a reset link to your email.</p>

              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                    autoComplete="email"
                    placeholder="you@villaconcierge.com"
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
                  {submitting ? 'Sending...' : 'Send Reset Link'}
                </button>

                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="w-full text-center text-xs text-white/40 hover:text-white/70 transition-colors pt-1"
                >
                  Back to sign in
                </button>
              </form>
            </>
          )}

          {mode === 'sent' && (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-white font-semibold text-lg mb-2">Check your email</h2>
              <p className="text-white/50 text-sm mb-6">
                A password reset link was sent to <span className="text-white/70">{email}</span>.
              </p>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                Back to sign in
              </button>
            </div>
          )}

        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Hicks Virtual Solutions LLC
        </p>
      </div>
    </div>
  )
}
