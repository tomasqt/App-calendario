# Base de datos (Supabase)

## Setup

1. Crear una cuenta y un proyecto nuevo en [supabase.com](https://supabase.com)
   (plan free alcanza para el MVP).
2. En el proyecto: **SQL Editor -> New query**, pegar todo el contenido de
   `schema.sql` y ejecutar (**Run**).
3. En **Project Settings -> API**, copiar `Project URL` y la
   `service_role` key (no la `anon` key -- el backend necesita bypassear
   RLS para escribir en nombre del bot) a tu `.env`:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

La `service_role` key tiene acceso total a la base -- nunca exponerla en
el frontend ni commitearla al repo.

## Tablas

| Tabla | Que guarda |
|---|---|
| `usuarios` | Un freelancer, identificado por su numero de WhatsApp |
| `clientes` | Los clientes de cada freelancer |
| `eventos` | Reuniones y entregas (calendario) |
| `cobros` | Cobros pendientes y pagados |
| `mensajes` | Historial de mensajes de WhatsApp + la accion que el parser extrajo de cada uno |

Diagrama de relaciones:

```
usuarios 1---N clientes
usuarios 1---N eventos  N---1 clientes (nullable)
usuarios 1---N cobros   N---1 clientes
usuarios 1---N mensajes
```

## Por que existe la tabla `mensajes`

No es parte del MVP funcional, pero es barata de tener desde el dia uno y
resuelve dos problemas identificados en `parser/README.md`:

1. **Auditoria**: poder ver que interpreto el parser de cada mensaje real
   (columna `accion_parseada`, el JSON crudo de `parser.py`).
2. **Contexto conversacional**: el caso limite "cancelalo" (sin decir que)
   no se puede resolver mirando un solo mensaje aislado. Con el historial
   en `mensajes`, mas adelante se le puede pasar al parser los ultimos N
   mensajes del usuario como contexto para resolver referencias.

## RLS (Row Level Security)

Esta habilitado en todas las tablas pero sin policies todavia -- el
backend usa la `service_role` key, que bypassea RLS, porque quien escribe
los datos es el webhook de WhatsApp, no un usuario logueado directamente.
Cuando la app web tenga login (Supabase Auth, probablemente atado al
numero de WhatsApp), hay que agregar policies para que cada freelancer
solo pueda leer sus propios datos desde el frontend -- hay un ejemplo
comentado al final de `schema.sql`.

## Actualizar el esquema mas adelante

Este proyecto no tiene todavia un sistema de migraciones (Supabase CLI /
`supabase migration new`). Para el MVP, cambios de esquema se hacen a mano
en el SQL Editor y se reflejan editando `schema.sql`. Si el proyecto
crece, migrar a `supabase db diff` / CLI para tener historial versionado
de cambios de esquema.
