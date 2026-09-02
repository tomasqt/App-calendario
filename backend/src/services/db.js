/**
 * Cliente de base de datos (Supabase).
 *
 * Ver ../../db/schema.sql para el esquema completo y ../../db/README.md
 * para como aplicarlo. Usa la service_role key (bypassea RLS) porque
 * quien escribe es el webhook de WhatsApp, no un usuario logueado.
 */

import { createClient } from "@supabase/supabase-js";

let _client = null;

function getClient() {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno. Ver backend/db/README.md."
    );
  }

  _client = createClient(url, key);
  return _client;
}

/** Busca (o crea) el usuario asociado a un numero de WhatsApp. */
export async function getOrCreateUsuario(telefonoWhatsapp) {
  const supabase = getClient();

  const { data: existente, error: errBusqueda } = await supabase
    .from("usuarios")
    .select("*")
    .eq("telefono_whatsapp", telefonoWhatsapp)
    .maybeSingle();

  if (errBusqueda) throw errBusqueda;
  if (existente) return existente;

  const { data: nuevo, error: errCreacion } = await supabase
    .from("usuarios")
    .insert({ telefono_whatsapp: telefonoWhatsapp })
    .select()
    .single();

  if (errCreacion) throw errCreacion;
  return nuevo;
}

/** Busca (o crea) un cliente por nombre, scoped al usuario. */
export async function getOrCreateCliente(usuarioId, nombreCliente) {
  const supabase = getClient();

  const { data: existente, error: errBusqueda } = await supabase
    .from("clientes")
    .select("*")
    .eq("usuario_id", usuarioId)
    .eq("nombre", nombreCliente)
    .maybeSingle();

  if (errBusqueda) throw errBusqueda;
  if (existente) return existente;

  const { data: nuevo, error: errCreacion } = await supabase
    .from("clientes")
    .insert({ usuario_id: usuarioId, nombre: nombreCliente })
    .select()
    .single();

  if (errCreacion) throw errCreacion;
  return nuevo;
}

/** Eventos (reuniones/entregas) desde hoy en adelante, para el resumen semanal. */
export async function getUpcomingEvents(usuarioId, { desde, hasta } = {}) {
  const supabase = getClient();

  let query = supabase
    .from("eventos")
    .select("*, clientes(nombre)")
    .eq("usuario_id", usuarioId)
    .neq("estado", "cancelado")
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true, nullsFirst: true });

  if (desde) query = query.gte("fecha", desde);
  if (hasta) query = query.lte("fecha", hasta);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/** Cobros pendientes, para el panel de "que me deben". */
export async function getPendingPayments(usuarioId) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from("cobros")
    .select("*, clientes(nombre)")
    .eq("usuario_id", usuarioId)
    .eq("estado", "pendiente")
    .order("fecha_vencimiento", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data;
}

/** Crea un evento (reunion o entrega) a partir de la accion parseada. */
export async function createEvent(usuarioId, { clienteId, tipo, titulo, fecha, hora, notas }) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from("eventos")
    .insert({
      usuario_id: usuarioId,
      cliente_id: clienteId ?? null,
      tipo,
      titulo,
      fecha,
      hora: hora ?? null,
      notas: notas ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Crea un cobro pendiente a partir de la accion parseada. */
export async function createPayment(usuarioId, { clienteId, monto, moneda, fechaVencimiento, notas }) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from("cobros")
    .insert({
      usuario_id: usuarioId,
      cliente_id: clienteId,
      monto,
      moneda: moneda ?? "ARS",
      fecha_vencimiento: fechaVencimiento ?? null,
      notas: notas ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Marca un cobro como pagado. */
export async function markPaymentAsPaid(cobroId, fechaPago = new Date().toISOString().slice(0, 10)) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from("cobros")
    .update({ estado: "pagado", fecha_pago: fechaPago })
    .eq("id", cobroId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Guarda un mensaje de WhatsApp (entrante o saliente) junto con la accion parseada, si la hay. */
export async function logMensaje(usuarioId, { direccion, contenido, accionParseada, eventoId, cobroId }) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from("mensajes")
    .insert({
      usuario_id: usuarioId,
      direccion,
      contenido,
      accion_parseada: accionParseada ?? null,
      evento_id: eventoId ?? null,
      cobro_id: cobroId ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Ultimos N mensajes de un usuario, mas nuevo primero -- para dar contexto conversacional al parser. */
export async function getRecentMensajes(usuarioId, limite = 5) {
  const supabase = getClient();

  const { data, error } = await supabase
    .from("mensajes")
    .select("*")
    .eq("usuario_id", usuarioId)
    .order("creado_en", { ascending: false })
    .limit(limite);

  if (error) throw error;
  return data;
}
