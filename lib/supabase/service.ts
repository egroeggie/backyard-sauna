import { createClient } from '@supabase/supabase-js'

// NOTE: tables currently live in the "public" schema in production. A prior
// commit tried to move them into a private "app" schema for better isolation,
// but that migration was never actually run against the live database, so
// pointing this client at schema "app" broke every build (Error: Invalid
// schema: app). Reverted to "public" until the real migration is applied
// deliberately, on its own, with the data move verified beforehand.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
