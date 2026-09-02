-- Esquema de base de datos - Calendario Freelancer via WhatsApp
-- Motor: PostgreSQL (Supabase)
--
-- Como aplicarlo: pegar este archivo completo en Supabase -> SQL Editor -> New query -> Run.
-- Ver backend/db/README.md para mas detalle.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tipos enumerados
-- ---------------------------------------------------------------------

create type plan_usuario as enum ('free', 'pro');
create type tipo_evento as enum ('reunion', 'entrega');
create type estado_evento as enum ('pendiente', 'completado', 'cancelado');
create type estado_cobro as enum ('pendiente', 'pagado');
create type direccion_mensaje as enum ('entrante', 'saliente');

-- ---------------------------------------------------------------------
-- usuarios: un freelancer, identificado por su numero de WhatsApp
-- ---------------------------------------------------------------------

create table usuarios (
  id uuid primary key default gen_random_uuid(),
  telefono_whatsapp text not null unique,
  nombre text,
  plan plan_usuario not null default 'free',
  zona_horaria text not null default 'America/Argentina/Buenos_Aires',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

comment on table usuarios is 'Un freelancer/emprendedor. El numero de WhatsApp es la identidad principal.';

-- ---------------------------------------------------------------------
-- clientes: los clientes de cada freelancer (scoped por usuario_id)
-- ---------------------------------------------------------------------

create table clientes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  nombre text not null,
  creado_en timestamptz not null default now(),
  unique (usuario_id, nombre)
);

comment on table clientes is 'Clientes del freelancer. El nombre es como lo escribe el freelancer por WhatsApp (ej. "Perez", "Gomez").';

-- ---------------------------------------------------------------------
-- eventos: reuniones y entregas
-- ---------------------------------------------------------------------

create table eventos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  cliente_id uuid references clientes(id) on delete set null,
  tipo tipo_evento not null,
  titulo text not null,
  fecha date not null,
  hora time,
  estado estado_evento not null default 'pendiente',
  notas text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

comment on table eventos is 'Reuniones y entregas agendadas. cliente_id es nullable porque no todos los eventos tienen un cliente asociado.';

create index eventos_usuario_fecha_idx on eventos (usuario_id, fecha);
create index eventos_usuario_estado_idx on eventos (usuario_id, estado);

-- ---------------------------------------------------------------------
-- cobros: pagos pendientes y pagados
-- ---------------------------------------------------------------------

create table cobros (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  cliente_id uuid not null references clientes(id) on delete cascade,
  monto numeric(12, 2) not null check (monto > 0),
  moneda text not null default 'ARS',
  fecha_vencimiento date,
  estado estado_cobro not null default 'pendiente',
  fecha_pago date,
  notas text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

comment on table cobros is 'Cobros pendientes o ya pagados. fecha_vencimiento es nullable (el parser a veces no puede resolver una fecha exacta).';

create index cobros_usuario_estado_idx on cobros (usuario_id, estado);

-- ---------------------------------------------------------------------
-- mensajes: log de conversacion de WhatsApp
--
-- Guarda cada mensaje entrante/saliente junto con la accion que el
-- parser extrajo (si la hubo). Sirve para: (1) auditoria/debug del
-- parser, y (2) es la base para resolver en el futuro los casos que hoy
-- el parser no puede (ej. "cancelalo" sin contexto) dandole al parser
-- los ultimos N mensajes como contexto.
-- ---------------------------------------------------------------------

create table mensajes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  direccion direccion_mensaje not null,
  contenido text not null,
  accion_parseada jsonb,
  evento_id uuid references eventos(id) on delete set null,
  cobro_id uuid references cobros(id) on delete set null,
  creado_en timestamptz not null default now()
);

comment on table mensajes is 'Historial de mensajes de WhatsApp. accion_parseada guarda el JSON crudo que devolvio parser.py.';

create index mensajes_usuario_creado_idx on mensajes (usuario_id, creado_en desc);

-- ---------------------------------------------------------------------
-- Trigger generico para mantener actualizado_en
-- ---------------------------------------------------------------------

create or replace function set_actualizado_en()
returns trigger as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$ language plpgsql;

create trigger usuarios_set_actualizado_en
  before update on usuarios
  for each row execute function set_actualizado_en();

create trigger eventos_set_actualizado_en
  before update on eventos
  for each row execute function set_actualizado_en();

create trigger cobros_set_actualizado_en
  before update on cobros
  for each row execute function set_actualizado_en();

-- ---------------------------------------------------------------------
-- Row Level Security
--
-- Habilitada pero sin policies de usuario final todavia: el backend usa
-- la service_role key (bypassea RLS) para escribir/leer en nombre del
-- bot de WhatsApp. Cuando exista login de freelancers en la app web
-- (Supabase Auth), agregar policies que filtren por auth.uid() = usuario_id
-- de forma analoga a la de ejemplo comentada abajo.
-- ---------------------------------------------------------------------

alter table usuarios enable row level security;
alter table clientes enable row level security;
alter table eventos enable row level security;
alter table cobros enable row level security;
alter table mensajes enable row level security;

-- Ejemplo de policy para cuando haya Supabase Auth (dejar comentado hasta entonces):
-- create policy "usuarios_ven_sus_propios_eventos" on eventos
--   for select using (usuario_id = auth.uid());
