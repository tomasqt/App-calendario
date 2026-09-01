/**
 * Cliente de base de datos (Supabase).
 *
 * TODO (Fase 0): diseñar el esquema real (usuarios, eventos, cobros,
 * clientes) y reemplazar este stub por queries reales con
 * @supabase/supabase-js o pg directo.
 *
 * Tablas previstas (borrador, ver roadmap Fase 0):
 *   - usuarios(id, telefono_whatsapp, nombre, plan, creado_en)
 *   - clientes(id, usuario_id, nombre, creado_en)
 *   - eventos(id, usuario_id, cliente_id, tipo['reunion'|'entrega'],
 *             titulo, fecha, hora, estado['pendiente'|'completado'|'cancelado'])
 *   - cobros(id, usuario_id, cliente_id, monto, moneda, fecha_vencimiento,
 *            estado['pendiente'|'pagado'], creado_en)
 */

export async function getUpcomingEvents(_userId) {
  throw new Error("db.getUpcomingEvents: no implementado todavía (Fase 0)");
}

export async function getPendingPayments(_userId) {
  throw new Error("db.getPendingPayments: no implementado todavía (Fase 0)");
}

export async function createEvent(_userId, _event) {
  throw new Error("db.createEvent: no implementado todavía (Fase 0)");
}

export async function createPayment(_userId, _payment) {
  throw new Error("db.createPayment: no implementado todavía (Fase 0)");
}
