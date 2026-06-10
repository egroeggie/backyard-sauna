-- Move all tables out of public into a dedicated app schema.
-- The app schema is NOT exposed to the anon or authenticated roles,
-- so direct REST API queries with the anon key are blocked at the
-- Postgres grant level before RLS even runs.
-- The service_role (used exclusively by server-side code) retains full access.
--
-- After running this migration, go to:
--   Supabase dashboard → Settings → API → Exposed schemas
-- and add "app" to the list so PostgREST can serve service_role requests.

create schema if not exists app;

-- Move tables (FK constraints, indexes, and RLS policies follow automatically)
alter table public.events          set schema app;
alter table public.slots           set schema app;
alter table public.bookings        set schema app;
alter table public.waiver_signatures set schema app;
alter table public.reminder_log    set schema app;

-- The "public read slots" policy references the events table unqualified.
-- Recreate it with an explicit schema reference to avoid search_path ambiguity.
drop policy if exists "public read slots" on app.slots;
create policy "public read slots" on app.slots
  for select using (
    exists (
      select 1 from app.events
      where app.events.id = app.slots.event_id
        and app.events.is_published = true
    )
  );

-- Block anon and authenticated roles from the app schema entirely.
revoke usage on schema app from anon, authenticated;
revoke all on all tables in schema app from anon, authenticated;
revoke all on all sequences in schema app from anon, authenticated;

-- Ensure service_role has full access.
grant usage on schema app to service_role;
grant all on all tables in schema app to service_role;
grant all on all sequences in schema app to service_role;
