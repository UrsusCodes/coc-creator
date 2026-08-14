import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
  )
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key',
  {
    auth: {
      // Akta Kasandry lives on the SAME origin (ursuscodes.github.io) and the
      // SAME Supabase project, and signs its users in via Supabase Auth. With
      // default settings supabase-js would adopt that persisted session from
      // localStorage (sb-<ref>-auth-token) and send its JWT on every PostgREST
      // request — flipping our role from `anon` (which has RLS policies) to
      // `authenticated` (which has none), so every direct read silently
      // returns zero rows ("Nieprawidłowy kod zaproszenia" etc.).
      // This app authenticates via its own custom scheme; the shared client
      // must stay anon-only: never load, persist, or refresh auth sessions.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
)
