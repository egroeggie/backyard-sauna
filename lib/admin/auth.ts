import { createClient } from '@/lib/supabase/server'

export async function requireAdmin(): Promise<boolean> {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  return !!user
}
