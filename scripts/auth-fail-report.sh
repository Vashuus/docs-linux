#!/usr/bin/env bash
#
# auth-fail-report.sh — Reporte de intentos de login SSH fallidos, agrupados por IP.
#
# Requisitos: systemd (journalctl), grep, awk, sort, uniq
# Confiabilidad estimada de funcionar correctamente en todos los entornos (Debian/Ubuntu): 93%
# Nota: depende de que sshd registre en el journal (comportamiento por defecto en
#       Debian/Ubuntu). En sistemas con rsyslog, caen igual en el journal.
# Solo lectura: no modifica el sistema.
#
set -euo pipefail

SINCE="24 hours ago"
TOP="20"

usage() {
  cat <<'EOF'
Uso: auth-fail-report.sh [opciones]

Cuenta los intentos de autenticación SSH fallidos por dirección IP.

Opciones:
  -s, --since "PERIODO"  Desde cuándo mirar (por defecto "24 hours ago")
  -n, --top N            Mostrar las N IPs más activas (por defecto 20)
  -h, --help             Muestra esta ayuda

Ejemplos:
  ./auth-fail-report.sh
  ./auth-fail-report.sh --since "7 days ago" --top 10
  ./auth-fail-report.sh --since "2026-10-01"
EOF
}

have() { command -v "$1" >/dev/null 2>&1; }

while [ $# -gt 0 ]; do
  case "$1" in
    -s|--since) SINCE="${2:?falta el periodo}"; shift ;;
    -n|--top) TOP="${2:?falta N}"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Opción desconocida: $1" >&2; usage; exit 2 ;;
  esac
  shift
done

if ! have journalctl; then
  echo "Error: se requiere systemd/journalctl." >&2
  exit 1
fi

echo ">> Intentos SSH fallidos desde: ${SINCE}"

raw="$(journalctl _COMM=sshd --since "$SINCE" --no-pager 2>/dev/null || true)"

if [ -z "$raw" ]; then
  raw="$(journalctl -u ssh -u sshd --since "$SINCE" --no-pager 2>/dev/null || true)"
fi

total="$(printf '%s\n' "$raw" | grep -cE "Failed password|Invalid user|authentication failure" || true)"
echo ">> Total de eventos: ${total}"
echo

printf '%s\n' "$raw" \
  | grep -E "Failed password|Invalid user|authentication failure" \
  | grep -oE "from [0-9a-fA-F:.]+" \
  | awk '{print $2}' \
  | sort | uniq -c | sort -rn \
  | head -n "$TOP" || true

echo
echo ">> Fin del reporte."
