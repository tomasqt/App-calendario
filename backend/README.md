# Backend

API + webhook de WhatsApp Cloud API. Node.js + Express.

## Setup

```bash
npm install
cp ../.env.example ../.env   # completar con tus credenciales
npm run dev
```

Corre en `http://localhost:3000` por default (`PORT` en `.env`).

## Endpoints

- `GET /health` — healthcheck
- `GET /webhook` — verificación del webhook de WhatsApp (Meta)
- `POST /webhook` — mensajes entrantes de WhatsApp
- `GET /api/events` — eventos del calendario (mock hasta que esté la DB)
- `GET /api/payments` — cobros pendientes (mock)
- `GET /api/clients` — historial de clientes (mock)

## Base de datos

Esquema completo en `db/schema.sql` (usuarios, clientes, eventos, cobros,
mensajes) — ver `db/README.md` para cómo aplicarlo en Supabase.
`src/services/db.js` ya implementa las queries reales contra ese esquema
(usa `@supabase/supabase-js` con la `service_role` key).

## Pendiente (Fase 0 / Fase 1)

- [x] Esquema real de Supabase (`db/schema.sql`) y `src/services/db.js`
      implementado contra ese esquema
- [ ] Conectar el webhook al parser de mensajes (`../parser/`) y a
      `src/services/db.js` (hoy son piezas separadas: el webhook solo
      hace eco, no persiste nada todavía)
- [ ] Reemplazar los datos mock de `src/routes/api.js` por las queries
      reales de `src/services/db.js`
- [ ] Cron para el resumen diario 8am y recordatorios de cobro/entrega
- [ ] Alta de cuenta Meta Business + número de WhatsApp Business
