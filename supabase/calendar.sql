-- Calendario de contenido (Aruma y Soft Line) con edición compartida e historial.
-- Se ejecuta una sola vez en Supabase > SQL Editor, después de schema.sql.
-- Luego correr supabase/calendar-seed.sql para cargar el contenido inicial.

create table if not exists cal_posts (
  id uuid primary key default gen_random_uuid(),
  brand text not null check (brand in ('aruma', 'softline')),
  channel text not null check (channel in ('org', 'ads')),
  year int not null default 2026,
  month int not null check (month between 1 and 12),
  day int not null check (day between 1 and 31),
  format text check (format in ('R', 'C', 'H')),  -- Reel, Carrusel, Historia
  status smallint not null default 0 check (status in (0, 1, 2)), -- por hacer, diseñado, programado
  text text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_cal_posts_view on cal_posts(brand, channel, year, month);

-- Quién cambió qué y cuándo. Lo llena solo el trigger de más abajo.
create table if not exists cal_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  user_name text,
  action text not null check (action in ('insert', 'update', 'delete')),
  post_id uuid,
  brand text,
  channel text,
  month int,
  day int,
  text text,                       -- texto del post (para leer el historial sin cruzar tablas)
  changes jsonb not null default '{}'::jsonb  -- { campo: [antes, después] }
);

create index if not exists idx_cal_log_at on cal_log(at desc);

create or replace function cal_posts_audit() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  uname text;
  diff jsonb := '{}'::jsonb;
begin
  if tg_op = 'UPDATE' then
    new.updated_at := now();
    new.updated_by := uid;
  end if;

  -- Cambios hechos desde el SQL Editor o el servidor (sin usuario) no se registran
  if uid is null then
    return coalesce(new, old);
  end if;

  select coalesce(full_name, '') into uname from profiles where id = uid;
  if coalesce(uname, '') = '' then
    select email into uname from auth.users where id = uid;
  end if;

  if tg_op = 'INSERT' then
    insert into cal_log (user_id, user_name, action, post_id, brand, channel, month, day, text)
    values (uid, uname, 'insert', new.id, new.brand, new.channel, new.month, new.day, new.text);
    return new;
  elsif tg_op = 'DELETE' then
    insert into cal_log (user_id, user_name, action, post_id, brand, channel, month, day, text)
    values (uid, uname, 'delete', old.id, old.brand, old.channel, old.month, old.day, old.text);
    return old;
  end if;

  if new.status is distinct from old.status then
    diff := diff || jsonb_build_object('status', jsonb_build_array(old.status, new.status));
  end if;
  if new.format is distinct from old.format then
    diff := diff || jsonb_build_object('format', jsonb_build_array(old.format, new.format));
  end if;
  if new.text is distinct from old.text then
    diff := diff || jsonb_build_object('text', jsonb_build_array(old.text, new.text));
  end if;
  if new.day is distinct from old.day then
    diff := diff || jsonb_build_object('day', jsonb_build_array(old.day, new.day));
  end if;

  if diff <> '{}'::jsonb then
    insert into cal_log (user_id, user_name, action, post_id, brand, channel, month, day, text, changes)
    values (uid, uname, 'update', new.id, new.brand, new.channel, new.month, new.day, new.text, diff);
  end if;
  return new;
end $$;

drop trigger if exists trg_cal_posts_audit on cal_posts;
create trigger trg_cal_posts_audit
  before insert or update or delete on cal_posts
  for each row execute function cal_posts_audit();

-- Seguridad: solo el equipo con sesión iniciada. El historial es de solo lectura.
alter table cal_posts enable row level security;
alter table cal_log enable row level security;

drop policy if exists "team_all" on cal_posts;
create policy "team_all" on cal_posts for all to authenticated using (true) with check (true);
drop policy if exists "team_read" on cal_log;
create policy "team_read" on cal_log for select to authenticated using (true);

grant select, insert, update, delete on cal_posts to authenticated;
grant select on cal_log to authenticated;
grant all on cal_posts, cal_log to service_role;

-- Tiempo real: cada cambio le llega al resto del equipo sin recargar
alter publication supabase_realtime add table cal_posts;
alter publication supabase_realtime add table cal_log;
