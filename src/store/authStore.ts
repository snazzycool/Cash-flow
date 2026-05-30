import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/supabase'

interface AuthState {
  user: Profile | null
  session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'] | null
  loading: boolean
 Initialized: boolean
  isAdmin: boolean
  signUp: (email: string, password: string, username: string, referralCode?: string) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  fetchProfile: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>
  refreshSession: () => Promise<void>
  setSession: (session: AuthState['session']) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,
      Initialized: false,
      isAdmin: false,

      signUp: async (email, password, username, referralCode) => {
        try {
          const metadata: Record<string, string> = { username }
          if (referralCode) {
            metadata.referral_code = referralCode
          }

          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: metadata,
            },
          })

          if (error) {
            return { error: new Error(error.message) }
          }

          return { error: null }
        } catch (e) {
          return { error: e instanceof Error ? e : new Error('Unknown error') }
        }
      },

      signIn: async (email, password) => {
        try {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) {
            return { error: new Error(error.message) }
          }

          await get().fetchProfile()
          return { error: null }
        } catch (e) {
          return { error: e instanceof Error ? e : new Error('Unknown error') }
        }
      },

      signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, session: null, isAdmin: false })
      },

      fetchProfile: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()

          if (!session?.user) {
            set({ user: null, session: null, loading: false, Initialized: true })
            return
          }

          set({ session })

          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle()

          if (error) {
            console.error('Error fetching profile:', error)
            set({ user: null, loading: false, Initialized: true })
            return
          }

          // Check if user is admin
          const { data: adminData } = await supabase
            .from('admin_users')
            .select('role')
            .eq('user_id', session.user.id)
            .maybeSingle()

          set({
            user: profile,
            isAdmin: !!adminData,
            loading: false,
            Initialized: true
          })
        } catch (error) {
          console.error('Error in fetchProfile:', error)
          set({ user: null, session: null, loading: false, Initialized: true })
        }
      },

      updateProfile: async (updates) => {
        const { user } = get()
        if (!user) return { error: new Error('Not authenticated') }

        try {
          const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)

          if (error) {
            return { error: new Error(error.message) }
          }

          set({ user: { ...user, ...updates } })
          return { error: null }
        } catch (e) {
          return { error: e instanceof Error ? e : new Error('Unknown error') }
        }
      },

      refreshSession: async () => {
        const { data: { session } } = await supabase.auth.getSession()
        set({ session })
        if (session?.user) {
          await get().fetchProfile()
        }
      },

      setSession: (session) => {
        set({ session })
        if (session?.user) {
          get().fetchProfile()
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Only persist session, not full user state
        session: state.session
      }),
    }
  )
)

// Set up auth state listener
supabase.auth.onAuthStateChange((event, session) => {
  const { fetchProfile, setSession } = useAuthStore.getState()

  if (event === 'SIGNED_IN' && session) {
    setSession(session)
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ user: null, session: null, isAdmin: false })
  } else if (event === 'TOKEN_REFRESHED' && session) {
    setSession(session)
  }
})

// Initialize auth state on load
if (typeof window !== 'undefined') {
  useAuthStore.getState().fetchProfile()
}
