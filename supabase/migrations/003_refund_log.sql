-- Audit trail for partial refunds. Targets the "public" schema, matching
-- where tables actually live in production today (see the note in
-- lib/supabase/service.ts — the planned move to a private "app" schema
-- was never completed and is tracked as separate, deferred work).

create table refund_log (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references bookings(id) on delete cascade,
  spaces_refunded int not null check (spaces_refunded >= 1),
  refund_amount_pence int not null,
  stripe_refund_id text not null,
  created_at timestamptz not null default now()
);

alter table refund_log enable row level security;

create policy "service role full access" on refund_log for all using (auth.role() = 'service_role');
