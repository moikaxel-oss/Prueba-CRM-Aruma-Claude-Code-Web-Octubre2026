-- CRM Aruma: esquema inicial
-- Basado en la estructura del CRM de Fede (contacts, messages, ad_source, ctwa_clid,
-- wamid, status) y ampliado para pipeline, vendedores, historial y compras.
-- Se ejecuta una sola vez en Supabase > SQL Editor.

-- Vendedores / usuarios del equipo (uno por cada usuario de Auth)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'seller' check (role in ('admin', 'seller')),
  created_at timestamptz default now()
);

-- Columnas del pipeline (las crea el usuario)
create table if not exists stages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#4f8cff',
  position double precision not null default 0,
  created_at timestamptz default now()
);

-- Personas. Un contacto puede tener varios leads y varias compras (LTV).
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  phone text unique,
  name text,
  created_at timestamptz default now(),
  blocked boolean default false
);

-- Tarjetas del pipeline. Guarda de qué anuncio de Meta vino.
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete cascade not null,
  stage_id uuid references stages(id) on delete restrict not null,
  position double precision not null default 0,
  owner_id uuid references profiles(id) on delete set null,
  campaign text default '',
  adset text default '',
  ad text default '',
  ad_source text,   -- origen informado por Meta
  ctwa_clid text,   -- id del clic en el anuncio (click to WhatsApp)
  value numeric not null default 0,
  notes text default '',
  created_at timestamptz default now()
);

create index if not exists idx_leads_stage on leads(stage_id, position);
create index if not exists idx_leads_contact on leads(contact_id);
create index if not exists idx_leads_campaign on leads(campaign);

-- Historial de movimientos entre columnas (para medir el cuello de botella).
-- Se llena solo con el trigger de más abajo.
create table if not exists lead_stage_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade not null,
  from_stage_id uuid references stages(id) on delete set null,
  to_stage_id uuid references stages(id) on delete set null,
  changed_at timestamptz default now(),
  changed_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_history_lead on lead_stage_history(lead_id, changed_at);

-- Mensajes de WhatsApp (para medir tiempos de respuesta por vendedor)
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete cascade not null,
  direction text not null check (direction in ('inbound', 'outbound')),
  sender_id uuid references profiles(id) on delete set null, -- vendedor que escribió
  content text not null,
  created_at timestamptz default now(),
  whatsapp_message_id text,
  status text check (status in ('sent', 'delivered', 'read', 'failed'))
);

create index if not exists idx_messages_contact on messages(contact_id, created_at);
create index if not exists idx_messages_wamid on messages(whatsapp_message_id)
  where whatsapp_message_id is not null;

-- Compras (para ciclo de venta, recompra y LTV)
create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete cascade not null,
  lead_id uuid references leads(id) on delete set null,
  amount numeric not null check (amount >= 0),
  purchased_at timestamptz not null default now(),
  channel text default 'whatsapp'
);

create index if not exists idx_purchases_contact on purchases(contact_id, purchased_at);

-- Configuración general
create table if not exists settings (
  key text primary key,
  value text not null
);

-- Registra solo cada cambio de columna
create or replace function log_stage_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into lead_stage_history (lead_id, from_stage_id, to_stage_id, changed_by)
    values (new.id, null, new.stage_id, auth.uid());
  elsif new.stage_id is distinct from old.stage_id then
    insert into lead_stage_history (lead_id, from_stage_id, to_stage_id, changed_by)
    values (new.id, old.stage_id, new.stage_id, auth.uid());
  end if;
  return new;
end $$;

drop trigger if exists trg_leads_stage_history on leads;
create trigger trg_leads_stage_history
  after insert or update of stage_id on leads
  for each row execute function log_stage_change();

-- Crea el perfil automáticamente cuando se da de alta un usuario
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end $$;

drop trigger if exists trg_new_user on auth.users;
create trigger trg_new_user
  after insert on auth.users
  for each row execute function handle_new_user();

-- Seguridad: solo usuarios con sesión iniciada pueden leer y escribir.
-- El servidor (webhook de WhatsApp) usa la clave service_role, que se salta estas reglas.
alter table profiles enable row level security;
alter table stages enable row level security;
alter table contacts enable row level security;
alter table leads enable row level security;
alter table lead_stage_history enable row level security;
alter table messages enable row level security;
alter table purchases enable row level security;
alter table settings enable row level security;

do $$
declare t text;
begin
  foreach t in array array['profiles','stages','contacts','leads','messages','purchases','settings']
  loop
    execute format('drop policy if exists "team_all" on %I', t);
    execute format(
      'create policy "team_all" on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

drop policy if exists "team_read_history" on lead_stage_history;
create policy "team_read_history" on lead_stage_history
  for select to authenticated using (true);

-- Permisos de acceso a la API. Las tablas no se exponen solas:
-- solo el equipo con sesión iniciada (authenticated) y el servidor (service_role).
-- El rol anónimo (anon) no recibe nada.
grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
-- El historial solo se lee desde el CRM; lo escribe el trigger
revoke insert, update, delete on lead_stage_history from authenticated;
