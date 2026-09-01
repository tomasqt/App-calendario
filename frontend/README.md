# Frontend

App web: calendario semanal + panel de cobros pendientes. React + Vite.

## Setup

```bash
npm install
npm run dev
```

Corre en `http://localhost:5173` y proxea `/api` hacia el backend en
`http://localhost:3000` (ver `vite.config.js`) — así que el backend tiene
que estar corriendo (`npm run dev` en `../backend/`) para ver datos.

## Estructura

```
src/
├── main.jsx                    # entry point
├── App.jsx                     # layout principal, fetch de eventos/pagos
├── api.js                      # cliente fetch hacia /api
├── styles.css
└── components/
    ├── WeekCalendar.jsx        # vista semanal, eventos coloreados por tipo
    └── PendingPayments.jsx     # tabla de cobros pendientes
```

## Pendiente (Fase 2)

- [ ] Vista mensual (MVP solo pide semanal)
- [ ] Historial de clientes (`/api/clients` ya existe, falta la vista)
- [ ] Resumen mensual (facturado / cobrado / adeudado)
- [ ] Auth (probablemente vía Supabase Auth, ligado al número de WhatsApp)
