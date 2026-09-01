"""
Corre parser.py contra parser/test_cases.json e imprime un resumen
PASS/FAIL por caso, agrupado por 'brief' (los 8 ejemplos del brief) y
'limite' (12 casos limite que probablemente van a requerir ajuste de
prompt).

Uso:
    export ANTHROPIC_API_KEY=sk-ant-...
    python run_tests.py
"""

from __future__ import annotations

import json
import sys
from datetime import date
from pathlib import Path

from parser import MessageParser, ParsedAction

CASES_PATH = Path(__file__).parent / "test_cases.json"


def _check(expected: dict, actual: ParsedAction) -> tuple[bool, list[str]]:
    """Compara solo las claves presentes en `expected` contra `actual`."""
    diffs = []
    for key, expected_value in expected.items():
        actual_value = getattr(actual, key, None)
        if actual_value != expected_value:
            diffs.append(f"  {key}: esperado={expected_value!r} obtenido={actual_value!r}")
    return (len(diffs) == 0, diffs)


def main() -> int:
    data = json.loads(CASES_PATH.read_text(encoding="utf-8"))
    fecha_ref = date.fromisoformat(data["fecha_referencia"])
    casos = data["casos"]

    try:
        parser = MessageParser()
    except Exception as exc:  # noqa: BLE001
        print(f"No se pudo inicializar el parser (falta ANTHROPIC_API_KEY?): {exc}")
        return 1

    resultados = {"brief": [0, 0], "limite": [0, 0]}  # grupo: [pass, total]

    for caso in casos:
        grupo = caso.get("grupo", "otro")
        resultados.setdefault(grupo, [0, 0])
        resultados[grupo][1] += 1

        try:
            actual = parser.parse_message(caso["mensaje"], fecha_referencia=fecha_ref)
        except Exception as exc:  # noqa: BLE001
            print(f"[{caso['id']:2d}] ERROR llamando al modelo: {exc}")
            continue

        ok, diffs = _check(caso["expected"], actual)
        estado = "PASS" if ok else "FAIL"
        if ok:
            resultados[grupo][0] += 1

        desc = caso.get("descripcion", "")
        print(f"[{caso['id']:2d}][{grupo:6s}][{estado}] \"{caso['mensaje']}\"" + (f"  ({desc})" if desc else ""))
        if not ok:
            for d in diffs:
                print(d)
            print(f"  -> output completo: {json.dumps(actual.raw, ensure_ascii=False)}")

    print("\n--- Resumen ---")
    total_pass = total_all = 0
    for grupo, (p, t) in resultados.items():
        print(f"{grupo}: {p}/{t}")
        total_pass += p
        total_all += t
    print(f"TOTAL: {total_pass}/{total_all}")

    return 0 if total_pass == total_all else 1


if __name__ == "__main__":
    sys.exit(main())
