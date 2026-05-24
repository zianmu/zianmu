import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return null instead of throwing - allows app to render while env loads
    return null as unknown as ReturnType<typeof createBrowserClient>
  }

  // Use singleton pattern for browser client
  if (!client) {
    client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }

  return client
}
