import { createClient } from '@supabase/supabase-js'

// Application tables live in the private "app" schema (see
// supabase/migrations/006_app_schema_isolation.sql), not "public" — this
// isolates them from the anon/authenticated PostgREST roles at the grant
// level. Requires "app" to be added to Exposed Schemas in the Supabase
// dashboard (Settings -> API) for this to work; without that step every
// request from this client fails with "Invalid schema: app".
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'app' } }
  )
}
