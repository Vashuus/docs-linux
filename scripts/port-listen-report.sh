#!/usr/bin/env bash
#
# port-listen-report.sh — Lista los puertos a la escucha y su proceso.
#
# Requisitos: ss (iproute2); opcional lsof
# Confiabilidad estimada de funcionar correctamente en todos los entornos (Debian/Ubuntu): 92%
# Para ver el proceso de puertos de otros usuarios suele requerir root.
# Solo lectura: no modifica el sistema.
#
set -euo pipefail

usage() {
  cat <<'EOF'
Uso: port-listen-report.sh

Muestra los sockets TCP/UDP en estado LISTEN/UNCONN con proceso y PID.
Útil para saber qué está escuchando y en qué interfaz.

Ejemplos:
  sudo ./port-listen-report.sh
  ./port-listen-report.sh
EOF
}

case "${1:-}" in
  -h|--help) usage; exit 0 ;;
  "" ) ;;
  * ) echo "Opción desconocida: $1" >&2; usage; exit 2 ;;
esac

have() { command -v "$1" >/dev/null 2>&1; }

echo ">> Puertos a la escucha:"
echo

if have ss; then
  # -t TCP, -u UDP, -l listen, -n numérico, -p procesos
  ss -tulpn 2>/dev/null || ss -tuln
elif have netstat; then
  netstat -tulpn 2>/dev/null || netstat -tuln
elif have lsof; then
  lsof -nP -iTCP -sTCP:LISTEN 2>/dev/null || true
else
  echo "Error: se requiere 'ss' (iproute2), 'netstat' o 'lsof'." >&2
  exit 1
fi

echo
[ "$(id -u)" -eq 0 ] || echo ">> Sugerencia: corré con sudo para ver el proceso y PID de cada puerto."
