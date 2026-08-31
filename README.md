# Calendario Freelancer vía WhatsApp

App de calendario + cobros para freelancers, operada 100% desde WhatsApp.
El usuario carga eventos, entregas y cobros por chat en lenguaje natural; un
bot los categoriza y confirma. Una app web muestra el panorama completo:
calendario, cobros pendientes e historial de clientes.

## Propuesta de valor

"Organizá tu laburo sin salir de WhatsApp, mirá todo claro en la app."

Ninguna app de calendario trackea plata. Ninguna app de finanzas tiene
calendario. Esta une las dos cosas que le importan a un freelancer: su
tiempo y su plata, cargado sin fricción desde WhatsApp.

## Estructura del repo

- parser/ - Prototipo de parseo de mensajes en lenguaje natural (Python + Claude API)
- backend/ - API + webhook de WhatsApp Cloud API (Node.js + Express)
- frontend/ - App web: calendario semanal, cobros pendientes (React + Vite)

## Stack tecnico

| Componente | Tecnologia |
|---|---|
| Backend | Node.js + Express |
| Base de datos | PostgreSQL (Supabase) |
| WhatsApp | Cloud API de Meta (directa) |
| Parseo de mensajes | Claude API (Anthropic) |
| Frontend | React + Vite |
| Recordatorios | Cron jobs (node-cron) |

## Roadmap (5 fases, ~10 semanas)

- Fase 0 - DB + parser + alta Meta Business
- Fase 1 - Backend / webhook de WhatsApp
- Fase 2 - App web
- Fase 3 - Piloto con 10-20 freelancers
- Fase 4 - Freemium

## Setup rapido

Cada subcarpeta tiene su propio README.md con instrucciones de instalacion
y variables de entorno (.env.example).
