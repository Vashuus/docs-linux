#!/usr/bin/env bash
#
# service-status.sh — Estado de servicios systemd (o resumen de fallidos).
#
# Requisitos: systemd (systemctl)
# Confiabilidad estimada de funcionar correctamente en todos los entornos (Debian/Ubuntu): 95%
# Solo lectura: no modifica el sistema.
#
set -euo pipefail

usage() {
  cat <<'EOF'
Uso: service-status.sh [SERVICIO...]

Sin argumentos, muestra un resumen y lista las unidades fallidas.
Con nombres, informa active/enabled de cada uno.

Ejemplos:
  ./service-status.sh
  ./service-status.sh nginx ssh docker
EOF
}

case "${1:-}" in
  -h|--help) usage; exit 0 ;;
esac

have() { command -v "$1" >/dev/null 2>&1; }
have systemctl || { echo "Error: se requiere systemd/systemctl." >&2; exit 1; }

if [ "$#" -eq 0 ]; then
  echo ">> Resumen del sistema:"
  printf '  Unidades cargadas: %s\n' "$(systemctl list-units --type=service --no-legend 2>/dev/null | wc -l)"
  printf '  Unidades fallidas: %s\n' "$(systemctl list-units --type=service --state=failed --no-legend 2>/dev/null | wc -l)"
  echo
  echo ">> Unidades fallidas:"
  systemctl --failed --no-pager || true
  echo
  echo "Volvé a correr con nombres, p.ej.: ./service-status.sh nginx ssh docker"
  exit 0
fi

printf '%-24s %-12s %s\n' "SERVICIO" "ACTIVO" "HABILITADO"
printf '%-24s %-12s %s\n' "--------" "------" "----------"

rc=0
for svc in "$@"; do
  active="$(systemctl is-active "$svc" 2>/dev/null || true)"
  enabled="$(systemctl is-enabled "$svc" 2>/dev/null || true)"
  printf '%-24s %-12s %s\n' "$svc" "${active:-desconocido}" "${enabled:-desconocido}"
  [ "$active" = "active" ] || rc=1
done

echo
[ "$rc" -eq 0 ] && echo ">> Todos activos." || echo ">> Hay servicios que NO están activos."
exit "$rc"
