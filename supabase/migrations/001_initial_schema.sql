create extension if not exists "uuid-ossp";

create table events (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  date date not null,
  location text not null,
  description text not null,
  image_url text,
  price_pence int not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table slots (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references events(id) on delete cascade,
  start_time time not null,
  end_time time not null,
  capacity int not null default 12
);

create table bookings (
  id uuid primary key default uuid_generate_v4(),
  slot_id uuid not null references slots(id) on delete cascade,
  name text not null,
  email text not null,
  spaces int not null check (spaces >= 1 and spaces <= 12),
  stripe_payment_id text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  waiver_accepted boolean not null default false,
  created_at timestamptz not null default now()
);

create table waiver_signatures (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references bookings(id) on delete cascade,
  name text,
  email text,
  token uuid not null unique default uuid_generate_v4(),
  signed_at timestamptz
);

create table reminder_log (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references bookings(id) on delete cascade,
  sent_at timestamptz not null default now()
);

alter table events enable row level security;
alter table slots enable row level security;
alter table bookings enable row level security;
alter table waiver_signatures enable row level security;
alter table reminder_log enable row level security;

create policy "public read published events" on events
  for select using (is_published = true);

create policy "public read slots" on slots
  for select using (
    exists (select 1 from events where events.id = slots.event_id and events.is_published = true)
  );

create policy "service role full access" on events for all using (auth.role() = 'service_role');
create policy "service role full access" on slots for all using (auth.role() = 'service_role');
create policy "service role full access" on bookings for all using (auth.role() = 'service_role');
create policy "service role full access" on waiver_signatures for all using (auth.role() = 'service_role');
create policy "service role full access" on reminder_log for all using (auth.role() = 'service_role');
