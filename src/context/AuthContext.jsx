import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Capture invite flag synchronously before Supabase processes the URL hash
const _wasInviteFlow = typeof window !== 'undefined' &&
  window.location.hash.includes('type=invite')

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(_wasInviteFlow)

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data ?? null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        if (event === 'SIGNED_IN' && _wasInviteFlow) {
          setNeedsSetup(true)
        }
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      role: profile?.role ?? null,
      loading,
      needsSetup,
      setNeedsSetup,
      signOut,
      refreshProfile: () => user && fetchProfile(user.id),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

// Role helpers — use these anywhere to gate UI
export function canWrite(role) {
  return ['admin', 'manager', 'agent'].includes(role)
}

export function canDelete(role) {
  return ['admin', 'manager'].includes(role)
}

export function isAdmin(role) {
  return role === 'admin'
}
