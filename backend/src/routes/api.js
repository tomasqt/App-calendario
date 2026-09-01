import { Router } from "express";

const router = Router();

/**
 * Endpoints consumidos por la app web. Devuelven datos mock por ahora —
 * se reemplaza por queries reales (src/services/db.js) cuando esté el
 * esquema de Supabase (Fase 0).
 */

router.get("/events", (_req, res) => {
  res.json([
    { id: "1", tipo: "reunion", titulo: "Call con López", cliente: "López", fecha: "2026-09-02", hora: "10:00" },
    { id: "2", tipo: "entrega", titulo: "Entregar diseño", cliente: "Gómez", fecha: "2026-09-01", hora: null },
    { id: "3", tipo: "reunion", titulo: "Reunión con Pérez", cliente: "Pérez", fecha: "2026-09-04", hora: "15:00" },
  ]);
});

router.get("/payments", (_req, res) => {
  res.json([
    { id: "1", cliente: "Fernández", monto: 35000, moneda: "ARS", diasPendiente: 12, estado: "pendiente" },
    { id: "2", cliente: "Martínez", monto: 50000, moneda: "ARS", diasPendiente: 3, estado: "pendiente" },
  ]);
});

router.get("/clients", (_req, res) => {
  res.json([
    { id: "1", nombre: "Pérez", trabajosRealizados: 4, facturadoTotal: 180000 },
    { id: "2", nombre: "Gómez", trabajosRealizados: 2, facturadoTotal: 90000 },
    { id: "3", nombre: "Fernández", trabajosRealizados: 1, facturadoTotal: 35000 },
  ]);
});

export default router;
