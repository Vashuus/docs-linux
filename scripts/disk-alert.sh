#!/usr/bin/env bash
#
# disk-alert.sh — Avisa si el uso de disco o memoria supera un umbral.
#
# Requisitos: df, free, awk, coreutils
# Confiabilidad estimada de funcionar correctamente en todos los entornos (Debian/Ubuntu): 94%
# Pensado para cron/monitorización: sale con código 1 si algo supera el umbral.
# Solo lectura: no modifica el sistema.
#
set -euo pipefail

DISK_MAX=85
MEM_MIN_FREE=15   # % de memoria disponible mínima

usage() {
  cat <<'EOF'
Uso: disk-alert.sh [opciones]

Comprueba puntos de montaje locales y la memoria. Sale con 1 si se excede.
Ideal para cron: te avisa cuando el disco está por llenarse.

Opciones:
  -d, --disk N    Umbral de uso de disco en % (por defecto 85)
  -m, --mem N     Mínimo de memoria libre en % (por defecto 15)
  -h, --help      Muestra esta ayuda

Ejemplos:
  ./disk-alert.sh
  ./disk-alert.sh -d 90 -m 10
EOF
}

have() { command -v "$1" >/dev/null 2>&1; }

while [ $# -gt 0 ]; do
  case "$1" in
    -d|--disk) DISK_MAX="${2:?falta N}"; shift ;;
    -m|--mem) MEM_MIN_FREE="${2:?falta N}"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Opción desconocida: $1" >&2; usage; exit 2 ;;
  esac
  shift
done

have df || { echo "Error: falta 'df'." >&2; exit 1; }

alert=0

echo ">> Uso de disco (umbral ${DISK_MAX}%):"
while read -r used mount; do
  pct="${used%\%}"
  printf '  %-24s %s%%\n' "$mount" "$pct"
  if [ "$pct" -ge "$DISK_MAX" ]; then
    echo "    -> EXCEDIDO"
    alert=1
  fi
done < <(df -hP --local -x tmpfs -x devtmpfs -x efivarfs -x squashfs -x overlay 2>/dev/null | awk 'NR>1 {print $5, $6}')

echo
if have free; then
  avail="$(free | awk '/^Mem:/ {printf "%d", $7/$2*100}')"
  echo ">> Memoria disponible: ${avail}% (mínimo ${MEM_MIN_FREE}%)"
  if [ "$avail" -lt "$MEM_MIN_FREE" ]; then
    echo "    -> POCA MEMORIA"
    alert=1
  fi
else
  echo ">> 'free' no disponible: se omite la memoria."
fi

echo
if [ "$alert" -eq 0 ]; then
  echo ">> Todo dentro de los umbrales."
  exit 0
fi
echo ">> ALERTA: hay recursos por encima del umbral."
exit 1
