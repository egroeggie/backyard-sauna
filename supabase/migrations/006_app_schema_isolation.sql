-- Moves all application tables from "public" into a private "app" schema,
-- so direct REST access with the anon/authenticated key is blocked at the
-- Postgres grant level before RLS even runs. service_role (used exclusively
-- by server-side code) retains full access.
--
-- IMPORTANT: after this migration commits, the "app" schema must be added
-- to Exposed Schemas in the Supabase dashboard (Settings -> API) before any
-- code pointed at schema "app" will work -- there is no documented SQL-only
-- way to do this part. Until that manual step is done AND
-- lib/supabase/service.ts is deployed pointing at "app", the site is down.

begin;

create schema if not exists app;

alter table public.events set schema app;
alter table public.slots set schema app;
alter table public.bookings set schema app;
alter table public.waiver_signatures set schema app;
alter table public.reminder_log set schema app;
alter table public.attendance_email_log set schema app;
alter table public.refund_log set schema app;

-- "public read slots" references events unqualified; requalify now that
-- app isn't on the evaluating role's search_path.
drop policy if exists "public read slots" on app.slots;
create policy "public read slots" on app.slots
  for select using (
    exists (
      select 1 from app.events
      where app.events.id = app.slots.event_id
        and app.events.is_published = true
    )
  );

-- attendance_email_log had RLS enabled with zero policies (a pre-existing
-- gap -- service_role bypasses RLS regardless, but add one for consistency
-- with every other table here).
create policy "service role full access" on app.attendance_email_log
  for all using (auth.role() = 'service_role');

revoke usage on schema app from anon, authenticated;
revoke all on all tables in schema app from anon, authenticated;
revoke all on all sequences in schema app from anon, authenticated;

grant usage on schema app to service_role;
grant all on all tables in schema app to service_role;
grant all on all sequences in schema app to service_role;

commit;
