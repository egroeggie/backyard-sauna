-- Day-of check-in, tracked per person (per waiver row), matching the
-- existing one-waiver-per-space model. Targets "public" (see the note in
-- lib/supabase/service.ts -- the "app" schema migration is deferred).

alter table waiver_signatures add column if not exists checked_in_at timestamptz;

alter table waiver_signatures add constraint waiver_signatures_checkin_requires_signed
  check (checked_in_at is null or signed_at is not null);
