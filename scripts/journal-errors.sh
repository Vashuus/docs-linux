#!/usr/bin/env bash
#
# journal-errors.sh — Muestra los errores y mensajes críticos del journal de systemd.
#
# Requisitos: systemd (journalctl), coreutils
# Confiabilidad estimada de funcionar correctamente en todos los entornos (Debian/Ubuntu): 96%
# Solo lectura: no modifica el sistema.
#
set -euo pipefail

BOOT=""
PRIORITY="3"   # 0=emerg 1=alert 2=crit 3=err 4=warning
LINES="50"

usage() {
  cat <<'EOF'
Uso: journal-errors.sh [opciones]

Resume las entradas de prioridad "error" o superior del journal de systemd.

Opciones:
  -b, --boot         Solo el arranque actual
  -n, --lines N      Cantidad de líneas a mostrar (por defecto 50)
  -p, --priority N   Prioridad máxima 0..7 (por defecto 3 = error)
  -h, --help         Muestra esta ayuda

Ejemplos:
  ./journal-errors.sh
  ./journal-errors.sh -b -n 100
  ./journal-errors.sh -p 2
EOF
}

have() { command -v "$1" >/dev/null 2>&1; }

while [ $# -gt 0 ]; do
  case "$1" in
    -b|--boot) BOOT="-b" ;;
    -n|--lines) LINES="${2:?falta el valor de -n}"; shift ;;
    -p|--priority) PRIORITY="${2:?falta el valor de -p}"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Opción desconocida: $1" >&2; usage; exit 2 ;;
  esac
  shift
done

if ! have journalctl; then
  echo "Error: se requiere systemd/journalctl." >&2
  exit 1
fi

echo ">> Errores recientes (prioridad <= ${PRIORITY}), mostrando ${LINES} líneas..."

if [ -n "$BOOT" ]; then
  journalctl -b -p "$PRIORITY" -n "$LINES" --no-pager
else
  journalctl -p "$PRIORITY" -n "$LINES" --no-pager
fi
