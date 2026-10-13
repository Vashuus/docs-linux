#!/usr/bin/env bash
#
# container-shell.sh — Abre una shell interactiva dentro de un contenedor.
#
# Requisitos: docker
# Confiabilidad estimada de funcionar correctamente en todos los entornos (Debian/Ubuntu): 93%
# Solo abre una sesión; no modifica el contenedor salvo lo que hagas dentro.
#
set -euo pipefail

usage() {
  cat <<'EOF'
Uso: container-shell.sh [CONTENEDOR]

Entra al contenedor indicado (por nombre o ID) detectando bash o sh.
Sin argumento, lista los contenedores en ejecución.

Ejemplos:
  ./container-shell.sh
  ./container-shell.sh mi_app
EOF
}

case "${1:-}" in
  -h|--help) usage; exit 0 ;;
esac

have() { command -v "$1" >/dev/null 2>&1; }
have docker || { echo "Error: se requiere docker." >&2; exit 1; }

name="${1:-}"

if [ -z "$name" ]; then
  echo ">> Contenedores en ejecución:"
  docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
  echo
  echo "Volvé a correr: ./container-shell.sh <nombre>"
  exit 0
fi

if ! docker inspect "$name" >/dev/null 2>&1; then
  echo "Error: no existe el contenedor '$name'." >&2
  exit 1
fi

state="$(docker inspect -f '{{.State.Running}}' "$name")"
if [ "$state" != "true" ]; then
  echo "Error: el contenedor '$name' no está en ejecución." >&2
  echo "Inicialo con: docker start $name" >&2
  exit 1
fi

echo ">> Entrando a '$name'..."
exec docker exec -it "$name" sh -c 'if command -v bash >/dev/null 2>&1; then exec bash; else exec sh; fi'
