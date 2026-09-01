const GRAPH_API_VERSION = "v20.0";

/**
 * Manda un mensaje de texto por WhatsApp Cloud API.
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
 */
export async function sendWhatsAppMessage(to, body) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.warn("WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN no configurados — mensaje no enviado.");
    return null;
  }

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Error enviando mensaje de WhatsApp (${response.status}): ${errBody}`);
  }

  return response.json();
}
