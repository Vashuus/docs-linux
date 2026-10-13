#!/usr/bin/env bash
#
# docker-cleanup.sh — Limpia recursos Docker sin usar (con simulación por defecto).
#
# Requisitos: docker
# Confiabilidad estimada de funcionar correctamente en todos los entornos (Debian/Ubuntu): 90%
# Por seguridad corre en modo SIMULACIÓN salvo que pases --apply.
#   --volumes es aparte y destructivo: borra volúmenes huérfanos (pide confirmación).
#
set -euo pipefail

APPLY=0
VOLUMES=0

usage() {
  cat <<'EOF'
Uso: docker-cleanup.sh [opciones]

Limpia recursos Docker sin usar. Por defecto SOLO simula; no borra nada.

Opciones:
  --apply      Ejecuta la limpieza (contenedores detenidos, redes,
               build cache e imágenes dangling).
  --volumes    Incluye volúmenes huérfanos (DESTRUCTIVO, pide confirmación).
  -h, --help   Muestra esta ayuda

Ejemplos:
  ./docker-cleanup.sh              # simulación
  ./docker-cleanup.sh --apply
  ./docker-cleanup.sh --apply --volumes
EOF
}

have() { command -v "$1" >/dev/null 2>&1; }

while [ $# -gt 0 ]; do
  case "$1" in
    --apply) APPLY=1 ;;
    --volumes) VOLUMES=1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Opción desconocida: $1" >&2; usage; exit 2 ;;
  esac
  shift
done

have docker || { echo "Error: se requiere docker." >&2; exit 1; }
docker info >/dev/null 2>&1 || { echo "Error: no se puede hablar con el daemon de Docker." >&2; exit 1; }

echo ">> Uso actual de Docker:"
docker system df || true
echo

if [ "$APPLY" -eq 0 ]; then
  echo ">> MODO SIMULACIÓN. Se limpiaría:"
  echo "   - contenedores detenidos, redes sin uso, build cache e imágenes dangling"
  [ "$VOLUMES" -eq 1 ] && echo "   - volúmenes huérfanos (DESTRUCTIVO)"
  echo
  echo "   Volvé a correr con --apply para ejecutarlo."
  exit 0
fi

echo ">> Limpiando contenedores detenidos, redes, build cache e imágenes dangling..."
docker container prune -f
docker network prune -f
docker image prune -f
docker builder prune -f

if [ "$VOLUMES" -eq 1 ]; then
  echo
  read -r -p "¿Borrar también volúmenes huérfanos? Esto es irreversible [s/N] " ans
  case "$ans" in
    s|S|y|Y) docker volume prune -f ;;
    *) echo ">> Volúmenes omitidos." ;;
  esac
fi

echo
echo ">> Uso de Docker tras la limpieza:"
docker system df || true
