# Parser de mensajes

Prototipo del componente que convierte un mensaje de WhatsApp en lenguaje
natural en una accion estructurada (evento, entrega, cobro, consulta,
modificacion, cancelacion).

Usa la Claude API con tool use (structured output via JSON schema) para
que la extraccion sea siempre un JSON valido con los mismos campos, en vez
de parsear texto libre con regex.

## Setup

```bash
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...
```

## Uso

```python
from parser import MessageParser

parser = MessageParser()
resultado = parser.parse_message("reunion con cliente Perez viernes 15hs")
print(resultado)
```

## Tests

```bash
python run_tests.py
```

Corre los 20 casos de test_cases.json (8 del brief + 12 casos limite) y
muestra un resumen PASS/FAIL. No se corrio todavia en este entorno porque
no hay ANTHROPIC_API_KEY configurada aca -- correlo con tu propia key.

## Casos limite conocidos

1. Fechas ambiguas sin cliente (caso 10): el modelo tiene que resistir la
   tentacion de inventar una fecha concreta.
2. Mensajes con dos intenciones juntas (casos 11 y 15): hoy el schema solo
   devuelve una accion principal mas un flag acciones_multiples.
3. Referencias sin contexto de conversacion (caso 9: "cancelalo"): el parser
   analiza un mensaje aislado, sin historial.
4. Distinguir cobro pendiente vs. ya pagado (caso 17: "Perez me pago los 50
   lucas").
