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

## Pendiente (Fase 0 / Fase 1)

- [ ] Esquema real de Supabase (`src/services/db.js` tiene el borrador de
      tablas comentado)
- [ ] Conectar el webhook al parser de mensajes (`../parser/`)
- [ ] Reemplazar los datos mock de `src/routes/api.js` por queries reales
- [ ] Cron para el resumen diario 8am y recordatorios de cobro/entrega
- [ ] Alta de cuenta Meta Business + número de WhatsApp Business
