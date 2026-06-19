import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '⚠️ Supabase credentials not found. Create a .env file based on .env.example.\n' +
    '   The app will run in offline mode — data fetching will return empty results.'
  )
}

/**
 * If credentials are missing we create a lightweight stub that
 * mimics the Supabase client surface so the frontend can render
 * without crashing during local dev without a backend.
 */
const createStubClient = () => {
  const emptyResponse = { data: [], error: null }
  const queryBuilder = {
    select: () => queryBuilder,
    insert: () => queryBuilder,
    update: () => queryBuilder,
    delete: () => queryBuilder,
    eq: () => queryBuilder,
    order: () => queryBuilder,
    single: () => Promise.resolve(emptyResponse),
    then: (resolve) => resolve(emptyResponse),
  }

  return {
    from: () => queryBuilder,
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: () => Promise.resolve(),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    },
  }
}

export const supabase = (!supabaseUrl || !supabaseKey)
  ? createStubClient()
  : createClient(supabaseUrl, supabaseKey)

if (typeof window !== 'undefined') {
  window.supabase = supabase
}
