-- Lets admins hide stale events from the default list without destroying
-- data. Targets "public" (see the note in lib/supabase/service.ts).

alter table events add column if not exists archived boolean not null default false;
