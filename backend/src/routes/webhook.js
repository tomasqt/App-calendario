import { Router } from "express";

import { sendWhatsAppMessage } from "../services/whatsapp.js";

const router = Router();

/**
 * Verificación del webhook (Meta hace un GET con un challenge la primera
 * vez que se configura el endpoint en el panel de WhatsApp Cloud API).
 * https://developers.facebook.com/docs/graph-api/webhooks/getting-started
 */
router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

/**
 * Mensajes entrantes de WhatsApp. Meta manda un POST por cada mensaje.
 *
 * TODO (Fase 1):
 *   1. Extraer el texto del mensaje y el número del remitente del payload.
 *   2. Mandarlo al parser (parser/parser.py, vía subprocess o reescrito en
 *      JS/llamado como microservicio) para extraer la acción estructurada.
 *   3. Persistir la acción en la base (Supabase) según la intención.
 *   4. Responder al usuario confirmando (sendWhatsAppMessage).
 */
router.post("/", async (req, res) => {
  // Confirmamos recepción a Meta inmediatamente (debe responder rápido).
  res.sendStatus(200);

  const entry = req.body?.entry?.[0];
  const change = entry?.changes?.[0]?.value;
  const message = change?.messages?.[0];

  if (!message) return; // status updates (delivered/read) no traen "messages"

  const from = message.from; // número de WhatsApp del usuario
  const text = message.text?.body;

  console.log(`Mensaje de ${from}: ${text}`);

  // Placeholder: eco simple hasta que esté conectado el parser + DB.
  if (text) {
    await sendWhatsAppMessage(from, `Recibido: "${text}" (procesamiento todavía no conectado)`);
  }
});

export default router;
