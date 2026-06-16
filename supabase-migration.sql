-- ACO Workspace — schema inicial
-- Correr en Supabase SQL Editor: https://supabase.com/dashboard/project/joquvwudvzkuwurwpfhv/sql

-- 1. Extension (debe ir primero)
create extension if not exists btree_gist;

-- 2. Rooms
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  sede text not null check (sede in ('Palermo', 'Microcentro')),
  capacity int not null default 1,
  price_per_hour numeric(10,2),
  price_per_day numeric(10,2),
  amenities text[] not null default '{}',
  images text[] not null default '{}',
  available_days int[] not null default '{1,2,3,4,5}',
  available_from time not null default '09:00',
  available_to time not null default '20:00',
  is_active boolean not null default true,
  google_calendar_id text,
  created_at timestamptz not null default now()
);

-- 3. Bookings (sin EXCLUDE para simplificar, lo manejamos a nivel app)
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  guest_name text,
  guest_email text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'pending')),
  google_event_id text,
  notes text,
  created_at timestamptz not null default now()
);

-- 4. RLS
alter table rooms enable row level security;
alter table bookings enable row level security;

create policy "rooms_public_read" on rooms for select using (is_active = true);
create policy "rooms_admin_all" on rooms for all using (auth.role() = 'authenticated');

create policy "bookings_insert_any" on bookings for insert with check (true);
create policy "bookings_select" on bookings for select using (
  auth.uid() = user_id or auth.role() = 'authenticated'
);
create policy "bookings_admin_update" on bookings for update using (auth.role() = 'authenticated');

-- 5. Indexes
create index if not exists bookings_room_time on bookings(room_id, start_time, end_time);
create index if not exists bookings_status on bookings(status);

-- 6. Salas de ejemplo (opcionales)
insert into rooms (name, description, sede, capacity, price_per_hour, amenities, available_days, available_from, available_to) values
(
  'Sala Roble',
  'Sala de reuniones equipada con proyector y pizarrón.',
  'Palermo', 8, 5000,
  ARRAY['Proyector HD', 'Pizarrón', 'WiFi', 'Aire acondicionado', 'Café y agua'],
  ARRAY[1,2,3,4,5], '09:00', '20:00'
),
(
  'Sala Ciprés',
  'Sala íntima para reuniones pequeñas y videollamadas.',
  'Palermo', 4, 3000,
  ARRAY['Pantalla 55"', 'Cámara para videoconferencias', 'WiFi', 'Insonorizada'],
  ARRAY[1,2,3,4,5], '09:00', '20:00'
),
(
  'Sala Laurel',
  'Sala ejecutiva con vista a la calle.',
  'Microcentro', 10, 6000,
  ARRAY['Proyector 4K', 'Sistema de audio', 'Café y snacks', 'Aire acondicionado'],
  ARRAY[1,2,3,4,5], '08:00', '21:00'
)
on conflict do nothing;
