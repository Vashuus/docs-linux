#!/usr/bin/env bash
#
# log-size-report.sh — Reporte del tamaño de los logs del sistema.
#
# Requisitos: coreutils (du, sort, head), find
# Confiabilidad estimada de funcionar correctamente en todos los entornos (Debian/Ubuntu): 97%
# Solo lectura: no modifica el sistema.
#
set -euo pipefail

DIR="/var/log"
TOP="20"

usage() {
  cat <<'EOF'
Uso: log-size-report.sh [opciones]

Lista los archivos y directorios de log más pesados.

Opciones:
  -d, --dir RUTA   Directorio a analizar (por defecto /var/log)
  -n, --top N      Mostrar los N más pesados (por defecto 20)
  -h, --help       Muestra esta ayuda

Ejemplos:
  ./log-size-report.sh
  ./log-size-report.sh -d /var/log/nginx -n 10
EOF
}

have() { command -v "$1" >/dev/null 2>&1; }

while [ $# -gt 0 ]; do
  case "$1" in
    -d|--dir) DIR="${2:?falta la ruta}"; shift ;;
    -n|--top) TOP="${2:?falta N}"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Opción desconocida: $1" >&2; usage; exit 2 ;;
  esac
  shift
done

for c in du sort head; do
  have "$c" || { echo "Error: falta '$c'." >&2; exit 1; }
done

[ -d "$DIR" ] || { echo "Error: no existe el directorio '$DIR'." >&2; exit 1; }

echo ">> Tamaño total de ${DIR}:"
du -sh "$DIR" 2>/dev/null || true
echo

echo ">> Top ${TOP} archivos/directorios más pesados:"
du -ah "$DIR" 2>/dev/null | sort -rh | head -n "$TOP" || true

echo
echo ">> Fin del reporte."
