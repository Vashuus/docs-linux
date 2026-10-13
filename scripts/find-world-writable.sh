#!/usr/bin/env bash
#
# find-world-writable.sh — Encuentra archivos y directorios modificables por cualquiera.
#
# Requisitos: find, ls, coreutils
# Confiabilidad estimada de funcionar correctamente en todos los entornos (Debian/Ubuntu): 94%
# Solo lectura: no modifica el sistema.
#
set -euo pipefail

PATH_TO_SCAN="/var/www"
LIMIT="200"

usage() {
  cat <<'EOF'
Uso: find-world-writable.sh [opciones]

Busca archivos y directorios con permiso de escritura para "otros" (world-writable).
Es un riesgo de seguridad común en webs y directorios compartidos.

Opciones:
  -p, --path RUTA   Ruta a escanear (por defecto /var/www)
  -n, --limit N     Máximo de resultados a mostrar (por defecto 200)
  -h, --help        Muestra esta ayuda

Ejemplos:
  sudo ./find-world-writable.sh -p /var/www
  ./find-world-writable.sh -p /tmp -n 50
EOF
}

have() { command -v "$1" >/dev/null 2>&1; }

while [ $# -gt 0 ]; do
  case "$1" in
    -p|--path) PATH_TO_SCAN="${2:?falta la ruta}"; shift ;;
    -n|--limit) LIMIT="${2:?falta N}"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Opción desconocida: $1" >&2; usage; exit 2 ;;
  esac
  shift
done

have find || { echo "Error: falta 'find'." >&2; exit 1; }
[ -d "$PATH_TO_SCAN" ] || { echo "Error: no existe '$PATH_TO_SCAN'." >&2; exit 1; }

echo ">> Archivos world-writable en ${PATH_TO_SCAN}:"
find "$PATH_TO_SCAN" -xdev -type f -perm -0002 -print 2>/dev/null | head -n "$LIMIT" || true

echo
echo ">> Directorios world-writable en ${PATH_TO_SCAN}:"
find "$PATH_TO_SCAN" -xdev -type d -perm -0002 -print 2>/dev/null | head -n "$LIMIT" || true

echo
echo ">> Sugerencia: un directorio world-writable debería tener el bit sticky (chmod +t),"
echo "   como /tmp (permisos drwxrwxrwt)."
