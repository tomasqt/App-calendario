"""
Parser de mensajes de WhatsApp para el Calendario Freelancer.

Convierte un mensaje en lenguaje natural (español rioplatense/latam) en una
acción estructurada: crear evento, marcar entrega, registrar cobro, responder
una consulta, actualizar o cancelar algo existente.

Usa la Claude API con "tool use" (structured output) para forzar un schema
JSON consistente en vez de parsear texto libre.

Requiere: ANTHROPIC_API_KEY en el entorno (ver ../.env.example).
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from datetime import date
from typing import Any, Optional

import anthropic

MODEL = "claude-sonnet-5"

# --- Schema de la acción extraída ---------------------------------------

EXTRACT_TOOL = {
    "name": "extraer_accion_calendario",
    "description": (
        "Extrae la acción de calendario/cobro que el usuario quiere "
        "registrar a partir de un mensaje de WhatsApp en lenguaje natural."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "intencion": {
                "type": "string",
                "enum": [
                    "reunion",
                    "entrega",
                    "cobro",
                    "consulta_semana",
                    "consulta_cobros",
                    "actualizacion",
                    "modificacion",
                    "cancelacion",
                    "no_reconocido",
                ],
                "description": "Tipo de acción que representa el mensaje.",
            },
            "titulo": {
                "type": "string",
                "description": (
                    "Descripción corta del evento/entrega/cobro, ej. "
                    "'Reunión con Pérez', 'Entregar diseño a Gómez'."
                ),
            },
            "cliente": {
                "type": ["string", "null"],
                "description": "Nombre del cliente mencionado, si hay alguno.",
            },
            "fecha": {
                "type": ["string", "null"],
                "description": (
                    "Fecha en formato ISO YYYY-MM-DD si se puede determinar "
                    "sin ambigüedad a partir de la fecha_referencia. null si "
                    "es ambigua o no se menciona."
                ),
            },
            "fecha_ambigua": {
                "type": ["string", "null"],
                "description": (
                    "Si la fecha mencionada no se puede resolver con "
                    "certeza (ej. 'el viernes' sin saber si es esta semana o "
                    "la próxima), el texto original de la referencia temporal."
                ),
            },
            "hora": {
                "type": ["string", "null"],
                "description": "Hora en formato HH:MM (24hs) si se menciona.",
            },
            "monto": {
                "type": ["number", "null"],
                "description": "Monto numérico del cobro, si aplica.",
            },
            "moneda": {
                "type": ["string", "null"],
                "description": "Moneda del monto, ej. 'ARS', 'USD'. Default ARS si no se especifica y hay monto.",
            },
            "referencia_objetivo": {
                "type": ["string", "null"],
                "description": (
                    "Para modificaciones/cancelaciones: a qué evento previo "
                    "se refiere el mensaje (ej. 'lo de Pérez', 'el martes'). "
                    "null si no aplica o si el mensaje no da suficiente "
                    "contexto para identificar el evento (requiere memoria "
                    "de conversación que el parser no tiene todavía)."
                ),
            },
            "requiere_contexto_previo": {
                "type": "boolean",
                "description": (
                    "true si el mensaje depende de un mensaje anterior en la "
                    "conversación para resolverse (ej. 'cancelalo' sin decir "
                    "qué). El parser actual no tiene memoria, así que estos "
                    "casos deben marcarse para revisión humana o para un "
                    "futuro manejo de contexto conversacional."
                ),
            },
            "acciones_multiples": {
                "type": "boolean",
                "description": (
                    "true si el mensaje contiene más de una intención junta "
                    "(ej. 'reunión con Pérez el lunes y cobrarle 20000'). "
                    "Cuando es true, 'titulo' resume la primera acción y "
                    "'notas' describe la segunda para revisión manual."
                ),
            },
            "notas": {
                "type": ["string", "null"],
                "description": "Cualquier información adicional relevante que no entra en los otros campos.",
            },
            "confianza": {
                "type": "string",
                "enum": ["alta", "media", "baja"],
                "description": "Qué tan seguro está el modelo de la extracción.",
            },
        },
        "required": ["intencion", "titulo", "confianza"],
    },
}

SYSTEM_PROMPT = """Sos el parser de mensajes de un bot de WhatsApp para \
freelancers en Argentina/LATAM. Tu única tarea es leer UN mensaje del \
usuario y extraer la acción de calendario o cobro que representa, llamando \
SIEMPRE a la herramienta extraer_accion_calendario.

Reglas importantes:
- Nunca inventes una fecha exacta si es ambigua (ej. "el viernes" sin saber \
  si es esta semana). En ese caso, fecha=null y completá fecha_ambigua con \
  el texto original.
- Si el mensaje depende de contexto de mensajes anteriores para tener \
  sentido (ej. "cancelalo", "movelo para el jueves" sin decir qué), marcá \
  requiere_contexto_previo=true y referencia_objetivo con lo poco que se \
  pueda inferir (o null).
- Si el mensaje mezcla dos intenciones (ej. agendar Y cobrar en el mismo \
  mensaje), marcá acciones_multiples=true.
- Si el mensaje informa que algo que YA estaba planificado o pendiente se \
  completó, se entregó o se cobró (ej. "listo el logo de Fernández", "ya le \
  entregué a Gómez", "Pérez me pagó los 50 lucas", "cobré lo de Martínez"), \
  usá intencion="actualizacion" (estás actualizando el estado de algo que \
  ya existía, no registrando una entrega o un cobro nuevo a agendar). Si el \
  mensaje menciona un monto, completá igual el campo monto.
- Si el mensaje no es una acción de calendario/cobro reconocible (chat \
  casual, saludo, pregunta no soportada), usá intencion="no_reconocido".
- La fecha de referencia ("hoy") para resolver términos relativos como \
  "mañana" o "el martes que viene" te la paso en el mensaje de usuario.
"""


@dataclass
class ParsedAction:
    intencion: str
    titulo: str
    confianza: str
    cliente: Optional[str] = None
    fecha: Optional[str] = None
    fecha_ambigua: Optional[str] = None
    hora: Optional[str] = None
    monto: Optional[float] = None
    moneda: Optional[str] = None
    referencia_objetivo: Optional[str] = None
    requiere_contexto_previo: bool = False
    acciones_multiples: bool = False
    notas: Optional[str] = None
    raw: dict[str, Any] = field(default_factory=dict)


class MessageParser:
    def __init__(self, api_key: Optional[str] = None):
        # Las API keys "identity-linked" (creadas con cuentas nuevas de
        # consola, ligadas a tu login en vez de a un workspace fijo)
        # requieren indicar en qué workspace actuar via este header. Si tu
        # key es de las clasicas (sk-ant-...) esto no hace falta y la
        # variable de entorno puede quedar sin definir.
        extra_headers = {}
        workspace_id = os.environ.get("ANTHROPIC_WORKSPACE_ID")
        if workspace_id:
            extra_headers["anthropic-workspace-id"] = workspace_id

        self.client = anthropic.Anthropic(
            api_key=api_key or os.environ.get("ANTHROPIC_API_KEY"),
            default_headers=extra_headers or None,
        )

    def parse_message(self, mensaje: str, fecha_referencia: Optional[date] = None) -> ParsedAction:
        """Parsea un mensaje de WhatsApp y devuelve la acción estructurada.

        fecha_referencia: la fecha de "hoy" para resolver "mañana", "el
        viernes que viene", etc. Default: hoy real.
        """
        hoy = fecha_referencia or date.today()
        user_content = (
            f"Fecha de referencia (hoy): {hoy.isoformat()} ({_dia_semana_es(hoy)})\n"
            f"Mensaje del usuario: \"{mensaje}\""
        )

        response = self.client.messages.create(
            model=MODEL,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            tools=[EXTRACT_TOOL],
            tool_choice={"type": "tool", "name": "extraer_accion_calendario"},
            messages=[{"role": "user", "content": user_content}],
        )

        for block in response.content:
            if block.type == "tool_use" and block.name == "extraer_accion_calendario":
                data = block.input
                return ParsedAction(
                    intencion=data.get("intencion", "no_reconocido"),
                    titulo=data.get("titulo", ""),
                    confianza=data.get("confianza", "baja"),
                    cliente=data.get("cliente"),
                    fecha=data.get("fecha"),
                    fecha_ambigua=data.get("fecha_ambigua"),
                    hora=data.get("hora"),
                    monto=data.get("monto"),
                    moneda=data.get("moneda"),
                    referencia_objetivo=data.get("referencia_objetivo"),
                    requiere_contexto_previo=bool(data.get("requiere_contexto_previo", False)),
                    acciones_multiples=bool(data.get("acciones_multiples", False)),
                    notas=data.get("notas"),
                    raw=data,
                )

        raise RuntimeError("El modelo no devolvió un tool_use válido para extraer_accion_calendario")


_DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]


def _dia_semana_es(d: date) -> str:
    return _DIAS[d.weekday()]


if __name__ == "__main__":
    parser = MessageParser()
    ejemplo = "reunión con cliente Pérez viernes 15hs"
    resultado = parser.parse_message(ejemplo)
    print(json.dumps(resultado.raw, indent=2, ensure_ascii=False))

