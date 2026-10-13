#!/usr/bin/env bash
#
# docker-health.sh — Estado de salud y consumo de los contenedores Docker.
#
# Requisitos: docker
# Confiabilidad estimada de funcionar correctamente en todos los entornos (Debian/Ubuntu): 95%
# Solo lectura: no modifica contenedores.
#
set -euo pipefail

usage() {
  cat <<'EOF'
Uso: docker-health.sh

Muestra, para cada contenedor (incluidos los detenidos):
  - estado, reinicios y salud (healthcheck)
  - imagen
Y al final un resumen de consumo instantáneo.

Ejemplos:
  ./docker-health.sh
EOF
}

case "${1:-}" in
  -h|--help) usage; exit 0 ;;
  "") ;;
  *) echo "Opción desconocida: $1" >&2; usage; exit 2 ;;
esac

have() { command -v "$1" >/dev/null 2>&1; }
have docker || { echo "Error: se requiere docker." >&2; exit 1; }
docker info >/dev/null 2>&1 || { echo "Error: no se puede hablar con el daemon de Docker." >&2; exit 1; }

if [ -z "$(docker ps -aq)" ]; then
  echo ">> No hay contenedores en este host."
  exit 0
fi

printf '%-28s %-10s %-10s %-6s %s\n' "CONTENEDOR" "ESTADO" "SALUD" "RST" "IMAGEN"
printf '%-28s %-10s %-10s %-6s %s\n' "----------" "------" "-----" "---" "------"

while read -r id; do
  [ -n "$id" ] || continue
  name="$(docker inspect -f '{{.Name}}' "$id" | sed 's|^/||')"
  state="$(docker inspect -f '{{.State.Status}}' "$id")"
  restarts="$(docker inspect -f '{{.RestartCount}}' "$id")"
  health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}-{{end}}' "$id")"
  image="$(docker inspect -f '{{.Config.Image}}' "$id")"
  printf '%-28s %-10s %-10s %-6s %s\n' "$name" "$state" "$health" "$restarts" "$image"
done < <(docker ps -aq)

echo
echo ">> Consumo instantáneo:"
docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}' 2>/dev/null || true
